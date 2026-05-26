import type { CompletionRequest, CompletionResponse, ExtensionSettings } from "../shared/types";

export type CompletionProvider = {
  complete(request: CompletionRequest, settings: ExtensionSettings): Promise<CompletionResponse>;
};

type OpenAiCompatibleResponse = {
  choices?: Array<{
    text?: string;
    message?: {
      content?: string;
    };
  }>;
  response?: string;
  completion?: string;
  text?: string;
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
          messages: [
            {
              role: "system",
              content: "You are an inline autocomplete engine. Return only the next few words that should be inserted at the cursor. Do not explain."
            },
            {
              role: "user",
              content: `Complete the text at the cursor. Return only the continuation.\n\nText before cursor:\n${request.textBeforeCursor}\n\nText after cursor:\n${request.textAfterCursor}`
            }
          ],
          temperature: 0.2,
          max_tokens: 24,
          stream: false
        })
      });

      if (!response.ok) {
        return this.mockCompletion(request);
      }

      const data = (await response.json()) as OpenAiCompatibleResponse;
      const suggestion = this.extractSuggestion(data).trimStart();

      if (!suggestion) {
        return this.mockCompletion(request);
      }

      return { suggestion, source: "local-http" };
    } catch {
      return this.mockCompletion(request);
    }
  }

  private extractSuggestion(data: OpenAiCompatibleResponse): string {
    return String(
      data.choices?.[0]?.message?.content ??
        data.choices?.[0]?.text ??
        data.response ??
        data.completion ??
        data.text ??
        ""
    );
  }

  private mockCompletion(request: CompletionRequest): CompletionResponse {
    const seed = request.textBeforeCursor.length % MOCK_SUFFIXES.length;
    return { suggestion: MOCK_SUFFIXES[seed], source: "mock" };
  }
}
