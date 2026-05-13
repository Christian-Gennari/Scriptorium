# Rclone Backup Setup (Recommended)

> Sync your documents to MEGA.nz (or any cloud provider) for safe, automatic backups.

## Why Rclone?

-   **Decoupled** — backup runs independently of the app. An app bug can't corrupt your backups.
-   **Battle-tested** — handles resumable uploads, deduplication, encryption, retries.
-   **One-way safe** — `rclone copy` never deletes anything on the remote.
-   **Supports 40+ providers** — MEGA, Google Drive, Dropbox, S3, etc.

## Installation

```bash
# Linux (Ubuntu/Debian)
sudo -v ; curl https://rclone.org/install.sh | sudo bash

# macOS
brew install rclone

# Windows
# Download from https://rclone.org/downloads/
```

Verify: `rclone version`

## Configure MEGA.nz

```bash
rclone config
```

Follow the prompts:

1.  `n` — new remote
2.  Name: `Mega`
3.  Storage: search for `mega` and select the number
4.  Leave `user`, `pass` blank (you'll authenticate via browser or paste a link)
5.  Follow the link rclone gives you, log in to MEGA, and paste the resulting code back
6.  `n` — no advanced config
7.  `y` — confirm

Test: `rclone ls Mega:`

## Daily Backup (Safe — Never Deletes)

```bash
# One-way sync — adds/updates files remotely, never deletes anything
rclone copy ./data/documents Mega:CalmlyBackup
```

### Automate with Cron

```bash
crontab -e
# Add this line to run every 4 hours:
0 */4 * * * rclone copy /path/to/orison-writer/data/documents Mega:CalmlyBackup
```

## Monthly Cleanup (Delete Remotely-Deleted Files)

When you delete a document locally, `rclone copy` leaves it on MEGA forever. Run this **manually** after verifying your deletions were intentional:

```bash
# Dry run — see what would be deleted without actually deleting
rclone sync --dry-run ./data/documents Mega:CalmlyBackup

# If the list looks right, run for real with archive backup:
rclone sync --backup-dir Mega:Archive/$(date +%Y-%m) ./data/documents Mega:CalmlyBackup
```

This moves deleted files to `Archive/2026-05/` on MEGA instead of deleting them permanently. You can manually purge old archives after 30–90 days.

## Restoring from Backup

```bash
# List backed-up files
rclone ls Mega:CalmlyBackup

# Restore a single file
rclone copy Mega:CalmlyBackup/Whyareyou.md ./data/documents/

# Restore everything
rclone copy Mega:CalmlyBackup ./data/documents/

# Find a deleted file in an archive
rclone ls Mega:Archive/2026-04/
```

## Docker Volume Notes

If running via Docker, the documents are in a named volume. Back up from the **host** by syncing the volume's bind-mount path, or run rclone inside a sidecar container.

### Host bind mount (recommended for backup)

```yaml
# docker-compose.yml
services:
  app:
    image: orison-writer
    volumes:
      - ./data:/app/data   # ← bind mount, easy to rclone from host

Then point rclone at `./data/documents` on the host (or wherever you cloned the project).

## Quick Reference

| Command | Effect | Safe? |
|---|---|---|
| `rclone copy src Mega:dest` | Adds/updates, never deletes | ✅ |
| `rclone sync src Mega:dest` | Makes remote identical to local | ⚠️ Deletes orphaned files |
| `rclone sync --backup-dir` | Sync + archives deleted files | ✅ Safer sync |
| `rclone --dry-run ...` | Preview without changes | ✅ |
