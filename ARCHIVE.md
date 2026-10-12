# ARCHIVE.md — Pickle RR history; never read at startup

Nothing here is in force. Finished tracker items, finished one-off calls, replaced rulings in full and the session log live here so the startup documents stay short. Search by date or by D-number.

## Finished items and one-off calls (newest first; date, commit, one line each)
- 2026-10-12 — Adam answered yes to both open retro items: un-minify (4e8a49f, token-identical proof script) and a real demo flag with the champion recomputed on every change (touch(), not the renderer), with champion tests; browser testing found a stale cached logic.js could meet a new index.html, so logic.js is now version-stamped and the service worker revalidates.
- 2026-10-12 — Earlier tracker lines moved here: weekly audit applied (6125511), roster exception D6 (e5fcb8d).
- 2026-10-12 — Adam ruled "Exception" on the weekly audit's roster conflict: four agents only (D6); the global rules name the exception (claude-rules e2571eb), the router states it, and the Waiting question is closed.
- 2026-10-12 — Weekly audit applied: session start script to template version 4 (merged-hook check, new session-log date rule), waiting-and-budget line added to all four agent files; the one-page agent-roster conflict went to Adam as Waiting item 3.
- 2026-10-10 — Retro build from the rules repo: D5 score validity (invalid scores kept, flagged, never counted), one payouts() helper, logic.js plus tests/logic.test.js (`node --test`, 8 tests), sw.js precaches logic.js with a safer offline fallback. Code-review approved with four changes, all applied; the "leader at most 11" rule follows Adam's "games go to 11 (win by 1)".
- 2026-10-06 to 10-10 — Earlier tracker lines moved here: address-bar throttle (fd37467), no stacked demo backups (3f6bb29), ties box and head-to-head (cc8ae39, e02fe0c, D1, D2), logo to entry and Randomize & Run (efb1f65), the light kit (2026-10-07).
- 2026-10-07 — The light project kit was added (router, tracker, rulings D1-D3, archive, four agents, session start at template version 3, doc gate); the templates were scrubbed of personal folder paths because this repository is public.
- 2026-10-06 (693e2fe) — Git history was replaced by one commit (20 commits before, 1 after) after Adam answered "Erase the old history: yes"; the old history still showed his email. GitHub confirmed 1 commit and the site stayed up. Other machines reset once (tracker, Watch).
- 2026-10-06 — Privacy block done: commits use the GitHub no-reply identity; nothing public carries his surname, email or a computer name. The site is served straight from `main` by GitHub Pages, so there is no publish step and nothing that records a computer name.
- 2026-10-06 — Stress test (250 random full games, hostile names, bad share links, full storage, 375px layout): no crashes or lost scores. Declined by Adam: guarding duplicate names, confirming before a shared link opens, old-iPhone support, the confetti replay.

## Replaced rulings (full text; DECISIONS.md keeps a one-line pointer under the same number)

## Session log (newest first; what was done, what is pending, the immediate next step, which is also on the PROJECT.md tracker)
- 2026-10-12 — Weekly audit applied, roster exception filed (D6), source un-minified, demo flag and champion recompute built through builder and code-review, stale-cache hazard found in testing and fixed. Pending: nothing. Next: wait for Adam's next request.
- 2026-10-10 — Applied the rules-repo retrospective: three code gaps fixed through a builder and a code review (lead kept to checks and filing), two questions put to Adam. Pending: Adam's answers on un-minifying the source and on a demo flag. Next: wait for those and his next request.
- 2026-10-07 — Built and shipped the whole app over 2026-10-04 to 10-06: balanced 7-round schedule, winner-first score entry, per-round matchups, Schedule tab, 4-across Grid, standings with tiebreaks, ties settled and explained, head-to-head, playoff options and payouts, finals with champions, saved games with backup and share links, offline install. Today the light project kit went in. Pending: nothing planned; one question for Adam on the tracker (public repo holding the documents). Next: wait for Adam's next request.
