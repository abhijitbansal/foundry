# Handoff: The Works — commit city for Telemetry + Weekly Updates

## Overview
"The Works" is an additive data visualization for the Foundry portfolio: the repo portfolio drawn as an isometric foundry yard plan. One building per repo — **storeys = lines added**, lit windows = tokens out, smoke = currently active, pennants = PRs merged that week, vacant lot = repo with no lines yet. It ships on two surfaces:

1. **index `#telemetry`** — a new full-width "The works" card with the all-time yard plan, placed **between the stat grid and the "Since May 1" activity card**.
2. **updates page** — a compact per-week strip inside each weekly digest card, behind a **WORKS ⇄ GRID toggle**. The existing hour×weekday heatmap (GRID) stays, untouched; WORKS is the default view.

Dark mode costs nothing: every mark is painted with `var(--ds-*)` tokens, so the site's existing theme toggle flips it to the "night shift" (gold-glowing windows) automatically.

## About the Design Files
The files in this bundle are **design references created in HTML/React** — prototypes showing intended look and behavior, **not production code to copy directly**. The task is to **recreate this in the foundry repo's existing environment**: Astro, zero client framework, build-time rendering, inline styles, House DS utility classes and tokens (see the repo's `AGENTS.md` / `CLAUDE.md` conventions). `works-city.jsx` is the executable spec — port its math, layout tables, and drawing order; do not ship React.

## Fidelity
**High-fidelity.** Geometry, palette mapping, typography, and interaction behavior are final. Recreate pixel-perfectly against the DS tokens (never hardcoded hex).

## Recommended implementation shape (Astro)
- `src/lib/works.ts` — pure build-time generator: `(repos, config) => svg element descriptors` (or an SVG string). Port from `works-city.jsx`: projection, seeded PRNG, storeys math, layout tables, painter's ordering. Unit-testable with vitest like the other `src/lib/*` modules.
- `src/components/WorksCity.astro` — renders the inline `<svg>` from the descriptors. Variants: `yard` (all-time, 1160×612 viewBox) and `strip` (weekly, 620×448 viewBox). `width:100%;height:auto`.
- `src/components/Telemetry.astro` — insert the new card (markup spec below).
- `src/pages/updates.astro` — insert the toggle + strip above `<WeeklyHeatmap>`.
- Hover tooltips: start with per-building `<title>` (zero JS). The floating stat card from the prototype is an optional enhancement via a ~40-line inline vanilla script (site precedent: theme toggle script).

## Data contract (all fields already exist)
**All-time (yard)** — `data/stats.json`:
- per repo from `repos[]`: `repo`, `sessions`, `lines_added`, `out_tokens`
- `active` flag: repo appears in the latest `data/weekly/*.json` (or sessions within last 7 days)
- district grouping (mirror of PROJECTS.md): apps = cubby, doc-scan, floorprint, folix · agent tooling = claude-skills, cartoon, memekit, sift · web & sites = foundry, design-system

**Weekly (strip)** — `data/weekly/<week>.json`:
- per repo from `repos[]`: `repo`, `sessions`, `lines_added`
- `releases[repo].pr_merge_count` → pennants; `pr_titles` (may be null) → tooltip detail

No per-repo commit counts exist; **lines added is the height metric by design**. If commit counts are added to `scripts/stats` later, only the score function changes.

## Encodings (exact math)
- **Storeys**: `score = lines_added`; `storeys = score <= 0 ? 0 : max(1, round(maxStoreys × (score/maxScore)^0.6))`. `maxStoreys = 8` (yard) / `6` (strip). `storeys === 0` → vacant lot, not a building.
  - Yard result with current data: cubby 8, claude-skills 5, floorprint 4, cartoon 2, sift 2, memekit 2, foundry 1, doc-scan 1, design-system 1, folix lot.
