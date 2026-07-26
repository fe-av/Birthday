# Abhishek's Seven-Level Birthday Quest

A seven-level browser puzzle game for a birthday party.

## Run Locally

```bash
python run_game.py
```

The script starts a local server and opens the game in your browser.

## Publish With Netlify

Use Netlify for the party version because selfie uploads and the live dashboard need Netlify functions.

1. Upload the full repo to GitHub.
2. Deploy the repo on Netlify.
3. In Netlify, go to `Site configuration > Environment variables`.
4. Add `GITHUB_TOKEN`.
5. The token needs permission to write repository contents for `fe-av/Birthday`.
6. Add `LEADERBOARD_ADMIN_CODE`.
7. Redeploy the Netlify site.

Use these links:

```text
https://YOUR-SITE.netlify.app/
https://YOUR-SITE.netlify.app/dashboard.html
```

## Game Answers

Level 1 answer: `27 July 2002`

Level 2 answer: `France`

Level 3 answer: `Forell Elsesser`

Level 4 answers: latitude `10.762`, longitude `78.816` with `0.5` tolerance

Level 5 answer: `One Direction`

Level 6: upload a selfie; Netlify function saves it to `selfies/` in this GitHub repo

Level 7 answer: `2026BLUE`

## Selfie Upload Setup

This site needs Netlify for selfie uploads. GitHub Pages alone cannot save uploads.

1. Deploy this repo on Netlify.
2. In Netlify, go to `Site configuration > Environment variables`.
3. Add `GITHUB_TOKEN`.
4. The token needs permission to write repository contents for `fe-av/Birthday`.
5. Redeploy the Netlify site.

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

To delete a player from the dashboard, click `Delete` on that row and enter the value you saved in Netlify as:

```text
LEADERBOARD_ADMIN_CODE
```
