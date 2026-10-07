# Session 0014 — 2026-10-06 — Drawing Set redesign

**Branch:** `feat/drawing-set-redesign` · **Session:** `session_013pX4LTo5C1uNDnGrGANbE1` · **Plan:** [`docs/plans/2026-10-06-drawing-set.md`](../plans/2026-10-06-drawing-set.md)

## Achieved

- **Proposal.** The user asked for a theme redesign that avoids AI slop and keeps the yard buildings. The site was audited live, and design-router routed the work to `redesign-existing-projects`. The tradeoffs went onto a Claude Design canvas: an audit board, a tokens board, and two directions (A "Drawing Set", B "Night Shift") with desktop and phone boards. Every yard on the canvas is the real production SVG re-themed through tokens. The user chose A.
- **Plan.** 5 phases and 11 tasks, with reference artboards committed under `docs/plans/2026-10-06-drawing-set/`.
- **Executed subagent-driven.** Each task got a Sonnet implementer, an Opus task review and a fix loop. The orchestrator checked every phase gate in a browser, Fable did the final whole-branch review, and one fix wave followed it.
  - **Theme layer** (`src/styles/drawing-set.css`, loaded last). Film/ink/redline palettes for the day sheet and night sheet. Archivo + IBM Plex Mono. Square corners and sentence-case mono labels. The DS classes were restyled: ink buttons, and text links for the quiet button. The heat ramps are graphite with a redline peak. Theme follows the OS unless the visitor has chosen one.
  - **Chrome.** A sticky sheet-index nav (burger at ≤1080px), a title-block footer, and `SheetHead` on /updates, /harness, /craft and /404.
  - **Home.** The yard is the hero. The Three.js orb and the `three` dependency are gone. The page now has a revisions block, a schedule of buildings numbered by yard rank (Foundry added as Bldg 08), general notes and meter readings.
  - **`/telemetry/`** (B-01) holds the full telemetry and the yard ledger.
  - **Easter eggs.** All three kept, with the same ids, timings and sounds. Egg 3's night palette is now the rejected Night Shift direction (sodium).
  - **Cleanup.** Dead CSS swept: global.css went from 1022 to 587 lines. The favicon was recoloured. AGENTS.md and README updated.
- **Gates:** 156/156 tests, a 6-page build, `npx npm@10 ci` green (lockfile regenerated with npm 10 after dropping `three`), and the final review's blockers fixed and browser-verified. `npm audit` shows 15 vulnerabilities, the same count as on main, so none are new.

## Decisions

- **Colour-family rule replaced** (supersedes PR #25's cyan/ember rule). Interaction is ink at rest and on hover; hover thickens the underline. Redline (`--ds-secondary` = `--fy-ember`) is for revisions, heat and lit windows only. This is enforced by `tests/unit/palette.test.ts`, which now also scans `public/*.svg`, and by `tests/unit/drawing-set-tokens.test.ts`. Both are recorded in AGENTS.md.
- **Day redline is `#B5341A`**, not the canvas's `#C23B1E`, which is only 4.10:1 on surface-2.
- **Three.js retired.** The AGENTS.md locked stack row is amended.
- **Status tokens** (`--ds-success/warning/danger/info`) keep the vendored hues, because they carry good/bad meaning on /harness/. This is the documented exception.
- **Old anchors.** `#work` now goes to `#schedule`, `#expertise` and `#about` go to `#notes`, and `#telemetry` goes to `/telemetry/`. The remap is an inline script on the home page.
- All 37 controller rulings are in the SDD ledger and are summarised in the PR body.

## Follow-ups

- `public/og-image.png` still shows the old theme; regenerate it from the new hero.
- Parked polish:
  - Uppercase WORKS/GRID and fullscreen labels.
  - Redline used as a mark (selection tint, egg-2 grid, memekit line, harness score).
  - Model-mix slots 5/6 are near-identical greys; the labels carry the difference.
  - The night legend sits outside the dark card during egg 3.
  - Schedule column headers are hidden from assistive tech.
  - The home page has two "Notes" headings.
- Manual device test checklist: `.scratch/feat-drawing-set-redesign-test-checklist.html`.

## Resume pointer

Once the PR is open: run the manual checklist on a real phone, merge, then regenerate the OG image. Nothing else is in flight.

## Models

- Orchestrator: Opus 5.5 (proposal, canvas, plan, browser gates, rulings).
- Implementers: Sonnet, with one Opus escalation (fix round 4 of the Task 7 revisions overflow).
- Task reviewers: Opus. Scoped re-reviews: Sonnet (Opus for the final fix wave). Final whole-branch review: Fable.