- **Lit windows**: `litFrac = max(0.12, sqrt(out_tokens / max_out_tokens))` (weekly has no per-repo tokens → use `sessions` in place of tokens). Each window is lit iff `seededRandom(repoName) < litFrac` — deterministic PRNG seeded by repo name so every build renders identically.
- **Smoke** (2–3 drifting outline puffs per chimney/vent): only when `active`.
- **Pennants** (weekly only): `min(6, pr_merge_count)` accent triangles spaced along the roof ridge.
- **Ingots** (yard dressing): 1 ingot ≈ 10k lines; stacks placed by the crane (cubby: 12), tooling district (5), floorprint (3). Top ingot gold = still hot.
- **Crane** = work in progress (over the cubby yard). **Furnace mouth** (gold, glowing) on cubby. **folix**: dashed lot boundary, 4 survey stakes with accent flags, sign board.
- **Building archetypes** (fixed per repo, see `YARD`/`STRIP` tables in works-city.jsx): cubby = gabled furnace hall + sawtooth casting annex + twin stacks; claude-skills = clerestory monitor block + stack; floorprint = monitor block; sift/cartoon/doc-scan = gabled sheds; memekit/design-system = flat sheds; foundry = gabled gatehouse with accent flag.

## Geometry & drawing order
- Isometric projection: `X = ox + (x − y)·cos30°·S`, `Y = oy + (x + y)·sin30°·S − z·S`. Yard: `S=30, ox=268, oy=236`. Strip: `S=26, ox=126, oy=172`.
- Storey height 0.6 units + 0.36 base; buildings are boxes with 3 visible faces: top (`--ds-surface`), SE light face (`--ds-surface-2`), SW shade face (`color-mix(in srgb, var(--ds-text) 13%, var(--ds-surface-2))` + 45° hairline hatch pattern overlay at 0.35 opacity).
- Painter's algorithm: draw plates → rail → buildings sorted ascending by `(layout.x + layout.y)` → crane/ingots → furniture (title block, north arrow, scale bar, district labels).
- Halls skip ground-storey windows on the shade face (furnace/doors live there); a hall with an annex skips its covered gable-end windows.
- **Layout tables are hand-tuned — copy `YARD`, `YARD_PLATES`, `STRIP` verbatim.** Layouts are keyed by repo name; a new repo needs a slot added to the table (buildings without a slot are skipped).
- Ground shadows: flat quad toward +x, `var(--ds-text)` at 0.055 opacity.
- Engineering furniture (yard only): title block bottom-right ("The Works" in `--ds-font-display`, sheet no., survey line, scale line), north arrow top-right, storey scale bar bottom-left, district labels (accent tick + `--ds-text-3` mono, 8.5px, 0.16em tracking).

## Palette (tokens only — never hex)
- Linework: `--ds-text-2` (main, 0.7px hairline / 1.05px emphasis), `--ds-text-3` (soft), `--ds-text-faint`, `--ds-line`, `--ds-line-strong`, ridge lines `--ds-text`.
- Fills: `--ds-surface`, `--ds-surface-2`; plate `color-mix(in srgb, var(--ds-surface-2) 62%, var(--ds-surface))`; unlit window `color-mix(in srgb, var(--ds-text) 24%, var(--ds-surface-2))`; glass `…20%…`.
- Lit windows: **light theme `--ds-accent`** (teal on brand-skills), **dark theme `--ds-secondary`** (gold) + halo circles (r≈6.5, opacity 0.13). Molten things (furnace mouth, hot ingot, crane load at night, annex glazing at night) are always `--ds-secondary` — the hot end of the existing heatmap ramp.
- Pennants/flags/survey ticks/number plates: `--ds-accent`.

## Typography in the SVG
JetBrains Mono (`--ds-font-mono`) throughout: district labels 8.5px/0.16em, strip building labels 9px 600 + 7.4px faint, title block rows 7.6px, number plates 7.2px 600. Title block wordmark: `--ds-font-display` 16.5px. Never smaller than 7px.

