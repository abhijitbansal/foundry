# Session 0013 — 2026-10-05 — Weekly digest: W40 merge recovery + auto-merge retry

**Branch:** `fix/weekly-merge-retry` · **Session:** `session_015owve1fkGkwU5Ua1TMuc16`

## Achieved

- **Diagnosed the "job that didn't run".** The Monday 2026-10-05 run did run (`~/projects/foundry-weekly-logs/run-20261005T130834Z.log`): stats, highlights, build, tests, push, PR #42, profile-README telemetry all succeeded. Only `gh pr merge --auto` failed — `Post "https://api.github.com/graphql": read tcp …->140.82.114.6:443: read: connection reset by peer` — so auto-merge was never queued and #42 sat open with `build-and-test` green. The run's final status still said "auto-merge queued" (the status string was unconditional), and the PushNotification was skipped because a terminal was active.
- **Recovery:** user merged #42 by hand (`gh pr merge 42 --merge`); Pages deploy triggered.
- **Fix (`scripts/weekly/run_weekly.sh`):** `queue_auto_merge` retries the call 3× with 30s/60s backoff, checks `gh pr view --json state,autoMergeRequest` before each attempt and once after the last (a reset can drop the response after the request landed), and targets `$PR_URL`, not the branch name (a branch lookup can resolve to an older closed PR from a same-week rerun). `DIGEST_STATUS` now reports "auto-merge NOT queued — needs a manual merge" when that's true.
- **Follow-up fix, same session:** `git push` and `gh pr create` now go through the same shared `retry` helper. PR create checks `gh pr list --head $BRANCH --state open` before each attempt and after the last, so a lost response (the W32 case) never opens a duplicate. A publish step that still fails sets `DIGEST_STATUS` and falls through, so Stage 2 and the notifications run, and the script then exits 1 so launchd's status records it. Stub harness: 7 scenarios (happy, push flaky/down, create lost-response/down, merge flaky/down), all correct, ERR trap never fired. Second reviewer round: no CRITICAL/HIGH. Its two mediums were applied (exit 1 on failure; the rerun hint no longer promises a rerun works).
- Verified with a stubbed `gh` under `set -euo pipefail` + ERR trap: flaky (queues on attempt 3), already-queued (0 merge calls), hard-down (fails), view-failing (fails), lost-last-response (queued). The `--jq` expression returns `yes` against the real merged PRs #41/#42. Reviewer pass: no CRITICAL/HIGH; low-severity findings on URL-vs-branch and the post-loop recheck were applied.

## Decisions

- Retries are not split into transient vs permanent failures — a permanent failure costs 90s of sleep in an unattended job, acceptable.
- No `gh` timeouts added (macOS ships no `timeout`); a hung connection still blocks the run.

## Follow-ups

- **Same-week rerun after a pushed-but-unmerged digest can't push:** the remote `weekly-digest-<week>` branch exists, and the rebuilt branch is non-fast-forward. This is a pre-existing gap. Fix candidate: `git push --force-with-lease` on the automation-owned branch. It's a force-push policy call, so it's left to the user.
- Retries don't separate permanent failures (auth, non-ff) from transient ones; a permanent one costs 90s.
- When the digest fails, Stage 2 still pushes this run's stats to the profile README, so the two can drift for a week.
- `gh pr merge --auto` on a PR already in CLEAN state: behavior on the installed gh version unverified; worst case is a false "NOT queued", never a false success.
- The new merge path isn't exercised by `DRY_RUN`; its first real run is the next unattended Monday.

## Resume pointer

Nothing in flight once this branch's PR merges. Next Monday's log should show either no retry lines or `attempt n/3 failed` followed by a queued merge.

## Models

- Orchestrator: Opus 5.5 (diagnosis, edit, stub tests). Reviewer: `caveman:cavecrew-reviewer` on Opus, report-only.
