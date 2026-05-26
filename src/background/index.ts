import { LocalHttpCompletionProvider } from "../llm/local-http-provider";
import { getSettings, isUrlExcluded, saveSettings } from "../shared/settings";
import type { ContentToBackgroundMessage, ExtensionSettings } from "../shared/types";

const provider = new LocalHttpCompletionProvider();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  await saveSettings(settings);
});

chrome.runtime.onMessage.addListener((message: ContentToBackgroundMessage, sender, sendResponse) => {
  void handleMessage(message, sender).then(sendResponse);
  return true;
});

async function handleMessage(message: ContentToBackgroundMessage, sender: chrome.runtime.MessageSender) {
  if (message.type === "settings/get") {
    return { type: "settings/response", payload: await getSettings() };
  }

  if (message.type === "settings/update") {
    const current = await getSettings();
    const next: ExtensionSettings = { ...current, ...message.payload };
    await saveSettings(next);
    return { type: "settings/response", payload: next };
  }

  if (message.type === "completion/request") {
    const settings = await getSettings();
    const tabId = sender.tab?.id ?? 0;

    if (!settings.enabled || isUrlExcluded(message.payload.url, settings.excludedDomains)) {
      return { type: "completion/response", payload: { suggestion: "", source: "mock" } };
    }

    clearPendingCompletion(tabId);

    return new Promise((resolve) => {
      const timer = setTimeout(async () => {
        timers.delete(tabId);
        try {
          const completion = await provider.complete(message.payload, settings);
          resolve({ type: "completion/response", payload: completion });
        } catch (error) {
          const reason = error instanceof Error ? error.message : "Unable to generate completion.";
          resolve({ type: "completion/error", error: reason });
        }
      }, settings.debounceMs);

      timers.set(tabId, timer);
    });
  }

  return { type: "completion/error", error: "Unsupported message type." };
}

function clearPendingCompletion(tabId: number) {
  const timer = timers.get(tabId);
  if (timer) {
    clearTimeout(timer);
    timers.delete(tabId);
  }
}
