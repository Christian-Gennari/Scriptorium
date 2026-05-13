# Orison Writer — Project Plan

## Goal

A self-hosted, open-source clone of [CalmlyWriter.com/online](https://www.calmlywriter.com/online/) — a minimal, distraction-free writing environment. Accessible from anywhere via your server + VPN.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   Browser                         │
│  ┌───────────────────────────────────────────┐   │
│  │         Single-Page Application            │   │
│  │  (HTML/CSS/JS — no build step needed)     │   │
│  └───────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────┘
                       │ HTTP (REST JSON API)
┌──────────────────────▼──────────────────────────┐
│            Node.js / Express Backend             │
│  ┌───────────────────────────────────────────┐  │
│  │  File CRUD API   Settings API   Static    │  │
│  └───────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────┘
                       │ filesystem
┌──────────────────────▼──────────────────────────┐
│         data/  (Markdown files on disk)          │
│         data/settings.json (user prefs)          │
└─────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer       | Choice                     | Why                                      |
|-------------|----------------------------|------------------------------------------|
| **Backend** | Node.js + Express          | Simple API, file I/O, easy to self-host |
| **Frontend**| Vanilla HTML/CSS/JS        | Zero build step, portable, lightweight  |
| **Storage** | Flat `.md` files on disk   | Portable, no DB needed                   |
| **Deploy**  | Docker (optional) or `node` | Simple process or containerized         |

### Why Vanilla JS over a framework?

- No build tooling — instant iteration, single HTML file
- The editor is simple enough that a framework adds complexity
- Easy to understand and modify
- If the frontend grows complex, we can migrate to **Svelte** or **React** later

---

## Project Structure

```
orison-writer/
├── server.js              # Express entry point
├── package.json
├── PLAN.md                # This file
├── Dockerfile             # Optional container
├── docker-compose.yml     # Optional
├── data/                  # Markdown files storage
│   └── .gitkeep
└── public/                # SPA frontend
    ├── index.html
    ├── styles.css
    └── app.js
```

---

## Backend API Design

### Files Endpoints

| Method | Path               | Description                       |
|--------|--------------------|-----------------------------------|
| GET    | `/api/files`       | List all `.md` files in `data/`   |
| GET    | `/api/files/:name` | Get content of a specific file    |
| POST   | `/api/files`       | Create a new file (`{name, content}`) |
| PUT    | `/api/files/:name` | Save/overwrite a file             |
| DELETE | `/api/files/:name` | Delete a file                     |

### Settings Endpoints

| Method | Path                   | Description              |
|--------|------------------------|--------------------------|
| GET    | `/api/settings`        | Get user preferences     |
| PUT    | `/api/settings`        | Update user preferences  |

### Backups

Since we're self-hosted with auto-save to the server:
- **Auto-save** on every keystroke (debounced 2s)
- **localStorage** as additional offline backup layer per filename

---

## Frontend Features

### Editor
- Large textarea with clean typography
- Word count, character count, reading time in status bar
- Auto-save indicator ("Saved" / "Saving...")

### Toolbar
```
[New] [Open] [Save As] [Full screen] [Print] [Settings]
```

### Settings Panel (slide-out drawer)

| Setting               | Options / Type                                    |
|-----------------------|---------------------------------------------------|
| Theme                 | Light, Dark, Black, Sepia, Dune                   |
| Text width            | Slider (narrow → full)                            |
| Font                  | Serif, Sans-serif, Monospace, OpenDyslexic        |
| Font size             | Slider (12–32px)                                  |
| Line spacing          | Slider (1.0–2.5)                                  |
| Caret color           | Color picker                                      |
| Font color            | Color picker                                      |
| Distraction-free mode | Toggle (dims non-active paragraphs)               |
| Smart quotes          | Toggle                                            |
| Smart dashes          | Toggle                                            |
| Spell check           | Toggle (native browser spellcheck)                |
| Keyboard shortcuts    | Quick reference overlay                           |

### Other Features
- **Fullscreen**: Fullscreen API toggle
- **Print**: `window.print()` with clean print styles
- **Upload local file**: Read via `FileReader`
- **Download file**: Trigger `blob` download

---

## Keyboard Shortcuts

| Shortcut       | Action          |
|----------------|-----------------|
| Ctrl+N         | New document    |
| Ctrl+O         | Open file       |
| Ctrl+S         | Save            |
| Ctrl+Shift+S   | Save As         |
| Ctrl+P         | Print           |
| Ctrl+,         | Open Settings   |
| F11            | Fullscreen      |
| Ctrl+Shift+F   | Toggle distraction-free |

---

## Theme System

Each theme is a CSS class on `<body>` using custom properties:

```css
.theme-light  { --bg: #fff; --text: #333; }
.theme-dark   { --bg: #1e1e1e; --text: #ddd; }
.theme-black  { --bg: #000; --text: #aaa; }
.theme-sepia  { --bg: #fbf3e0; --text: #5f4b32; }
.theme-dune   { --bg: #2c2b28; --text: #bdae9d; }
```

---

## Implementation Phases

### Phase 1: Foundation
- [ ] `npm init`, install Express
- [ ] `server.js` — file CRUD + settings API + static file serving
- [ ] `data/` directory with `.gitkeep`
- [ ] Verify with `curl` — list, read, write, delete

### Phase 2: Editor Core
- [ ] `public/index.html` — minimal layout: toolbar, editor, status bar
- [ ] `public/styles.css` — typography, theme variables, status bar
- [ ] `public/app.js` — load file list, open files, save, auto-save (debounced)
- [ ] Word/character count, reading time

### Phase 3: Settings
- [ ] Settings panel UI (slide-out drawer)
- [ ] Theme switching (`document.body.className`)
- [ ] Font, text width, font size, line spacing controls
- [ ] Caret color, font color
- [ ] Persist to server + localStorage

### Phase 4: Features
- [ ] Distraction-free / Focus mode
- [ ] Fullscreen API
- [ ] Print styles (`@media print`)
- [ ] Upload local file / Download as .md
- [ ] New document flow (clear editor, prompt for name on save)

### Phase 5: Polish
- [ ] Keyboard shortcuts handler
- [ ] Auto-save indicator animation
- [ ] Error handling (server down, file conflicts)
- [ ] Mobile-responsive layout
- [ ] Dockerfile + docker-compose.yml for easy deploy

---

## Deployment

### Simple (no container)
```bash
git clone <repo>
cd orison-writer
npm install
node server.js
# -> http://localhost:3000
```

### Docker
```yaml
services:
  orison-writer:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
```

Access via `http://your-server:3000` through your VPN.

---

## Future Enhancements (v2)

- [ ] Markdown WYSIWYG rendering (not just a raw textarea)
- [ ] Multiple documents in tabs
- [ ] Writing targets (word/character goals)
- [ ] Typewriter sounds
- [ ] Export to PDF (server-side with Puppeteer)
- [ ] Search & replace within document
- [ ] Simple password auth (for non-VPN exposure)
- [ ] Git auto-commit hook on save
- [ ] Rich text toolbar (bold, italic, headings)
- [ ] Table of contents from headings

---

## Design Principles

1. **Files are plain Markdown** — editable with any text editor outside this app
2. **No lock-in** — stop using the app and your files are still readable `.md`
3. **Privacy-first** — no telemetry, no cloud, no accounts
4. **Keyboard-driven** — every major action has a shortcut
5. **Self-contained** — single server process, zero external dependencies
