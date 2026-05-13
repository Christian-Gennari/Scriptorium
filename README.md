# Scriptorium

A calm, private place to write.

Distraction-free writing. Self-hosted. Plain Markdown.

---

## Features

- **Distraction-free editor** — TipTap WYSIWYG with clean typography and focus mode
- **Beautiful themes** — Writer's Study, Mist, Dark, Black, Sepia, Paper
- **Customizable** — Font, size, spacing, colors — all adjustable
- **Auto-save** — Never lose a word with 2-second debounced saving
- **Keyboard-driven** — Every action has a shortcut, stay in flow
- **Your data, your way** — Files are plain `.md` on disk, no lock-in
- **Self-hosted** — One Node.js process, zero external dependencies
- **Private** — No telemetry, no cloud, no accounts

## Quick start

```bash
git clone <repo>
cd scriptorium
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000)

### Docker

```yaml
services:
  scriptorium:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
```

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| Alt+N | New document |
| Alt+O | Open file |
| Alt+S | Save |
| Alt+Shift+S | Save As |
| Alt+P | Print |
| Alt+, | Settings |
| F11 | Fullscreen |
| Alt+Shift+F | Focus mode |

## Philosophy

- **Files are plain Markdown** — editable with any text editor outside this app
- **No lock-in** — stop using Scriptorium and your files are still readable
- **Privacy-first** — no telemetry, no cloud, no accounts
- **Keyboard-driven** — stay in flow without reaching for the mouse
- **Self-contained** — one process, zero external dependencies

## Backup

See [RCLONE_SETUP.md](./RCLONE_SETUP.md) for automated backups to any cloud provider.

## License

MIT
