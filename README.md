# Pickle RR

Free 8-player rotating-partner pickleball round robin. Enter 8 names, score 14 games over 7 rounds, and the app ranks everyone, finds the top 4, runs the playoff and finals, and shows payouts. It installs to a phone home screen, works offline after the first visit, saves every score automatically, and any game can be shared as a link.

Live: https://abragmania.github.io/Pickle_RPRR/

## Run
It is one static page (`index.html`) with no build step and no packages. To try a change, serve this folder (`python -m http.server 8765` in the project folder) and open `http://localhost:8765/index.html`; stop that server by its port. Check the script block with `node` by wrapping it in `new Function(...)` (there is no test suite).

## How it is published
This folder is the public repository. GitHub Pages serves the `main` branch directly, so publishing is `git push` and GitHub rebuilds the site in a few minutes. There is no separate site copy and no publish script. Commits use the machine's global identity (the GitHub no-reply address), never a personal email. History was replaced by one commit on 2026-10-06 (ARCHIVE.md).

## Saved data
Everything lives in the visitor's own browser storage; nothing is sent anywhere. Each change autosaves; removing a round robin moves it to a removed list (it can be restored or deleted for good); Clear and Randomize & Run keep a copy of the earlier game; a backup can be copied or saved from the Round Robins screen; a share link carries one whole game and merges in without overwriting newer scores.

## Two machines
GitHub is the only bridge. `.claude/settings.json` runs `tools/session_start.sh` at every context load: it pulls fast-forward only and reports what came down, uncommitted or unpushed work, the size of the router and tracker, and installs the commit check (`tools/hooks/pre-commit`). One-time per-machine steps live on the PROJECT.md tracker.
