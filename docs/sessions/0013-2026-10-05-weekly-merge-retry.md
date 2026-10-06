# Session 0013 — 2026-10-05 — Weekly digest: W40 merge recovery + auto-merge retry

**Branch:** `fix/weekly-merge-retry` · **Session:** `session_015owve1fkGkwU5Ua1TMuc16`

## Achieved

- **Diagnosed the "job that didn't run".** The Monday 2026-10-05 run did run (`~/projects/foundry-weekly-logs/run-20261005T130834Z.log`): stats, highlights, build, tests, push, PR #42, profile-README telemetry all succeeded. Only `gh pr merge --auto` failed — `Post "https://api.github.com/graphql": read tcp …->140.82.114.6:443: read: connection reset by peer` — so auto-merge was never queued and #42 sat open with `build-and-test` green. The run's final status still said "auto-merge queued" (the status string was unconditional), and the PushNotification was skipped because a terminal was active.
- **Recovery:** user merged #42 by hand (`gh pr merge 42 --merge`); Pages deploy triggered.
- **Fix (`scripts/weekly/run_weekly.sh`):** `queue_auto_merge` retries the call 3× with 30s/60s backoff, checks `gh pr view --json state,autoMergeRequest` before each attempt and once after the last (a reset can drop the response after the request landed), and targets `$PR_URL`, not the branch name (a branch lookup can resolve to an older closed PR from a same-week rerun). `DIGEST_STATUS` now reports "auto-merge NOT queued — needs a manual merge" when that's true.
- Verified with a stubbed `gh` under `set -euo pipefail` + ERR trap: flaky (queues on attempt 3), already-queued (0 merge calls), hard-down (fails), view-failing (fails), lost-last-response (queued). The `--jq` expression returns `yes` against the real merged PRs #41/#42. Reviewer pass: no CRITICAL/HIGH; low-severity findings on URL-vs-branch and the post-loop recheck were applied.

## Decisions

- Retries are not split into transient vs permanent failures — a permanent failure costs 90s of sleep in an unattended job, acceptable.
- No `gh` timeouts added (macOS ships no `timeout`); a hung connection still blocks the run.

## Follow-ups

- **`gh pr create` / `git push` still have no retry** — same reset class, and it has bitten before (session 0011, W32 wedged PR #30). Under `set -e` a reset there kills the run before telemetry and notify, so nobody hears about it. Session 0011's follow-up (check `gh pr list --head` after a failed create) is still open.
- `gh pr merge --auto` on a PR already in CLEAN state: behavior on the installed gh version unverified; worst case is a false "NOT queued", never a false success.
- The new merge path isn't exercised by `DRY_RUN`; its first real run is the next unattended Monday.

## Resume pointer

Nothing in flight once this branch's PR merges. Next Monday's log should show either no retry lines or `attempt n/3 failed` followed by a queued merge.

## Models

- Orchestrator: Opus 5.5 (diagnosis, edit, stub tests). Reviewer: `caveman:cavecrew-reviewer` on Opus, report-only.
