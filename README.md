# Scriptorium

I wanted a writing app that felt quiet. No tabs, no toolbars, no
account — just me and the page. Scriptorium runs on my own server,
saves everything as plain `.md` files, and stays out of my way.

### What it does

- A clean editor with themes that don't hurt after hours of writing
  — Writer's Study, Mist, Dark, Black, Sepia, Paper
- Fonts, spacing, colors — tweak until it feels right
- Auto-saves every few seconds so you never lose anything
- Focus mode dims everything except the paragraph you're working on
- Keyboard shortcuts for everything (hit `?` to see them)

### What it doesn't do

- No accounts, no telemetry, no cloud
- No lock-in — your files are plain Markdown, readable anywhere
- No database — just a folder of `.md` files on disk

---

### Get started

```bash
git clone <repo>
cd scriptorium
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000)

Or with Docker:

```yaml
services:
  scriptorium:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
```

---

### Backups

See [RCLONE_SETUP.md](./RCLONE_SETUP.md) for automated backups to any
cloud provider.

---

MIT
