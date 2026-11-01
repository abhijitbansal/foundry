# Session 0016 — jarvis and job-finder (2026-10-31)

Branch: `feat/jarvis-job-finder-cards`

## Achieved

- **Cards.** jarvis and job-finder added to the Agent tooling group in `src/data/projects.ts` as private cards (no links). Both render like orca-local: `—` number, 0 storeys, "Private build". Checked in headless Chrome against `astro preview`.
- **job-finder blurb** uses the owner's framing: "Designed to help others find and apply for jobs".
- **Inventory.** PROJECTS.md gains both entries; the allowlist comment and AGENTS.md telemetry section name them as card-only.
- **Tests.** projects.test counts to 16 / aiTooling 9; works.test pins no `YARD` slot for all three card-only repos; new `tests/unit/allowlist.test.ts` pins them off `PROJECTS_ALLOWLIST` (shown failing with jarvis added).
- **Review.** Opus fresh-context review: 0 CRITICAL, 0 HIGH, 1 MEDIUM, 9 LOW. Fixed the wording, accuracy, guard-test and comment findings.
- **Gates:** 165/165 tests, 6-page build.

## Decisions

- **Both card-only, not yard buildings.** job-finder was "never allowlist" on 2026-10-10; its per-repo row stays off the public stats. jarvis has no designed `YARD` slot; a building for it is a follow-up.
- Both use the `active` status.

## Follow-ups

- **Owner call (review MEDIUM): job-finder visibility.** job-finder's own AGENTS.md records an owner ruling that the job-search system is shared with recruiters and referrers, not where current colleagues will see it. This site is shared on LinkedIn, and this repo is public. The "help others" framing softens it but the card still names a job-application tool on the owner's site. Owner confirmed 2026-10-31: publish both cards.
- Optional: a yard building for jarvis (hand-placed slot + allowlist).

## Resume pointer

PR open; owner merges.

## Models

- Orchestrator: Opus 5.5 (repo reads, copy, tests, browser check).
- Review: Opus via `ecc:code-reviewer` (fresh context, report only).

## Part 2 — coming soon, yard buildings (same day)

### Achieved

- **Owner change of direction:** both repos marked *Coming soon*, given yard buildings and treated like any other tool, with blurbs "mostly clear, with enough ambiguity".
- **New status** `coming-soon`: label and glyph maps in `src/lib/schedule.ts`; renders `□ Coming soon` in `--ds-text-2` (not redline).
- **Yard:** both allowlisted; stats refreshed with `parse_sessions.py` (job-finder ranks 04 at 5 storeys, jarvis 12 at 2). Hand-placed **plate 05 · COMING SOON** in the open north sky. Plate 04's label moved above its own plate: swatkats' refresh to 6 storeys covered the old spot.
- **Checks:** all 15 nameplates badge-sampled clear in headless Chrome over CDP at 1440, 1100 and 768px; job-finder at the 8-storey max computed to clear the top edge (roof ≈ y 18).
- **Review:** Opus fresh-context review, 0 CRITICAL / 0 HIGH / 2 MEDIUM (both browser checks, done) / 7 LOW. Fixed headroom, comments, glyph map, tech drift, AGENTS.md bullet.
- **Gates:** 166/166 tests, 6-page build.

### Decisions

- Plate 05's label names the status. Rename it or move the buildings when either ships.
- Supersedes part 1's card-only decision. orca-local stays the only card-only repo.

### Follow-ups

- job-finder's per-repo telemetry row (first/last session dates, session count, top skills) is now public in `data/stats.json` and permanent via the ratchet. That comes with having a building.
- swatkats now ranks 03 at 6 storeys while its blurb still says "In design".