## Card markup around the SVG
**Telemetry card (index)** — `ds-surface` card, `--ds-radius-lg`, 1px `--ds-line` border, 24px padding, `data-reveal`:
1. Header row: `.ds-micro` `--ds-accent-hover` "The works — one building per repo" · right `.ds-micro` faint "All-time · {date range} · {n} repos · hover a building".
2. The yard SVG (`role="img"` + descriptive `aria-label`).
3. Legend row (hairline top border): `.ds-micro` pairs — height/lines added, lit windows/tokens out, smoke/active this week, ingots/1 ≈ 10k lines, crane/work in progress, pennants/PRs merged (weekly).
4. Ledger grid (`auto-fill minmax(215px,1fr)`), one entry per repo **ranked by lines added**: accent `01` rank · repo name (mono 600) · "{n} storeys" faint · caption "{sessions} sessions · {lines} lines · {tokens} tok out". This is the screen-reader-friendly data path.
5. Caption line: "Yard ledger: cubby — tallest hall on the yard… folix — site cleared, groundbreaking soon."

**Updates card (per week)** — inside the existing week article, after the stat minis:
- Row: `.ds-micro` "Activity" left; right two pill buttons WORKS / GRID (`--ds-radius-pill`, 1px border; active = `--ds-accent` text+border, inactive = `--ds-text-3` text + `--ds-line` border, 5px 12px padding, 0.1em tracking).
- WORKS (default): strip SVG + caption "Height = lines added this week · pennants = PRs merged · hover for the PR titles." Stamp top-right of SVG: "WEEK {id} · {range}".
- GRID: the existing `<WeeklyHeatmap>` exactly as-is + its caption.
- Toggle: tiny inline vanilla script; optionally persist choice in `localStorage['fy-updates-view']`.

## Interactions & Behavior
- Hover/focus a building: that building stays full opacity, all others dim to 0.38 (0.25s `--ds-ease-standard`); number plate highlights accent. Tooltip card: `--ds-surface`, 1px `--ds-line-strong`, `--ds-radius-sm`, `--ds-shadow-pop`, 10×13px padding, min-width 188px; rows mono 9–9.5px (storeys, sessions, lines added, tokens out / PRs merged); weekly adds up to 2 ellipsized PR titles. `<title>`-only fallback is acceptable v1.
- Motion: smoke puffs `fywPuff` 8–13s staggered linear infinite (translate(−13px,−34px) scale 0.55→1.65, opacity 0→0.55→0); furnace halo `fywFlick` 4.2s opacity 0.16↔0.30. **Respect `prefers-reduced-motion: reduce`** — static single puff, no flicker.
- Entrance: reuse the site's `data-reveal` on the card, not on individual SVG marks.

## State Management
None beyond the updates-page view toggle (works | grid). Everything else is computed at build time from the JSON.

## Assets
None — the drawing is 100% generated inline SVG. No images, no icon fonts.

## Files in this bundle
- `works-city.jsx` — **the executable spec**: projection math, layout tables (`YARD`, `YARD_PLATES`, `STRIP`), archetype constructors, palette map, animation keyframes, tooltip. Port this.
- `src/Foundry 3A - The Works.dc.html` — the full design document (3a telemetry card, 3b weekly toggle card, 3c night shift). Reference only; view it in the design project.
- `data/weekly-2026-W27.json` — the real week used in the prototype (repos, heatmap, releases).
- `PROMPT.md` — ready-to-paste Claude Code task brief.

## Suggested tests (vitest, mirroring src/lib conventions)
- storeys: max→8, zero-lines→0(lot), monotonic, min 1 for any active repo.
- litFrac: bounds [0.12, 1]; deterministic window seeding (same input → same output).
- layout coverage: every repo in stats.json has a `YARD` slot (fail loudly when a new repo appears).
- weekly: pennant count = min(6, pr_merge_count); strip only renders that week's repos.
