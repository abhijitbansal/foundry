# Session: Main-issues fixes — nav anchors, week selector, since-May-1 telemetry, dark default, Monday automation

**Session:** 4
**Started:** 2026-07-11
**Date:** 2026-07-11
**Branch:** fix/main-issues
**Last updated:** 2026-07-11

## Checkpoints

### Phase 1 — Reported issues on main (goal-driven)

**Achieved:**
- **Nav anchors from /updates/**: header's bare `#work`/`#expertise`/`#telemetry`/`#about` (and the logo's `#top`) resolved to `/foundry/updates/#work` — dead. All now carry `import.meta.env.BASE_URL`. `SkipLink` grew `href`/`label` props; /updates/ targets `#weeks`.
- **Week selector on /updates/**: chip row (`week_id · date range`) jumping to per-week `id=<week_id>` anchors with `scroll-margin-top` for the fixed header.
- **Telemetry "always everything from May 1st onwards, not 30 days"** — two halves:
  - *Data*: Claude Code purges local transcripts after ~30 days (`cleanupPeriodDays`), which is why `date_min` had silently slid from 2026-05-22 to 2026-06-10 between stats regenerations. `parse_sessions.py` now accretes per-day aggregates into committed **`data/stats-archive.json`** (per-field max merge — a past day's true counts never shrink), and folds the archive's surplus over live coverage into totals/breakdowns/daily series. May 22 – Jun 9 recovered from the `a6785a0` stats.json snapshot (only `sessions`/`out_tokens`/`lines_added` existed per-day back then; that gap is permanent and documented in the archive's note).
  - *Site*: activity card anchored at `TELEMETRY_START_ISO` (2026-05-01) → latest data day via new `dateRangeCells`/`rangeSum`/`peakDayInRange` (trailing-30 helpers delegate to them; contracts unchanged). Label "Last 30 days" → "Since May 1".
- **Light theme "See the work" hard to read**: `.ds-btn` rendered `--ds-on-accent` #04141A on `--ds-accent` #0E8FB0 — muddy at 13px. Light theme now uses the darker `--ds-accent-hover` fill with a light label (~4.8:1; hover #085E74 ≈ 6.8:1). Verified by screenshot before/after; dark theme untouched.
- **LinkedIn URL** corrected to `linkedin.com/in/abhijit-bansal/` in Hero, About (href + display text), Footer.
- **Dark is now the default theme** (mid-session request): no stored preference → dark in both the pre-paint inline script and `readTheme()`; explicit stored `light` still wins. SSR toggle label updated to match.

### Phase 2 — Monday 9am automation from a dedicated clone (mid-session request)

**Achieved:**
- sift-publish pattern: the weekly job now works in **`~/projects/foundry-weekly`** (created this session), never the working checkout. Plist bootstraps the clone if missing, hard-resets to `origin/main`, then execs the clone's `run_weekly.sh` — each run self-heals and executes the latest committed script.
- Schedule moved Monday 07:00 → **Monday 09:00**; plist installed to `~/Library/LaunchAgents` and loaded (`launchctl list` shows `com.abhijitbansal.foundry-weekly`).
- Weekly commit now includes `data/stats-archive.json` so accreted history publishes.

### Phase 3 — Workflow code review (high effort) + fixes

**Achieved:**
- 32-agent workflow review (finders + independent verifiers + synthesis) returned **10 confirmed findings; all 10 fixed** in three commits:
  - Parser: `date_max` backfill from archive (null crash once transcripts fully purge); delta-based totals fold (boundary-day self-contradiction); archive now carries per-day tools/agents/skills/slash/mcp/models + per-model token counters so the breakdown cards stop shrinking (finding: "the same bug the archive was built to fix, unfixed for those cards").
  - Frontend: heatmap wrapped in `overflow-x:auto` (since-May-1 grid grows a 16px column every 7 days); SSR theme label "Theme · Dark"; `#weeks` moved to an always-rendered wrapper (dead skip link on empty state).
  - Automation: plist-side bootstrap + hard reset (script's own bootstrap was unreachable via launchd; dirty clone wedged every later ff-only pull); `checkout -B` + post-PR branch deletion (same-week retry died on "branch already exists").

**Decisions:**
- Archive merge rule is **per-field max**: for a completed past day a recount of full data is identical, so a lower value only ever means purge loss — max is the only safe merge. Prompt-size percentiles, per-repo cards, versions and image counts stay live-window **by design** (percentiles aren't mergeable from aggregates; per-repo archiving deferred until it matters).
- Heatmap stays anchored at a constant May 1, 2026 (`TELEMETRY_START_ISO`) — empty cells before May 22 are honest (no data was ever captured before then).
- Dark default implemented as "anything but stored `light` is dark" in both script and `readTheme()` — resilient to garbage localStorage values.

**Follow-ups:**
- **Merge this PR before Monday Jul 13 09:00** — the installed plist pulls `main` into the automation clone; before merge, a fired job would run last week's script.
- First automated run: check `/tmp/com.abhijitbansal.foundry-weekly.{out,err}.log` Monday, merge the `weekly-digest-2026-W28` PR by hand, confirm `date_min` stays 2026-05-22.
- Manual checklist: `.scratch/fix-main-issues-test-checklist.html`.
- Pre-existing copy nit (not touched, surgical rule): /updates/ lead says "telemetry above" — it lives on a different page now.

**Resume pointer:** branch `fix/main-issues`, 10 commits, all gates green (build, 63 tests, workflow review clean after fixes).

**Models:** Fable 5 orchestrator (xhigh); workflow review ran 32 Fable 5 agents (~1.75M tokens).
