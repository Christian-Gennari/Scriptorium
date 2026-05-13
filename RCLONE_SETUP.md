# Rclone Backup Setup

*Synchronize your local documents with a cloud storage provider (e.g., MEGA, Google Drive, Dropbox, S3). The steps below work on Linux, macOS, and Windows.*

## 1. Why use Rclone?

- **Independent of the app** – Backups run separate from Scriptorium, so a crash in the app cannot corrupt the backup.
- **Resumable and reliable** – Handles interrupted uploads, retries, deduplication, and optional encryption.
- **One‑way copy** – `rclone copy` adds or updates files on the remote but never deletes anything there.
- **Broad provider support** – Works with 40+ cloud services, including MEGA, Google Drive, Dropbox, Amazon S3, etc.

## 2. Install Rclone

| Platform | Command |
|----------|---------|
| **Linux (Ubuntu/Debian)** | `sudo -v && curl https://rclone.org/install.sh | sudo bash` |
| **macOS** | `brew install rclone` |
| **Windows** | Download the latest release from the [Rclone website](https://rclone.org/downloads/) and unzip the executable to a folder in your `PATH`. |

Verify the installation:

```bash
rclone version
```
You should see the version string printed without errors.

## 3. Configure a Remote (example: MEGA)

1. Run the configuration wizard: `rclone config`
2. Choose `n` → *new remote*.
3. Name the remote (e.g., `Mega`).
4. Select the storage type by typing its number (search for “mega”).
5. Leave `user` and `pass` blank – authentication will be done via a browser link.
6. The wizard prints a URL; open it in a browser, sign in to MEGA, and paste the verification code back into the terminal.
7. When asked for “Advanced config?”, answer `n`.
8. Confirm the settings with `y`.

Test the connection:

```bash
rclone ls Mega:
```
You should see a list of the files in the root of your MEGA account (or an empty list if none exist).

*The same process works for any other provider – just pick the appropriate storage type in step 4.*

## 4. Perform a Daily Backup (one‑way copy)

```bash
# Copies new/changed files from the local documents folder to the remote.
# Existing remote files are never deleted.
 rclone copy ./data/documents Mega:ScriptoriumBackup
```
- `./data/documents` – Path to the folder you want to back up (relative to the project root).
- `Mega:ScriptoriumBackup` – Remote name (`Mega`) and destination folder (`ScriptoriumBackup`).

## 5. Automate the Backup with cron (Linux/macOS)

Edit the crontab:

```bash
crontab -e
```
Add a line to run the backup every 4 hours (adjust the path if you run the command from another directory):

```cron
0 */4 * * * rclone copy /full/path/to/scriptorium/data/documents Mega:ScriptoriumBackup
```
> **Tip:** Use `pwd` to obtain the absolute path to `data/documents` if you are not running the command from the project root.

## 6. Clean Up Remote‑Deleted Files (optional)

`rclone copy` never removes files on the remote, so deleted local files stay in the backup. When you are sure a deletion is intentional, you can sync the remote to match the local state while keeping an archive of removed files.

1. **Dry‑run first** (shows what would be deleted, no changes are made):

    ```bash
    rclone sync --dry-run ./data/documents Mega:ScriptoriumBackup
    ```
2. **Run the real sync** with an archive directory for deleted items:

    ```bash
    rclone sync \
      --backup-dir Mega:Archive/$(date +%Y-%m) \
      ./data/documents Mega:ScriptoriumBackup
    ```
Deleted files are moved to a folder such as `Mega:Archive/2026-05/`. You can later prune old archives manually (e.g., keep them for 30‑90 days).

## 7. Restoring Files

| Goal | Command |
|------|---------|
| List backed‑up files | `rclone ls Mega:ScriptoriumBackup` |
| Restore a single file | `rclone copy Mega:ScriptoriumBackup/filename.md ./data/documents/` |
| Restore the entire backup | `rclone copy Mega:ScriptoriumBackup ./data/documents/` |
| Browse an archive (e.g., May 2026) | `rclone ls Mega:Archive/2026-05/` |

Replace `filename.md` with the actual file you need.

## 8. Docker Users – Where to Run Rclone

If Scriptorium runs inside Docker, the `/app/data` volume is usually a **named volume**. To back up from the host:

1. Use a bind‑mount in `docker‑compose.yml` (recommended for backup):

    ```yaml
    services:
      app:
        image: scriptorium
        volumes:
          - ./data:/app/data   # host folder ./data is mounted inside the container
    ```
2. Run `rclone` on the host, pointing at the bind‑mounted path:

    ```bash
rclone copy ./data/documents Mega:ScriptoriumBackup
# If you prefer the remote to exactly mirror the local directory, you can use `rclone sync` instead of `rclone copy`. Be aware that `sync` will delete files on the remote that no longer exist locally.
    ```

Alternatively, you can run `rclone` inside a side‑car container that shares the same volume.

## 9. Quick Reference

| Command | Effect | Deletes remote files? |
|---------|--------|-----------------------|
| `rclone copy src remote:dest` | Adds/updates files; never deletes | No |
| `rclone sync src remote:dest` | Makes remote identical to local (deletes orphaned files) | Yes |
| `rclone sync --backup-dir remote:Archive/$(date +%Y-%m)` | Sync + archives removed files | No (files go to archive) |
| `rclone --dry-run …` | Shows what would happen, without changes | N/A |

### Test Your Setup

1. Run `rclone version` – should report the installed version.
2. Run `rclone ls Mega:` – should list your remote’s root.
3. Execute a short `rclone copy` of a test file and verify it appears in `Mega:ScriptoriumBackup`.
4. (Optional) Schedule the cron job and confirm it triggers at the expected times.

You now have a reliable, automated backup pipeline using Rclone. Feel free to replace `Mega` with any other supported cloud provider by creating a new remote in step 3.
