#!/bin/zsh
# run_weekly.sh — the Monday-morning automation entrypoint, invoked by
# com.abhijitbansal.foundry-weekly.plist (see that file's comments for the
# launchd/caffeinate rationale, ported from the sift project's precedent).
#
# Pipeline: refresh all-time + weekly stats -> AI highlight pass -> build
# sanity check -> push to a dedicated branch -> open a PR -> refresh the
# abhijitbansal profile-README telemetry from the same stats.json -> notify.
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
#
# Optional $1: explicit ISO week id ("2026-W28") to target instead of
# auto-detecting the most recently completed Mon-Sun week. The auto-detect
# math only gives the right answer when run ON a Monday (that's what the
# plist's StartCalendarInterval guarantees for the real cron); a manual
# same-week backfill run on any other weekday needs this override, or it
# silently re-targets last week.
set -euo pipefail

WEEK_OVERRIDE="${1:-}"

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
python3 scripts/stats/weekly_stats.py ${WEEK_OVERRIDE}

if [[ -n "$WEEK_OVERRIDE" ]]; then
	WEEK_ID="$WEEK_OVERRIDE"
else
	WEEK_ID=$(python3 -c "
from datetime import date, timedelta
today = date.today()
monday = (today - timedelta(days=today.weekday())) - timedelta(days=7)
y, w, _ = monday.isocalendar()
print(f'{y}-W{w:02d}')
")
fi
WEEK_FILE="data/weekly/${WEEK_ID}.json"

if [[ ! -f "$WEEK_FILE" ]]; then
	echo "$LOG_PREFIX ERROR: expected $WEEK_FILE to exist after weekly_stats.py, it doesn't — aborting"
	exit 1
fi

# Snapshot stats.json OUTSIDE the repo now, before anything below touches
# git state. Stage 2 needs this run's freshly-generated stats.json, but
# further down this script does `git checkout main` after committing the
# digest branch — which resets the working tree's data/stats.json back to
# whatever's on main (the OLD pre-refresh version), since the fresh one
# only exists inside the digest branch's commit at that point. Reading
# "$REPO_DIR/data/stats.json" directly in Stage 2 would silently pick up
# stale data every week this branch actually has changes to commit.
STATS_SNAPSHOT="$(mktemp -t foundry-weekly-stats).json"
cp data/stats.json "$STATS_SNAPSHOT"

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

DIGEST_STATUS="no changes"
git add data/stats.json data/stats-archive.json data/weekly/
if ! git diff --cached --quiet; then
	BRANCH="weekly-digest-${WEEK_ID}"
	# -B, not -b: a same-week retry after a transient push/PR failure must not
	# die on "branch already exists" in this persistent clone.
	git checkout -B "$BRANCH"
	git commit -m "chore(weekly): digest for ${WEEK_ID}"
	git push -u origin "$BRANCH"

	PR_URL=$(gh pr create --title "Weekly digest: ${WEEK_ID}" --base main --head "$BRANCH" --body "Automated weekly stats refresh, generated $(date -u +%Y-%m-%d) by run_weekly.sh. Needs a manual merge — see this script's header comment for why auto-merge isn't wired up yet.")

	git checkout main
	git branch -D "$BRANCH"
	DIGEST_STATUS="PR opened: ${PR_URL}"
	echo "$LOG_PREFIX done — PR opened for ${WEEK_ID}, needs manual merge"
else
	echo "$LOG_PREFIX no changes to commit for ${WEEK_ID}"
fi

# ---- Stage 2: abhijitbansal profile-README telemetry refresh ----
# Same dedicated-clone, hard-reset pattern as this repo, in its own sibling
# checkout (~/projects/abhijitbansal-weekly) — the profile repo's working
# checkout is never touched by automation, same rationale as this repo's
# own header comment. Reads THIS run's freshly-generated data/stats.json as
# its source of truth, so it always reflects the same numbers as the digest
# above. Runs after the foundry digest is fully committed/pushed so a
# failure here never rolls back or blocks the foundry side.
AB_STATUS="skipped"
AB_DIR="$HOME/projects/abhijitbansal-weekly"
AB_URL="git@github.com:abhijitbansal/abhijitbansal.git"
if [[ ! -d "$AB_DIR/.git" ]]; then
	echo "$LOG_PREFIX abhijitbansal automation clone missing — cloning $AB_URL to $AB_DIR"
	git clone "$AB_URL" "$AB_DIR" || true
fi
if [[ -d "$AB_DIR/.git" ]]; then
	# set +e around the capture: a `$(...)` used as the tested element of an
	# `&&`/`||` list suppresses `set -e` for everything evaluated to produce
	# it, INCLUDING inside the subshell — a failure anywhere in this block
	# (a bad push, a crashing generator) would otherwise fall through
	# silently to the final `echo "updated"` and get reported as success by
	# both notification channels below. Capturing $? directly, outside any
	# &&/|| context, is the only reliable way to see a real failure here.
	# Every command except the final status echo is redirected to stderr
	# (outside this capture) so its stdout can't leak into AB_STATUS and
	# corrupt the notification strings.
	set +e
	AB_RESULT=$(
		set -e
		cd "$AB_DIR"
		git fetch origin >&2
		git checkout -f main >&2
		git reset --hard origin/main >&2
		node scripts/generate-telemetry.mjs --stats "$STATS_SNAPSHOT" >&2
		node scripts/build.mjs >&2
		git add data/telemetry.json assets/
		if git diff --cached --quiet; then
			echo "no changes"
			exit 0
		fi
		git commit -m "chore(telemetry): refresh from foundry stats, $(date -u +%Y-%m-%d)" >&2
		git push origin main >&2
		echo "updated"
	)
	AB_EXIT=$?
	set -e
	if [[ $AB_EXIT -eq 0 ]]; then
		AB_STATUS="$AB_RESULT"
	else
		AB_STATUS="FAILED (exit ${AB_EXIT}) — check $LOG_PREFIX above"
	fi
	echo "$LOG_PREFIX abhijitbansal: ${AB_STATUS}"
else
	AB_STATUS="FAILED — clone missing"
fi

# ---- Stage 3: notify ----
# `claude -p` here is a second, separate headless call from the
# weekly-highlights one above — narrowly scoped to reporting status, not
# touching any files. PushNotification is assistant-side; whether it
# actually reaches a device from an unattended launchd context (no active
# terminal, no guaranteed Remote Control link) isn't guaranteed the way it
# is in an interactive session, so `osascript` is a same-machine fallback
# that doesn't depend on it.
claude -p "Call the PushNotification tool once, status proactive, message: 'Foundry weekly ${WEEK_ID}: ${DIGEST_STATUS}. abhijitbansal telemetry: ${AB_STATUS}.' Do nothing else." \
	|| echo "$LOG_PREFIX PushNotification call failed or was skipped — not fatal"
osascript -e "display notification \"${DIGEST_STATUS} · abhijitbansal: ${AB_STATUS}\" with title \"Foundry weekly ${WEEK_ID}\"" \
	|| echo "$LOG_PREFIX osascript notification failed — not fatal (e.g. no GUI session)"

rm -f "$STATS_SNAPSHOT"
echo "$LOG_PREFIX done — digest: ${DIGEST_STATUS} — abhijitbansal: ${AB_STATUS}"
