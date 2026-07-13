# The Monday weekly pipeline — what actually runs

What `run_weekly.sh` does end to end, where every number in the `/updates` page and
the `abhijitbansal` GitHub profile README comes from, and whether any of it spends
an Anthropic API key.

## Trigger

`~/Library/LaunchAgents/com.abhijitbansal.foundry-weekly.plist` (installed from
`scripts/weekly/com.abhijitbansal.foundry-weekly.plist.template` — not auto-installed,
a deliberate separate step from merging the code) fires every **Monday 09:00** local
time. It runs under `caffeinate -i` so the machine doesn't fall asleep mid-run, then:

1. Bootstraps or hard-resets a **dedicated clone**, `~/projects/foundry-weekly` — never
   the working checkout at `~/projects/foundry`, which might be mid-branch at 9am
   Monday. Same for a second dedicated clone this pipeline also drives,
   `~/projects/abhijitbansal-weekly`.
2. `exec`s `scripts/weekly/run_weekly.sh` from inside that fresh clone.

Everything below happens inside that one script, `set -euo pipefail`, zsh.

## Stage 0 — self-heal

```
git fetch origin && git checkout -f main && git reset --hard origin/main
```
Nothing in either automation clone is ever hand-edited, so discarding local state is
always safe here (unlike the working checkout). This is what makes the job retry-safe
across a failed prior run.

## Stage 1 — foundry digest (the `/updates` page + main-page stats)

| Step | Script | What it produces |
|---|---|---|
| 1 | `scripts/stats/parse_sessions.py` | Rewrites `data/stats.json` + `data/stats-archive.json` — **all-time** telemetry (totals, per-repo, model mix, tool usage, daily series). This is also what feeds the main page's "last updated" and overall stats. |
| 2 | `scripts/stats/weekly_stats.py [week-id]` | Writes `data/weekly/<YYYY>-W<WW>.json` — one **week's** digest (Mon–Sun): per-repo rollup, a 7×24 message-heatmap, PR-merge/release counts via `gh`. Targets the most recently *completed* week by default; an explicit week id (e.g. `2026-W28`) overrides that, for backfilling a week when the job isn't run on an actual Monday — see the script's own header comment for the exact math and why the auto-detect only works when run on a Monday. |
| 3 | `.claude/agents/weekly-highlights.md`, via a headless `claude -p "Use the weekly-highlights subagent…"` | Fills that week's `highlights` field with 1–3 sentences of prose. **Deterministic input, paraphrase-only output**: the subagent's hard rule is it may not write any number, name, or claim that isn't already in the JSON `weekly_stats.py` just wrote (or `PROJECTS.md`, for a one-line repo description). If this call fails, the digest still ships with `highlights: null` — not fatal. |
| 4 | `npm ci && npm run build && npm test` | Sanity gate before anything gets committed. |
| 5 | Commit `data/stats.json`, `data/stats-archive.json`, `data/weekly/` → push `weekly-digest-<week>` → `gh pr create` → `gh pr merge --auto` | **Never a direct commit to `main`.** Auto-merges once the required `build-and-test` check (`.github/workflows/ci.yml`) passes — branch protection on `main` gates this, so it's a real check, not a bare bypass. That check runs the same `npm run build` this stage already ran locally, which matters: the homepage's "Works" yard visualization (`src/lib/works.ts`) has a hand-tuned per-repo layout table (`src/lib/works-layout.ts`) and throws a build error if `data/stats.json` ever gains a repo with no layout slot. A week where a genuinely new repo starts showing real activity fails that check, never auto-merges, and needs a human to add the repo to `YARD` before the PR can go through — every other path (the `/updates` weekly list, the weekly "Works" strip, all headline numbers) is fully dynamic and needs no manual step. |

## Stage 2 — abhijitbansal profile-README telemetry

