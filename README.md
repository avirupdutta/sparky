# Sparky Autocomplete Extension

Chrome Manifest V3 browser extension scaffold for inline autocomplete powered by a future local LLM endpoint.

## Stack

- Chrome Manifest V3
- React + TypeScript
- Vite multi-entry build
- Tailwind CSS
- shadcn/ui-style components
- Local HTTP completion provider seam

## Project structure

```text
src/background/   MV3 service worker and message router
src/content/      Injected autocomplete detection and ghost-text overlay
src/llm/          Local HTTP completion provider abstraction
src/options/      Full settings page
src/popup/        Extension action popup
src/shared/       Types, settings, utilities, global styles
src/components/   shadcn/ui-style primitives
public/           Manifest and static assets copied to dist
```

## Setup

```bash
pnpm install
pnpm build
```

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select the generated `dist/` directory.

## Development scripts

```bash
pnpm dev        # Vite dev build/watch experience
pnpm build      # Emits dist/ for Chrome unpacked loading
pnpm typecheck  # TypeScript check
pnpm lint       # ESLint check
```

## Autocomplete behavior

The content script listens for focused text inputs, textareas, and contenteditable fields. It sends typed context to the background service worker, which checks settings and calls the local HTTP completion provider. Suggestions are displayed as ghost text near the active field.

- `Tab` accepts a suggestion.
- `Esc` dismisses a suggestion.
- Excluded domains are configured in the options page.
- If the local endpoint is unavailable, the provider returns a mock suggestion so the scaffold remains usable.

## Local LLM integration point

Update `src/llm/local-http-provider.ts` to match your local server response format. The default request body is compatible with common generate-style APIs:

```json
{
  "model": "your-model-name",
  "prompt": "text before cursor",
  "suffix": "text after cursor",
  "stream": false
}
```

The scaffold reads `response`, `completion`, or `text` from the JSON response.
