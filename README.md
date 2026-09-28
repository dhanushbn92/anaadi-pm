# Anaadi PM

A small project tracker for Dhanush, Rishi and Keshav: projects, a Kanban board, progress, and comments.

## The app

**[docs/index.html](docs/index.html)** is the whole thing — one self-contained HTML file. No backend, no database, no build step, no accounts. It runs entirely in the browser and keeps its data in that browser's `localStorage`. (It lives in `docs/` rather than `static/` because that's one of the two folder names GitHub Pages allows.)

- On open, pick who you are (Dhanush / Rishi / Keshav) — remembered on that device, used to attribute tasks and comments. Switch anytime from the top bar.
- Create projects, track status and progress, run a To do / In progress / Done board per project (drag cards between columns), assign tasks, comment on them.
- Data is **per browser/device**, not shared between the three of you — there's no server to sync it through. Each person keeps their own board on their own device.

### Running it

Just open the file, or host it anywhere that serves static files (it needs a real `http(s)://` origin for the browser to allow storage — opening it as a bare local file works in most browsers too, but a real host is more reliable):

- **Netlify Drop**: go to [app.netlify.com/drop](https://app.netlify.com/drop) and drag `docs/index.html` in. Done — instant URL, free, no account strictly required.
- **GitHub Pages**: push this repo to GitHub, enable Pages in the repo settings (Settings → Pages → Source: Deploy from a branch → `main` / `/docs`).
- **Vercel**: `vercel deploy` from the `docs/` folder, or drag-and-drop on vercel.com.

Any of these gives you one link to open on each device.

## Other folders in this repo

`server/` and `client/` are an earlier, fuller version built with a real backend (accounts, a shared Postgres database, one deployable service). It's not what's being used now — left here only in case a real shared multi-device board is wanted later. Safe to ignore.
