# PROJECT.md — Pickle RR status tracker and specs (read at startup with CLAUDE.md)

## Part 1 — Tracker (one line per item; rewritten at checkpoints, never play-by-play; finished items move to ARCHIVE.md at the next checkpoint)

### Done since the last checkpoint
- (fd37467) The address bar now refreshes at most every 1.5 seconds so Safari's limit is never hit; saving is unaffected.
- (3f6bb29) Randomize & Run no longer stacks "(before demo)" backup copies.
- (cc8ae39, e02fe0c) Every tie touching the top 4 is settled and explained in one box above Tiebreak rules; head-to-head is an optional tiebreak (D1, D2).
- (efb1f65) The logo returns to the entry screen, Start is large on its own row, Randomize & Run fills a whole demo.
- The light project kit (router, tracker, rulings, archive, four agents, session start, doc gate) was added on 2026-10-07.

### In progress
- Nothing.

### Next
1. No planned work. Wait for Adam's next request; ideas he declined or deferred are not on any list.

### Waiting on Adam (each runs on its default until he answers; raised again at every checkpoint)
- This public repo now also holds the project documents and agent files (scrubbed of his name, email and folder paths), though the global rule says a public repo holds only the site. Default: keep them here. Lean: keep, since the folder is the site.

### Watch (found, not started; one fix each)
- Nothing.

### FIRST LAPTOP SESSION BACK (run without being asked; delete each line when done)
- If this machine had a copy from before 2026-10-06, run `git fetch origin && git reset --soft origin/main` once (the history was replaced by one commit), then delete this line.

<!-- tracker ends -->

## Part 2 — Build plan
Finished; there is no open plan. Every step is in ARCHIVE.md.

## Part 3 — Specs (the standing reference for reviewers)
- **One file:** `index.html` holds the whole app (markup, styles, script). `sw.js` is the offline cache (network first), `manifest.webmanifest` and the three icon files make it installable. No build step, no packages, no server.
- **Screens:** entry (8 names, Paid boxes, Shuffle, Clear, Randomize & Run, Start); Scores (round buttons 1-7, the round's two matchups, Court 1 / Court 2 tabs, pick the winner then the losing score, or enter both by hand); Schedule (all 7 rounds, copy as text); Grid (4 player cards across, full names that shrink to fit); Standings (table, ties box, Tiebreak rules, Playoff, Finals, champions); Round Robins (saved games, backup, restore).
- **Saved data:** browser storage key `pbrr-v2` holds every game (names, paid flags, scores, tiebreak order, ties settled by hand, playoff choices, finals scores) plus a removed list; the previous copy is kept under `pbrr-v2-prev`. A share link carries one whole game in its address after `#g=`; opening one merges it in and never overwrites newer local scores.
- **Ranking:** D1 and D2 in DECISIONS.md. A tie that survives every tiebreak is settled by the user tapping who finishes ahead (stored per game); settled and tiebroken ranks are marked tb, po or =.
- **Finals:** teams come from the top 4 seeds and the chosen partner rule; 1, 3 or 5 games; champions card, header ribbon and confetti when decided.
- **Demo:** Randomize & Run fills 8 names (everyone paid), all 14 scores, a playoff choice and a finished finals, and keeps any earlier game as "(before demo)" except a previous demo.
