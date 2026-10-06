# Pickle RR

Free 8-player rotating-partner pickleball round robin. Installs to a phone home screen, works offline, saves every score automatically, and any game can be shared as a link.

Live: https://abragmania.github.io/Pickle_RPRR/

Single static page (index.html), no build step. Schedule: 7 rounds, 2 courts; every pair partners once and opposes twice.

## How it is published

This folder is the public repository. GitHub Pages serves the `main` branch directly, so publishing is `git push` and GitHub builds the site. There is no separate site copy and no build step. Commits use the machine's global identity (the GitHub no-reply address), never a personal email.

## Setup on another machine

The history of this repository was replaced with a single commit. On any other machine that already has a copy, run `git fetch origin && git reset --soft origin/main` once in this folder (or re-clone) before the next push.
