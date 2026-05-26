import "./content.css";
import type { BackgroundToContentMessage, CompletionRequest, EditableElementKind } from "../shared/types";

type ActiveEditable = HTMLInputElement | HTMLTextAreaElement | HTMLElement;

let activeElement: ActiveEditable | null = null;
let activeKind: EditableElementKind | null = null;
let ghost: HTMLDivElement | null = null;
let currentSuggestion = "";
let requestCounter = 0;

const inputSelector = "input:not([type]), input[type='text'], input[type='search'], input[type='email'], input[type='url'], textarea, [contenteditable=''], [contenteditable='true']";

document.addEventListener("focusin", handleFocusIn, true);
document.addEventListener("input", handleInput, true);
document.addEventListener("keydown", handleKeyDown, true);
document.addEventListener("scroll", positionGhost, true);
window.addEventListener("resize", positionGhost);

function handleFocusIn(event: FocusEvent) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const editable = findEditable(target);
  if (!editable) {
    clearSuggestion();
    return;
  }

  activeElement = editable.element;
  activeKind = editable.kind;
  requestCompletion();
}

function handleInput(event: Event) {
  if (event.target !== activeElement) return;
  clearSuggestion();
  requestCompletion();
}

function handleKeyDown(event: KeyboardEvent) {
  if (!activeElement || !currentSuggestion) return;

  if (event.key === "Escape") {
    event.preventDefault();
    clearSuggestion();
    return;
  }

  if (event.key === "Tab") {
    event.preventDefault();
    insertSuggestion(activeElement, currentSuggestion);
    clearSuggestion();
  }
}

function findEditable(target: HTMLElement): { element: ActiveEditable; kind: EditableElementKind } | null {
  const editable = target.closest(inputSelector);
  if (!editable) return null;

  if (editable instanceof HTMLTextAreaElement) return { element: editable, kind: "textarea" };
  if (editable instanceof HTMLInputElement) return { element: editable, kind: "input" };
  if (editable instanceof HTMLElement && editable.isContentEditable) return { element: editable, kind: "contenteditable" };

  return null;
}

function requestCompletion() {
  if (!activeElement || !activeKind) return;

  const context = getContext(activeElement);
  if (!context.textBeforeCursor.trim() || context.textBeforeCursor.length < 4) return;

  const requestId = ++requestCounter;
  const payload: CompletionRequest = {
    ...context,
    url: window.location.href,
    elementKind: activeKind
  };

  void chrome.runtime.sendMessage({ type: "completion/request", payload }).then((response: BackgroundToContentMessage) => {
    if (requestId !== requestCounter) return;

    if (response.type === "completion/response" && response.payload.suggestion) {
      showSuggestion(response.payload.suggestion);
    } else {
      clearSuggestion();
    }
  }).catch(() => clearSuggestion());
}

function getContext(element: ActiveEditable): { textBeforeCursor: string; textAfterCursor: string } {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const start = element.selectionStart ?? element.value.length;
    const end = element.selectionEnd ?? start;
    return {
      textBeforeCursor: element.value.slice(0, start),
      textAfterCursor: element.value.slice(end)
    };
  }

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return { textBeforeCursor: element.textContent ?? "", textAfterCursor: "" };
  }

  const range = selection.getRangeAt(0);
  const before = range.cloneRange();
  before.selectNodeContents(element);
  before.setEnd(range.startContainer, range.startOffset);

  const after = range.cloneRange();
  after.selectNodeContents(element);
  after.setStart(range.endContainer, range.endOffset);

  return { textBeforeCursor: before.toString(), textAfterCursor: after.toString() };
}

function showSuggestion(suggestion: string) {
  currentSuggestion = suggestion;

  if (!ghost) {
    ghost = document.createElement("div");
    ghost.className = "sparky-ghost";
    document.documentElement.appendChild(ghost);
  }

  ghost.textContent = suggestion;
  const shortcut = document.createElement("kbd");
  shortcut.textContent = "Tab";
  ghost.appendChild(shortcut);
  positionGhost();
}

function positionGhost() {
  if (!ghost || !activeElement) return;

  const rect = activeElement.getBoundingClientRect();
  const left = Math.min(rect.left + 12, window.innerWidth - 24);
  const top = Math.min(rect.bottom + 8, window.innerHeight - 42);

  ghost.style.left = `${Math.max(12, left)}px`;
  ghost.style.top = `${Math.max(12, top)}px`;
}

function insertSuggestion(element: ActiveEditable, suggestion: string) {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const start = element.selectionStart ?? element.value.length;
    const end = element.selectionEnd ?? start;
    element.setRangeText(suggestion, start, end, "end");
    element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: suggestion }));
    return;
  }

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  range.deleteContents();
  range.insertNode(document.createTextNode(suggestion));
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
  element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: suggestion }));
}

function clearSuggestion() {
  currentSuggestion = "";
  requestCounter++;
  ghost?.remove();
  ghost = null;
}
