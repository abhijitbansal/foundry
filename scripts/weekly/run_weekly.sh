#!/bin/zsh
# run_weekly.sh — the Monday-morning automation entrypoint, invoked by
# com.abhijitbansal.foundry-weekly.plist (see that file's comments for the
# launchd/caffeinate rationale, ported from the sift project's precedent).
#
# Pipeline: refresh all-time + weekly stats -> AI highlight pass -> build
# sanity check -> push to a dedicated branch -> open a PR.
#
# Deliberately NOT a direct commit to main: AGENTS.md's branch rule is
# "never commit directly to main" with a single named exception (the
# initial bootstrap commit) that doesn't cover this.
#
# Deliberately NOT auto-merging either, for now: an earlier draft of this
# script called `gh pr merge --auto`, but that's a standing self-merge
# pathway and this repo doesn't have branch protection configured yet (a
# separate, still-pending task) to give it a real review gate to wait on.
# Once branch protection + a required CI check exist, add `gh pr merge
# "$BRANCH" --auto --squash` back after the `gh pr create` line below —
# it'll then merge only once .github/workflows/ci.yml passes, with a
# window to intervene before it does, not a bare bypass. Until then this
# just opens the PR and stops; merge it by hand each week.
set -euo pipefail

# Runs from a dedicated automation clone, NOT the working checkout — same
# pattern as sift's ~/projects/sift-publish. The working repo can be mid-
# branch/dirty at 9am Monday; this clone always pulls latest main, runs
# the full setup (npm ci), and pushes its digest branch, without ever
# touching in-progress work. Bootstraps itself on first run.
REPO_DIR="$HOME/projects/foundry-weekly"
REPO_URL="git@github.com:abhijitbansal/foundry.git"
LOG_PREFIX="[foundry-weekly $(date -u +%Y-%m-%dT%H:%M:%SZ)]"

if [[ ! -d "$REPO_DIR/.git" ]]; then
	echo "$LOG_PREFIX automation clone missing — cloning $REPO_URL to $REPO_DIR"
	git clone "$REPO_URL" "$REPO_DIR"
fi

cd "$REPO_DIR"
echo "$LOG_PREFIX starting in $REPO_DIR"

# Self-heal, don't just pull: a failed previous run leaves modified tracked
# files (stats.json/stats-archive.json) and possibly a stale digest branch
# in this persistent clone, and `git pull --ff-only` would then refuse to
# merge forever after. Nothing in this clone is ever hand-edited, so
# discarding local state is always safe here (NOT in the working checkout).
git fetch origin
git checkout -f main
git reset --hard origin/main

python3 scripts/stats/parse_sessions.py
python3 scripts/stats/weekly_stats.py

WEEK_ID=$(python3 -c "
from datetime import date, timedelta
today = date.today()
monday = (today - timedelta(days=today.weekday())) - timedelta(days=7)
y, w, _ = monday.isocalendar()
print(f'{y}-W{w:02d}')
")
WEEK_FILE="data/weekly/${WEEK_ID}.json"

if [[ ! -f "$WEEK_FILE" ]]; then
	echo "$LOG_PREFIX ERROR: expected $WEEK_FILE to exist after weekly_stats.py, it doesn't — aborting"
	exit 1
fi

# Highlight-writer pass: headless Claude Code session, natural-language
# instruction rather than a specific --agents flag (this repo's
# .claude/agents/weekly-highlights.md is auto-discovered as a dispatchable
# subagent in any session, including -p/headless ones — no special CLI
# syntax needed, and this avoids depending on exact flag names that may
# change between CLI versions).
claude -p "Use the weekly-highlights subagent to fill in the highlights field of ${WEEK_FILE}. It currently has \"highlights\": null. Only paraphrase data already in that file — never invent a number." \
	|| echo "$LOG_PREFIX highlight pass failed or was skipped — digest ships with highlights:null, not fatal"

npm ci
npm run build
npm test

git add data/stats.json data/stats-archive.json data/weekly/
if git diff --cached --quiet; then
	echo "$LOG_PREFIX no changes to commit, done"
	exit 0
fi

BRANCH="weekly-digest-${WEEK_ID}"
# -B, not -b: a same-week retry after a transient push/PR failure must not
# die on "branch already exists" in this persistent clone.
git checkout -B "$BRANCH"
git commit -m "chore(weekly): digest for ${WEEK_ID}"
git push -u origin "$BRANCH"

gh pr create --title "Weekly digest: ${WEEK_ID}" --base main --head "$BRANCH" --body "Automated weekly stats refresh, generated $(date -u +%Y-%m-%d) by run_weekly.sh. Needs a manual merge — see this script's header comment for why auto-merge isn't wired up yet."

git checkout main
git branch -D "$BRANCH"
echo "$LOG_PREFIX done — PR opened for ${WEEK_ID}, needs manual merge"
