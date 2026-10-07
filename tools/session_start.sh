#!/usr/bin/env bash
# Runs at the start of every Claude session in this project (SessionStart hook, .claude/settings.json).
# Two machines share the repo through GitHub (CLAUDE.md, "Two machines"): pull first, then report what came
# down, what is uncommitted or unpushed, the size ceilings of the router and tracker, the age of the last session
# log (and install the pre-commit doc gate from tools/hooks/pre-commit), what this machine still needs set up,
# what data is loaded, any hold checked against the tracker, and the last publish refusal. Output goes into the
# session's context, so the agent repeats it to Adam before any other work. Never force, never discard anything;
# always exit 0 so a session starts even when GitHub is down.
# Project settings: fill in the four blocks marked PROJECT below, or leave them empty.
cd "$(dirname "$0")/.." || exit 0
PROJECT="Pickle RR"
TEMPLATE_VERSION=3   # bump when this template changes; the global sync.sh compares it with the template's and reports a project that is behind
TRACKER="PROJECT.md"
echo "=== $PROJECT session start ($(date '+%a %Y-%m-%d %H:%M')) ==="

# --- pull, fast-forward only ---
before=$(git rev-parse HEAD 2>/dev/null)
if [ -z "$before" ]; then
  echo "GitHub: no commits yet on this machine; nothing to pull."
elif out=$(git pull --ff-only 2>&1); then
  after=$(git rev-parse HEAD)
  if [ "$before" = "$after" ]; then
    echo "GitHub: already current ($(git log -1 --format='%h %s' | cut -c1-90))"
  else
    echo "GitHub: pulled $(git rev-list --count "$before..$after") commit(s):"
    git log --format='  %h  %ad  %s' --date=format:'%a %m-%d %H:%M' "$before..$after"
  fi
else
  echo "GitHub: PULL FAILED (not fast-forward, offline, or no remote yet). Do not force. Details:"
  echo "$out" | sed 's/^/  /'
fi
unpushed=$(git log '@{u}..HEAD' --oneline 2>/dev/null | wc -l | tr -d ' ')
[ "$unpushed" != "0" ] && echo "Unpushed commits on this machine: $unpushed"
dirty=$(git status --short 2>/dev/null | wc -l | tr -d ' ')
if [ "$dirty" != "0" ]; then
  echo "Uncommitted changes on this machine ($dirty files):"
  git status --short | sed 's/^/  /'
fi

# --- ceilings and cleanup: the doc gate, the size of the startup documents, the age of the session log ---
echo "--- ceilings and cleanup ---"
LOG_MAX_DAYS=3   # PROJECT: days since the last session-log entry before the start report says it is stale
# The doc gate (a git pre-commit hook) travels in tools/hooks/pre-commit; hooks do not travel through GitHub, so each
# machine installs it here. "git rev-parse --git-path hooks" is the folder git really runs hooks from: it honors
# core.hooksPath and resolves to the common folder in a linked worktree. A pre-commit hook that is not the gate (no
# "# Doc gate:" signature line) is never overwritten; the agent merges the checks into it.
if [ -f tools/hooks/pre-commit ]; then
  hookdir=$(git rev-parse --git-path hooks 2>/dev/null)
  if [ -n "$hookdir" ]; then
    hookdst="$hookdir/pre-commit"
    if [ -f "$hookdst" ] && ! grep -q '^# Doc gate:' "$hookdst"; then
      echo "Doc gate NOT installed: merge tools/hooks/pre-commit into $hookdst, which already has its own pre-commit hook"
    else
      if ! cmp -s tools/hooks/pre-commit "$hookdst"; then
        mkdir -p "$hookdir" && cp tools/hooks/pre-commit "$hookdst" && echo "Doc gate installed (tools/hooks/pre-commit)"
      fi
      [ -x "$hookdst" ] || chmod +x "$hookdst" 2>/dev/null
    fi
  fi
else
  echo "Setup missing on this machine: doc gate. Copy project-templates/tools/hooks/pre-commit from the rules repo into tools/hooks/ and rerun"
