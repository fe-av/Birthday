# Abhishek's Seven-Level Birthday Quest

A seven-level browser puzzle game for a birthday party.

## Run Locally

```bash
python run_game.py
```

The script starts a local server and opens the game in your browser.

## Publish With Cloudflare Pages + Worker

Use Cloudflare Pages for the static game and a Cloudflare Worker for selfie uploads and the live dashboard.

1. Upload the full repo to GitHub.
2. In Cloudflare Pages, create a project from `fe-av/Birthday`.
3. Use these Pages build settings:

```text
Framework preset: None
Build command: leave blank
Build output directory: /
```

4. In Cloudflare Workers, create/deploy the Worker from `worker.js`.
5. Add Worker secrets:

```text
GITHUB_TOKEN
LEADERBOARD_ADMIN_CODE
```

6. Copy the deployed Worker URL. It will look like:

```text
https://birthday-quest-api.YOUR-SUBDOMAIN.workers.dev
```

7. Paste that URL into both `script.js` and `dashboard.js`:

```js
const API_BASE_URL = "https://birthday-quest-api.YOUR-SUBDOMAIN.workers.dev";
```

8. Commit/upload those updated files and redeploy Cloudflare Pages.

Use these links after Cloudflare Pages deploys:

```text
https://YOUR-PAGES-SITE.pages.dev/
https://YOUR-PAGES-SITE.pages.dev/dashboard.html
```

## Game Answers

Level 1 answer: `27 July 2002`

Level 2 answer: `France`

Level 3 answer: `Forell Elsesser`

Level 4 answers: latitude `10.762`, longitude `78.816` with `0.5` tolerance

Level 5 answer: `One Direction`

Level 6: upload a selfie; Cloudflare Worker saves it to `selfies/` in this GitHub repo

Level 7 answer: `2026BLUE`

## Selfie Upload Setup

This site needs Cloudflare Worker for selfie uploads. GitHub Pages alone cannot securely save uploads.

The Worker secret `GITHUB_TOKEN` needs permission to write repository contents for `fe-av/Birthday`.

Selfies are committed to:

```text
selfies/
```

## Live Dashboard

Open this page on a laptop or projector:

```text
/dashboard.html
```

The game sends progress updates when a team starts, unlocks a level, uploads the selfie, and finishes. The dashboard refreshes automatically every 4 seconds.

Leaderboard progress is saved to:

```text
leaderboard/progress.json
```

Selfie thumbnails show on the dashboard after Level 6 uploads succeed.

To delete a player from the dashboard, click `Delete` on that row and enter the value you saved as the Worker secret:

```text
LEADERBOARD_ADMIN_CODE
```
