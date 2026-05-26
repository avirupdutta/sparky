import type { ExtensionSettings } from "./types";

export const SETTINGS_KEY = "sparky.autocomplete.settings";

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  endpointUrl: "http://localhost:1234/v1/chat/completions",
  modelName: "",
  debounceMs: 250,
  acceptShortcut: "Tab",
  excludedDomains: []
};

export function normalizeSettings(value: Partial<ExtensionSettings> | undefined): ExtensionSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...value,
    debounceMs: Number.isFinite(value?.debounceMs) ? Number(value?.debounceMs) : DEFAULT_SETTINGS.debounceMs,
    excludedDomains: Array.isArray(value?.excludedDomains) ? value.excludedDomains : DEFAULT_SETTINGS.excludedDomains
  };
}

export async function getSettings(): Promise<ExtensionSettings> {
  const result = await chrome.storage.sync.get(SETTINGS_KEY);
  return normalizeSettings(result[SETTINGS_KEY] as Partial<ExtensionSettings> | undefined);
}

export async function saveSettings(next: ExtensionSettings): Promise<void> {
  await chrome.storage.sync.set({ [SETTINGS_KEY]: normalizeSettings(next) });
}

export function isUrlExcluded(url: string, excludedDomains: string[]): boolean {
  if (excludedDomains.length === 0) return false;

  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return excludedDomains.some((domain) => {
      const normalized = domain.trim().toLowerCase();
      return normalized.length > 0 && (hostname === normalized || hostname.endsWith(`.${normalized}`));
    });
  } catch {
    return false;
  }
}
