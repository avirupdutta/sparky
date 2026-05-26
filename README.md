# Sparky Autocomplete Extension

Chrome Manifest V3 browser extension scaffold for inline autocomplete powered by a local LM Studio model.

## Stack

- WXT extension framework
- Chrome Manifest V3
- React + TypeScript
- Tailwind CSS
- shadcn/ui-style components
- LM Studio/OpenAI-compatible local HTTP completion provider

## Project structure

```text
entrypoints/background/   WXT MV3 service worker and message router
entrypoints/content/      Injected autocomplete detection and ghost-text overlay
entrypoints/options/      Full settings page with test textarea
entrypoints/popup/        Extension action popup
src/llm/                  Local HTTP completion provider abstraction
src/shared/               Types, settings, utilities, global styles
src/components/           shadcn/ui-style primitives
public/                   Static assets copied into WXT output
```

WXT generates the extension manifest from `wxt.config.ts` and the files in `entrypoints/`.

## Setup

```bash
pnpm install
```

## Development workflow

Start WXT dev mode for Chrome:

```bash
pnpm dev
```

WXT creates a development extension output under:

```text
.output/chrome-mv3
```

Load that folder in Chrome:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select `.output/chrome-mv3`.

Keep `pnpm dev` running while editing. WXT provides HMR for extension UI pages and fast reloads for background/content scripts.

The development browser opens `https://www.google.com` by default so the content script has a real webpage with an input field to test against. You can change this in `wxt.config.ts` under `webExt.startUrls`.

## Production build

```bash
pnpm build
```

Production output is also generated under `.output/`.

## LM Studio setup

LM Studio exposes an OpenAI-compatible local API. Start the LM Studio server and use:

```text
http://localhost:1234/v1/chat/completions
```

In the extension options page:

1. Set `Endpoint URL` to `http://localhost:1234/v1/chat/completions`.
2. Set `Model name` to the model id shown in LM Studio, or leave it blank if LM Studio routes to the loaded model.
3. Use the `Test completion textarea` to verify completions without opening another website.

## Autocomplete behavior

The content script listens for focused text inputs, textareas, and contenteditable fields. It sends typed context to the background service worker, which checks settings and calls the local HTTP completion provider. Suggestions are displayed as ghost text near the active field.

- `Tab` accepts a suggestion.
- `Esc` dismisses a suggestion.
- Excluded domains are configured in the options page.
- If LM Studio is unavailable, the provider returns a mock suggestion so the scaffold remains usable.

## Development scripts

```bash
pnpm dev             # WXT dev mode for Chrome
pnpm dev:firefox     # WXT dev mode for Firefox
pnpm build           # WXT production build for Chrome
pnpm build:firefox   # WXT production build for Firefox
pnpm zip             # Package Chrome build as a zip
pnpm typecheck       # TypeScript check
pnpm lint            # ESLint check
```
