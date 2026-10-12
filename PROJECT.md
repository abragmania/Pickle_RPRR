# PROJECT.md — Pickle RR status tracker and specs (read at startup with CLAUDE.md)

## Part 1 — Tracker (one line per item; rewritten at checkpoints, never play-by-play; finished items move to ARCHIVE.md at the next checkpoint)

### Done since the last checkpoint
- Weekly audit 2026-10-12 applied: tools/session_start.sh updated to template version 4, and the four agent files gained the waiting-and-budget line (no verification skipped to save budget).

### In progress
- Nothing.

### Next
1. Wait for Adam's answers on the two Waiting items and for his next request.

### Waiting on Adam (each runs on its default until he answers; raised again at every checkpoint)
- 🔴 1. Un-minify the one-line functions in index.html source (retro gap 4)? Default: leave as is, new code is written readable. Lean: yes, as its own commit once the tests exist.
- 🔴 2. Replace the "Demo " name-prefix check with a demo flag on the game, and set the champion where finals scores change instead of while drawing (retro gap 5)? Default: keep as is. Lean: yes.

- 🔴 3. The global rules require all eight standard agents; this one-page app keeps four (your 2026-10-06 light-kit ruling). Rule it an exception, or add the plan, scout, trim and freshness files? Default: keep four. Lean: file the exception.

### Watch (found, not started; one fix each)
- Retro 2026-10-10 gaps 1-3 (scores never validated, no tests, duplicated payouts) are fixed; gaps 4 (minified functions) and 5 (demo found by name, champion set while drawing) are the two Waiting items.
### FIRST LAPTOP SESSION BACK (run without being asked; delete each line when done)
- If this machine had a copy from before 2026-10-06, run `git fetch origin && git reset --soft origin/main` once (the history was replaced by one commit), then delete this line.

<!-- tracker ends -->

## Part 2 — Build plan
Finished; there is no open plan. Every step is in ARCHIVE.md.

## Part 3 — Specs (the standing reference for reviewers)
- **Files:** `index.html` holds the app (markup, styles, screen code). `logic.js` holds the pure ranking, tiebreak, finals and payout logic (plain script, importable by Node); `tests/logic.test.js` tests it (`node --test`). `sw.js` is the offline cache (network first, precaches logic.js), `manifest.webmanifest` and the icons make it installable. No build step, no packages, no server.
- **Screens:** entry (8 names, Paid boxes, Shuffle, Clear, Randomize & Run, Start); Scores (round buttons 1-7, the round's two matchups, Court 1 / Court 2 tabs, pick the winner then the losing score, or enter both by hand); Schedule (all 7 rounds, copy as text); Grid (4 player cards across, full names that shrink to fit); Standings (table, ties box, Tiebreak rules, Playoff, Finals, champions); Round Robins (saved games, backup, restore).
- **Saved data:** browser storage key `pbrr-v2` holds every game (names, paid flags, scores, tiebreak order, ties settled by hand, playoff choices, finals scores) plus a removed list; the previous copy is kept under `pbrr-v2-prev`. A share link carries one whole game in its address after `#g=`; opening one merges it in and never overwrites newer local scores.
- **Ranking:** D1 and D2 in DECISIONS.md. A tie that survives every tiebreak is settled by the user tapping who finishes ahead (stored per game); settled and tiebroken ranks are marked tb, po or =.
- **Finals:** teams come from the top 4 seeds and the chosen partner rule; 1, 3 or 5 games; champions card, header ribbon and confetti when decided.
- **Demo:** Randomize & Run fills 8 names (everyone paid), all 14 scores, a playoff choice and a finished finals, and keeps any earlier game as "(before demo)" except a previous demo.
