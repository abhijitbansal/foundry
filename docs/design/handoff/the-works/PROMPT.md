# Task: implement "The Works" commit city (Telemetry + Weekly Updates)

Read `README.md` in this folder first — it is the full spec. `works-city.jsx` is the executable reference implementation (React prototype); port it, don't ship it.

## Goal
Add the isometric "yard plan" visualization to the Foundry site as a build-time, zero-client-framework feature:

1. `src/lib/works.ts` — pure generator (projection, seeded PRNG, storeys = lines added with `^0.6` scaling, layout tables copied verbatim from `works-city.jsx`, painter's ordering). Typed like the other lib modules; add vitest unit tests (see README "Suggested tests").
2. `src/components/WorksCity.astro` — renders variant `yard` (1160×612) or `strip` (620×448) as inline SVG, all paint via `var(--ds-*)` tokens (see README palette section). `role="img"` + aria-label; `<title>` per building for hover v1.
3. `src/components/Telemetry.astro` — insert the new full-width "The works" card **between the stat grid and the "Since May 1" activity card**: header row, yard SVG, legend row, ledger grid ranked by lines added, caption line (exact markup spec in README).
4. `src/pages/updates.astro` — per week card, after the stat minis: "Activity" row with WORKS ⇄ GRID pill toggle (tiny inline script, WORKS default, persist in `localStorage['fy-updates-view']`); WORKS = strip + caption, GRID = existing `<WeeklyHeatmap>` unchanged.

## Data
- All-time: `data/stats.json` → `repos[].{repo,sessions,lines_added,out_tokens}`; `active` = repo present in the latest `data/weekly/*.json`.
- Weekly: `data/weekly/<week>.json` → `repos[].{repo,sessions,lines_added}`, `releases[repo].{pr_merge_count,pr_titles}`.
- Districts: apps (cubby, doc-scan, floorprint, folix) · agent tooling (claude-skills, cartoon, memekit, sift) · web & sites (foundry, design-system).

## Constraints
- Follow repo conventions (AGENTS.md / CLAUDE.md): inline styles, `.ds-*` utility classes, tokens only (no hex), no client framework, no dependencies.
- Smoke/flicker keyframes inline; guard with `prefers-reduced-motion: reduce`.
- Dark mode must be free: tokens only. Lit windows: `--ds-accent` (light) / `--ds-secondary` gold (dark) — match the prototype's night shift.
- Layout tables are hand-tuned; copy them. Add a build-time warning (or failing test) when a repo in stats.json has no layout slot.
- Type floor: nothing under 7px in the SVG; ledger text uses existing `.ds-micro` / `.ds-caption`.
- Keep the existing heatmaps untouched; this is additive.

## Acceptance
- index: yard card renders between stat grid and activity card, light + dark, hover `<title>`s present, ledger matches stats.json numbers.
- updates: every week card defaults to WORKS strip (pennants = min(6, PR merges)); GRID shows the exact previous heatmap; toggle persists.
- `npm test` green including new works.ts tests; no console errors; reduced-motion renders static.
