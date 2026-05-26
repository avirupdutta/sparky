export type EditableElementKind = "input" | "textarea" | "contenteditable";

export type CompletionRequest = {
  textBeforeCursor: string;
  textAfterCursor: string;
  url: string;
  elementKind: EditableElementKind;
};

export type CompletionResponse = {
  suggestion: string;
  source: "mock" | "local-http";
};

export type ExtensionSettings = {
  enabled: boolean;
  endpointUrl: string;
  modelName?: string;
  debounceMs: number;
  acceptShortcut: "Tab";
  excludedDomains: string[];
};

export type ContentToBackgroundMessage =
  | { type: "completion/request"; payload: CompletionRequest }
  | { type: "settings/get" }
  | { type: "settings/update"; payload: Partial<ExtensionSettings> };

export type BackgroundToContentMessage =
  | { type: "completion/response"; payload: CompletionResponse }
  | { type: "completion/error"; error: string }
  | { type: "settings/response"; payload: ExtensionSettings };
