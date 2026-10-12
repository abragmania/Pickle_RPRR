# PROJECT.md — Pickle RR status tracker and specs (read at startup with CLAUDE.md)

## Part 1 — Tracker (one line per item; rewritten at checkpoints, never play-by-play; finished items move to ARCHIVE.md at the next checkpoint)

### Done since the last checkpoint
- (4e8a49f) The one-line functions in index.html are un-minified (whitespace only, proven token-identical by script).
- Demo games carry a real `demo` flag; the champion is recomputed in touch() whenever anything that decides it changes, never while drawing; 16 Node tests including champion cases.
- logic.js is version-stamped (`logic.js?v=3` plus a load guard and a test) and sw.js revalidates files, so a stale cached logic.js can never run with a new index.html.

### In progress
- Nothing.

### Next
1. Wait for Adam's next request.

### Waiting on Adam (each runs on its default until he answers; raised again at every checkpoint)
- Nothing.

### Watch (found, not started; one fix each)
- Nothing.

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
- **Demo:** Randomize & Run fills 8 names (everyone paid), all 14 scores, a playoff choice and a finished finals, and sets `demo` on the game; it keeps any earlier game as "(before demo)" unless that game is itself a demo. Renaming the game or editing names clears the flag.
- **Champion:** `champion(g)` in logic.js derives it; `touch()` stores it in `G.champ` (Round Robins list) on every change; imports derive it too and never trust an incoming value.
