# AGENTS.md — CalmlyWriterClone

## Commands

- `npm start` — starts Express server on `http://localhost:3000` (port via `PORT` env)
- No tests, no lint, no typecheck configured

## Codebase

- **Single server**: `server.js` (CommonJS, Express 5)
- **Vanilla JS SPA**: `public/index.html` + `styles.css` + `app.js` — no build step
- **Storage**: plain `.md` files in `data/` — user documents are gitignored
- **Settings**: `data/settings.json` — auto-created, gitignored

## Key quirks

- Files auto-save to server with 2s debounce. Unsaved new docs show "Unsaved" but never prompt — only explicit Ctrl+S triggers the filename dialog.
- Filenames support Unicode (`\p{L}\p{N}` regex); sanitized by server via `path.basename` + regex.
- Settings PUT validates types against `SETTINGS_TYPES` map; wrong types silently dropped.
- `settings.json` merges `DEFAULT_SETTINGS` with saved overrides on read.
- Express 5, not 4 — verify middleware signatures if upgrading.

## Verify server

```bash
node server.js &
curl -s http://localhost:3000/api/files
curl -s -X POST http://localhost:3000/api/files -H 'Content-Type: application/json' -d '{"name":"test.md","content":"hello"}'
kill %1
```
