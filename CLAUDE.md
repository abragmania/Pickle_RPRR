# Pickle RR — project router (auto-loads every session)

A free, phone-first web app that runs an 8-player rotating-partner pickleball round robin (7 rounds, 2 courts), then a top-4 playoff and finals. Adam built it for his pickleball group; anyone can use it from a link. It is one static page with no server and no outside data: every game saves in the visitor's own browser.

Five documents (global rules, RECORDS): this router; `PROJECT.md` (tracker first, specs below; read at startup); `DECISIONS.md` (standing rulings; read before touching scoring, tiebreaks or the schedule); `README.md` (what it is, where it lives, how to run it); `ARCHIVE.md` (history and the session log; never read at startup). Startup reading is this file and the PROJECT.md tracker. Create no other document. Adam's global rules apply in full; this file only adds what is specific here.

## Agents (colored bullet mandatory on every mention; files in `.claude/agents/`; tiers named, never models)
- 🟣 builder — writes code from a spec, never commits (cheap tier for layout and mechanical work; top model for ranking, tiebreak and finals logic)
- 🔵 code-review — correctness gate for every change to scoring, ranking, ties, finals or saved data (top model)
- 👁 visual-qa — renders and judges every visible change at phone width (top model)
- 🎨 polish — fixes look and feel after a visible change; skipped when nothing visible changed (cheap tier)
Four-role roster by filed exception to the standard eight (D6): this is a one-page app with no data feeds, so there is no plan, scout, trim or freshness agent. Skip freshness always (nothing here goes stale: no data, no research, and publishing is a push).

## Proportion
Verification is sized to what the change can break; 🔵 on every scoring, ranking or saved-data change and 👁 on every layout change always stay.
- Docs-only commit: the doc checks only. Code: a syntax check of the script block, `node --test` (zero failures), and one run of the changed screen in a browser. A change to scoring, ranking, ties, finals or payouts also adds or updates a test.
- Briefs name only the pages and size a change can affect: Scores, Schedule, Grid, Standings, Round Robins at 375x812. One label, color or font: one render. Look-and-feel work shows Adam a first draft before finishing.
- Budgets are the global starting numbers; review rounds: 👁 judges a layout change once, a fix to its findings gets one render check by the lead.

## Rules specific to this project
- Public repository (GitHub Pages serves `main`): nothing in any file or commit carries Adam's full name, his email or a computer name or folder path; "Adam" alone and `abragmania` are fine. Commits use the machine's global no-reply identity.
- Scores must never be lost: every change autosaves, removing a game only moves it to Removed round robins, and Clear keeps a "(before clear)" copy (README, "Saved data").
- `logic.js` is cached separately from `index.html` (GitHub Pages keeps files about 10 minutes), so a change that index.html depends on bumps `PBRR.version`, the `logic.js?v=N` tag and the load guard together; a test fails if they disagree.
- Test locally by serving the folder on port 8791 (README, "Run"); stop that server only by its port.
- Two machines: the SessionStart hook pulls fast-forward only and reports; repeat its report to Adam first, then continue from Next. Publishing is `git push`; GitHub rebuilds the site in a few minutes.
