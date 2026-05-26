import type { CompletionRequest, CompletionResponse, ExtensionSettings } from "../shared/types";

export type CompletionProvider = {
  complete(request: CompletionRequest, settings: ExtensionSettings): Promise<CompletionResponse>;
};

const MOCK_SUFFIXES = [
  " and make it easy to understand.",
  " with a clear next step.",
  " so the reader knows what to do next.",
  " without adding unnecessary detail."
];

export class LocalHttpCompletionProvider implements CompletionProvider {
  async complete(request: CompletionRequest, settings: ExtensionSettings): Promise<CompletionResponse> {
    if (!settings.endpointUrl.trim()) {
      return this.mockCompletion(request);
    }

    try {
      const response = await fetch(settings.endpointUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: settings.modelName || undefined,
          prompt: request.textBeforeCursor,
          suffix: request.textAfterCursor,
          stream: false
        })
      });

      if (!response.ok) {
        return this.mockCompletion(request);
      }

      const data = (await response.json()) as { response?: string; completion?: string; text?: string };
      const suggestion = String(data.response ?? data.completion ?? data.text ?? "").trimStart();

      if (!suggestion) {
        return this.mockCompletion(request);
      }

      return { suggestion, source: "local-http" };
    } catch {
      return this.mockCompletion(request);
    }
  }

  private mockCompletion(request: CompletionRequest): CompletionResponse {
    const seed = request.textBeforeCursor.length % MOCK_SUFFIXES.length;
    return { suggestion: MOCK_SUFFIXES[seed], source: "mock" };
  }
}
