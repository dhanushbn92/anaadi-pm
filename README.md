# Anaadi PM

A small project tracker for Dhanush, Rishi and Keshav: projects, a Kanban board, progress, and comments. The board can be shared between devices, with the data kept in a Google Sheet.

## How it fits together

- **[docs/index.html](docs/index.html)** is the whole app: one self-contained HTML file with no build step. It is hosted on GitHub Pages.
- **[apps-script/Code.gs](apps-script/Code.gs)** is a small script that lives inside a Google Sheet and acts as the board's API. The page reads and writes through it, so the Sheet *is* the database. You can open it any time to see or export the data.
- Without a Sheet connected, the page still works on its own and keeps its data in that browser only ("Local only" in the top bar).

On first open each person picks who they are (Dhanush / Rishi / Keshav). It's remembered per device and used to attribute tasks and comments. There are no passwords.

## Setting up the shared board (once)

1. Create a Google Sheet (any name, e.g. "Anaadi PM data").
2. **Extensions → Apps Script.** Delete the placeholder code and paste in the contents of [apps-script/Code.gs](apps-script/Code.gs). Save.
3. In the editor, pick **`setup`** in the function dropdown and click **Run**. Google asks for permission: choose your account, then **Advanced → Go to (project name) (unsafe) → Allow**. (It's your own script, so the warning is expected.) This creates a `data` tab in the Sheet.
4. **Deploy → New deployment → ⚙ → Web app.** Set **Execute as: Me** and **Who has access: Anyone**, then **Deploy**.
5. Copy the **Web app URL** (it ends in `/exec`).
6. Open the board, click **Local only** in the top bar, paste the URL, **Connect**.
7. Click the (now green) **Synced** button and use **Copy invite link**. Send that link to Rishi and Keshav privately. Opening it connects their device automatically.

If the Sheet is empty when you connect, whatever is already on that device is uploaded. If the Sheet already has data, it replaces the device's local copy.

### If you change `Code.gs` later

Paste the new code, then **Deploy → Manage deployments → ✎ → Version: New version → Deploy**. The URL stays the same.

## How sync behaves

- Changes show up on other devices within about 15 seconds, or straight away when you switch back to the tab. It isn't instant live editing.
- Edits are saved per field, so two people changing different things on the same task don't overwrite each other. If you both change the *same* field at the same moment, the last save wins.
- If you're offline, your changes are kept and upload automatically once you're back. The top bar shows **Offline** meanwhile.
- You can edit the Sheet by hand. It's picked up within a minute. Don't rename the header row or the `data` tab.

## Privacy

The repo and the GitHub Pages site are public, so **the Web app URL is deliberately not in the code**. It's only in the Sheet owner's Apps Script and in the invite link you send out. Anyone who has that link can read and edit the whole board, so share it only with your team. If it leaks, create a **New deployment** (a new URL) and disconnect/reconnect everyone.

## Deploying the page

GitHub Pages serves `docs/` from `main` (Settings → Pages → Deploy from a branch → `main` / `/docs`). Push to `main` and it updates in a minute or two.

## Other folders

`server/` and `client/` are an earlier version with a real backend (accounts, Postgres). They're not used now and are safe to ignore.
