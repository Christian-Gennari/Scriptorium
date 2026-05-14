# AGENTS.md — Scriptorium

## Commands

- `npm start` — starts Express server on `http://localhost:3000` (port via `PORT` env)
- `npm run build` — bundles JS with esbuild into `public/dist/app.js`
- No tests, no lint, no typecheck configured

## Codebase

- **Single server**: `server.js` (CommonJS, Express 5)
- **TipTap WYSIWYG SPA (ES modules → esbuild bundle)**: `public/index.html` + `styles.css` + `public/js/*.js`. Bundled via `npm run build`. Module structure:
  - `js/app.js` — entry point, keyboard shortcuts, init
  - `js/state.js` — shared mutable state + cached DOM refs
  - `js/api.js` — HTTP calls to backend
  - `js/ui.js` — toast, dialog, stats, sidebar toggle, fullscreen
  - `js/settings.js` — settings CRUD, apply, panel toggle, listeners
  - `js/files.js` — file CRUD, upload, download, file list modal, drag-and-drop
  - `js/editor.js` — TipTap init, bubble menu, keyboard shortcuts
  - `js/markdown.js` — markdown ↔ HTML conversion (turndown + marked)
  - `js/audio.js` — typewriter sounds (AudioContext)
- **Storage**: plain `.md` files in `data/` — user documents are gitignored
- **Settings**: `data/settings.json` — auto-created, gitignored

## Key quirks

- Files auto-save to server with 2s debounce. Unsaved new docs show "Unsaved" but never prompt — only explicit Ctrl+S triggers the filename dialog.
- Filenames support Unicode (`\p{L}\p{N}` regex); sanitized by server via `path.basename` + regex.
- Settings PUT validates types against `SETTINGS_TYPES` map; wrong types silently dropped.
- `settings.json` merges `DEFAULT_SETTINGS` with saved overrides on read.
- Express 5, not 4 — verify middleware signatures if upgrading.

## GitHub Issues

When creating a GitHub issue, always:
1. Check existing labels with `gh label list --repo owner/repo`
2. Add relevant labels (bug/enhancement/design, priority level, etc.)

## Verify server

```bash
node server.js &
curl -s http://localhost:3000/api/files
curl -s -X POST http://localhost:3000/api/files -H 'Content-Type: application/json' -d '{"name":"test.md","content":"hello"}'
kill %1
```