A second, independent repo: [`github.com/abhijitbansal/abhijitbansal`](https://github.com/abhijitbansal/abhijitbansal),
GitHub's special profile-README repo. Its README embeds SVG panels
(`assets/*.svg`) built by `scripts/build.mjs` from `data/telemetry.json` — the same
kind of telemetry as the foundry site, reshaped for a GitHub profile card.

- `scripts/generate-telemetry.mjs --stats <foundry's freshly-written stats.json>`
  reads THIS run's `data/stats.json` (so the two sites never drift out of sync on the
  numbers that matter) and reshapes it: renamed fields, top-6 models via the same
  `modelDisplayName()` mapping foundry's `src/lib/telemetry.ts` uses, top-6 tools,
  the daily token series as-is. Two fields aren't in `stats.json` and are pulled live:
  **languages** (`gh api repos/OWNER/REPO/languages`, summed, HTML/CSS excluded as
  generated markup) and **GitHub contributions** (`gh api graphql`, no REST
  equivalent exists).
- **Disclosure is deliberately narrower here than on the foundry site.** foundry's
  `PROJECTS_ALLOWLIST` (in `parse_sessions.py`) mirrors `PROJECTS.md` — every project
  the site owner has chosen to publish, including paused/private ones, reviewed
  case by case. The profile README keeps its *own*, smaller `DISCLOSED_REPOS` list in
  `generate-telemetry.mjs` — exactly the repos already named in that repo's own
  README table — because a GitHub profile repo is public the instant something lands
  on `main`, permanently (see that repo's
  `docs/building-a-telemetry-profile-readme.md` §7: squashing later doesn't undo a
  leaked commit). A repo crossing into real activity doesn't silently start
  appearing there; it gets a console warning during generation and stays out of the
  chart until someone deliberately adds it to `DISCLOSED_REPOS`.
- `node scripts/build.mjs` regenerates the SVGs from the fresh JSON.
- Commit + **push straight to `main`** — no PR. That's this repo's own existing
  convention (its three prior commits were all direct-to-main), not something this
  pipeline introduced, and the disclosure gate above is what makes that safe to leave
  unattended.
- A failure in this stage never blocks or rolls back Stage 1 — by the time this
  stage runs, the foundry digest is already committed and its PR is already open.

## Stage 3 — notify

A **second**, separate headless `claude -p` call (not the highlights one) whose only
job is to call the `PushNotification` tool with a one-line status summary. Followed
by an `osascript -e 'display notification …'` as a same-machine fallback — whether
`PushNotification` actually reaches a device from an unattended launchd context (no
active terminal, no guaranteed Remote Control link) isn't as certain as it is in an
interactive session, so the local notification doesn't depend on it.

## Does any of this spend an Anthropic API key?

**No.** Grep confirms no `ANTHROPIC_API_KEY`, no `api.anthropic.com`, no Anthropic
SDK import anywhere in either repo's automation code, and no `.env` file. The two
places an LLM is involved at all — the weekly-highlights paraphrase call and the
notify call — are both `claude -p` invocations of the **Claude Code CLI itself**,
authenticated the same way an interactive session is (subscription/OAuth login on
this machine), not a metered API key billed separately. Every number in both sites'
telemetry is produced by fully deterministic local computation
(`parse_sessions.py`, `weekly_stats.py`, `generate-telemetry.mjs`) plus plain
`gh` CLI calls — no model call touches a number, only prose.

## What still needs a human

The whole pipeline is unattended by design, including the foundry weekly-digest PR
(auto-merges once `build-and-test` passes). Two things still surface as manual work,
both as a **blocked PR / build failure**, never a silent bad merge:

- **A new entry in `src/lib/works-layout.ts`'s `YARD` table**, if a repo shows real
  activity in `data/stats.json` for the first time — the homepage build throws until
  someone adds that repo's layout slot, so `build-and-test` fails and the digest PR
  simply doesn't auto-merge until it's fixed.
- **A new entry in `DISCLOSED_REPOS`**, if `generate-telemetry.mjs` logs a warning
  that a repo crossed into real activity and isn't disclosed yet on the profile
  README — it stays out of that chart until someone deliberately adds it.

## Known limitations (see `weekly_stats.py`'s own header for the full detail)

- Repos that tag a release without an actual GitHub Release won't show a version
  bump in that week's digest (PR merges have no such gap).
- A repo's public/private visibility is checked live at generation time and baked
  into that week's committed JSON permanently — a repo made private later doesn't
  retroactively redact an already-committed week.
