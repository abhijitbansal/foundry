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

REPO_DIR="$HOME/projects/foundry"
LOG_PREFIX="[foundry-weekly $(date -u +%Y-%m-%dT%H:%M:%SZ)]"

cd "$REPO_DIR"
echo "$LOG_PREFIX starting"

git checkout main
git pull --ff-only

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

git add data/stats.json data/weekly/
if git diff --cached --quiet; then
	echo "$LOG_PREFIX no changes to commit, done"
	exit 0
fi

BRANCH="weekly-digest-${WEEK_ID}"
git checkout -b "$BRANCH"
git commit -m "chore(weekly): digest for ${WEEK_ID}"
git push -u origin "$BRANCH"

gh pr create --title "Weekly digest: ${WEEK_ID}" --base main --head "$BRANCH" --body "Automated weekly stats refresh, generated $(date -u +%Y-%m-%d) by run_weekly.sh. Needs a manual merge — see this script's header comment for why auto-merge isn't wired up yet."

git checkout main
echo "$LOG_PREFIX done — PR opened for ${WEEK_ID}, needs manual merge"