fi
# Sizes. The tracker section rule is identical to the one in tools/hooks/pre-commit; change both together: line 1 up to
# the line before the first "<!-- tracker ends -->" line; with none, up to the line before the first "## " heading that
# does not name a tracker section (the whole words Done since, In progress, Next, Waiting on Adam or Watch, in any case,
# or a heading that starts with Tracker, optionally after "Part N -"); with neither, the whole file. Blank lines are not
# counted. Characters are counted as UTF-8 code points without relying on the locale: strip the continuation bytes under
# LC_ALL=C, then take the length. Startup reading = CLAUDE.md bytes + tracker bytes (the optional named block the
# router points to is ignored here).
if [ -f CLAUDE.md ] && [ -f "$TRACKER" ]; then
  tend=$(tr -d '\r' < "$TRACKER" | LC_ALL=C awk '
    { line[NR] = $0 }
    END {
      end = NR; mk = 0
      for (i = 1; i <= NR; i++) if (line[i] ~ /^<!-- tracker ends -->/) { mk = i; break }
      if (mk) end = mk - 1
      else for (i = 1; i <= NR; i++) {
        h = tolower(line[i])
        if (line[i] ~ /^## / && h !~ /(^|[^a-z0-9])(done since|in progress|next|waiting on adam|watch)([^a-z0-9]|$)/ \
            && h !~ /^## (part [0-9]+[^a-z0-9]+)?tracker([^a-z0-9]|$)/) { end = i - 1; break }
      }
      print end
    }')
  grep -q '^<!-- tracker ends -->' "$TRACKER" || echo "PROJECT.md has no <!-- tracker ends --> marker; add it after the Watch section so the doc gate judges exactly the tracker"
  rl=$(tr -d '\r' < CLAUDE.md | grep -c '[^[:space:]]'); rb=$(wc -c < CLAUDE.md | tr -d ' ')
  tstats=$(head -n "${tend:-0}" "$TRACKER" | tr -d '\r' | LC_ALL=C awk '
    function clen(s) { gsub(/[\200-\277]/, "", s); return length(s) }
    /^[ \t]*$/ { bytes += length($0) + 1; next }
    { n++; bytes += length($0) + 1; if (clen($0) > 250) long++ }
    END { printf "%d %d %d\n", n, bytes, long }')
  set -- $tstats; tl=${1:-0}; tb=${2:-0}; tlong=${3:-0}
  startup=$((rb + tb))
  kb() { awk -v b="$1" 'BEGIN { printf "%.1f", b / 1024 }'; }
  echo "Ceilings: router $rl lines / $(kb "$rb") KB; tracker $tl lines / $(kb "$tb") KB ($tlong lines over 250 chars); startup reading about $(kb "$startup") KB (ceiling 15)"
  if [ "$tl" -gt 40 ] || [ "$tlong" -gt 0 ] || [ "$rl" -gt 80 ] || [ "$startup" -gt 15360 ]; then
    echo "OVER CEILING: run trim before any other work (global rules, Records)"
  fi
fi
# Session log age: ARCHIVE.md is read only for its newest session-log entry (the log is newest first): the first dated
# "- YYYY-MM-DD" line under the "Session log" heading, never past the next heading. A dated range ("2026-10-03 to
# 10-05") takes its first date.
logdate=$(awk '/^#+ *[Ss]ession log/ { f = 1; next } f && /^#+ / { exit } f && /^- 20[0-9][0-9]-[0-9][0-9]-[0-9][0-9]/ { print substr($0, 3, 10); exit }' ARCHIVE.md 2>/dev/null)
if [ -z "$logdate" ]; then
  echo "Last session log: none found in ARCHIVE.md"
else
  then_s=$(date -d "$logdate" +%s 2>/dev/null); now_s=$(date +%s 2>/dev/null)
  if [ -n "$then_s" ] && [ -n "$now_s" ]; then
    days=$(( (now_s - then_s) / 86400 ))
    echo "Last session log: $logdate ($days days ago)"
    [ "$days" -gt "$LOG_MAX_DAYS" ] && echo "SESSION LOG STALE: write the session-log entry for the work since $logdate, then run freshness (global rules, Records)"
  else
    echo "Last session log: $logdate (day count unavailable: date -d failed)"
  fi
fi

# --- PROJECT: setup this machine needs (what GitHub does not carry: installed packages, git hooks, local-only
# files). One entry per need, "<label>|<check>|<fix>": <check> is a shell command that exits 0 when the thing is in
# place on this machine and contains no '|' character; <fix> is the plain command or instruction that puts it in
# place. <label> is a noun (the thing that is missing). The session runs every reported fix without being asked
# (CLAUDE.md, "Two machines"). A git hook is looked for in the common git directory, so the check also holds in a
# linked worktree.
SETUP=(
  # Nothing to set up: the app is one static page with no packages and no local-only files.
  # 'publish hook|test -f "$(git rev-parse --git-common-dir)/hooks/post-commit"|npm run hooks'
  # ".env file|test -f .env|create .env from .env.example (README, 'Second machine')"
)
for s in "${SETUP[@]}"; do
  [ -z "$s" ] && continue
  label=${s%%|*}; rest=${s#*|}; check=${rest%%|*}; fix=${rest#*|}
  eval "$check" </dev/null >/dev/null 2>&1 || echo "Setup missing on this machine: $label. Run: $fix"
done
# The lockfile travels through GitHub, so both machines install the same versions; say so while it is not committed
# (only when package.json lists packages at all).
if grep -q ependencies package.json 2>/dev/null && command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1 && [ -z "$(git ls-files package-lock.json npm-shrinkwrap.json yarn.lock pnpm-lock.yaml 2>/dev/null)" ]; then
  echo "Setup: package-lock.json is not committed; commit it so both machines install the same versions"
fi

# No loaded-data, hold or publish sections: the app has no local data, no pauses, and publishing is just a push
# (GitHub Pages serves main), so there is no publish step that could refuse.
exit 0
