# The Works — commit city (Telemetry + Weekly Updates) implementation plan

Source spec: `docs/design/handoff/the-works/README.md` (full spec) + `docs/design/handoff/the-works/works-city.jsx` (executable reference — port math/tables/drawing order, do not ship React). Design is locked/high-fidelity; this plan maps it to Astro files. Executor tier (Sonnet), medium-high effort — no design decisions left open, this is a build task.

## Global constraints (from README + AGENTS.md)
- Zero client framework. Build-time generation only; inline SVG string, no React.
- Tokens only (`var(--ds-*)`), never hardcoded hex.
- Layout tables (`YARD`, `YARD_PLATES`, `STRIP`) are hand-tuned — copy verbatim, keyed by repo name.
- Build-time warning/failing test when a repo in `data/stats.json` has no `YARD` slot.
- Type floor: nothing under 7px in the SVG.
- `prefers-reduced-motion: reduce` → static single puff, no flicker, no `fywFlick`.
- Additive only — existing `Heatmap.astro`/`WeeklyHeatmap.astro` untouched.

## File structure
- `src/lib/works.ts` (new) — pure generator + types
- `src/lib/works.types.ts` (new) — `WorksRepo`, `WorksVariant`, layout table types
- `tests/unit/works.test.ts` (new)
- `src/components/WorksCity.astro` (new)
- `src/components/Telemetry.astro` (edit — insert card)
- `src/pages/updates.astro` (edit — insert toggle + strip)

## Phase 1 — `src/lib/works.ts` + tests
### Task 1.1: Types + projection/PRNG/math helpers
Port `makeProj`, `seeded`, `fmtK`, `storeysFor` (score = lines_added), `litFrac` (`max(0.12, sqrt(out_tokens/maxOutTokens))`, weekly uses `sessions` in place of tokens per README). Build-time coverage check: every `stats.json` repo must have a `YARD` slot — throw at generation time (surfaces as a build failure, satisfies "failing test" requirement more strongly than a console warning).

### Task 1.2: Layout tables
Copy `YARD`, `YARD_PLATES`, `STRIP` verbatim from works-city.jsx (coordinates, arch types, plate indices, stacks, np positions, flags).

### Task 1.3: SVG string builders
Port paint primitives (`Po`/`Ln`/`Tx` → polygon/line/text string builders) and geometry pieces (`ground`, `shadowOf`, `boxWalls`, `flatTop`, `gableRoof`, `sawtoothRoof`, `monitorRoof`, `chimney`, `smoke`, `windows`, `pennants`, `ingotStack`, `rail`, `flatcar`, `gantryCrane`, `vacantLot`, `furnaceMouth`, `numberPlate`, `districtLabel`, `titleBlock`, `northArrow`, `scaleBar`) as functions returning SVG markup strings, ported 1:1 from the reference. Painter's order: plates → rail → buildings sorted by `(layout.x + layout.y)` ascending → crane/ingots → furniture.

### Task 1.4: Public API
`buildWorksCity(repos: WorksRepo[], variant: 'yard' | 'strip', opts?: { night?: boolean; motion?: boolean }): { svg: string; ariaLabel: string; ledger: LedgerEntry[] }` — `night` is theme-agnostic (CSS handles color via tokens; `night` only toggles which token *name* — accent vs secondary — glows, matching README's "lit windows: light theme `--ds-accent`, dark theme `--ds-secondary`" so this still needs a light/dark branch at generation time, resolved via a tiny inline `<script>`-free CSS trick: **decision — see Task 1.5**).

### Task 1.5: Theme handling decision
The generator runs at build time with no knowledge of the visitor's theme. Two options: (a) generate two SVGs (light+dark) and toggle visibility via CSS `:root[data-theme]`, or (b) always paint lit windows with a CSS variable expression that resolves per-theme (`color-mix`/custom prop swap) instead of picking `--ds-accent` vs `--ds-secondary` at generation time. **Use (b)**: emit `var(--ds-lit-window, var(--ds-accent))` and define `--ds-lit-window: var(--ds-secondary)` under `:root[data-theme="dark"]` (mirrors how the rest of the site free-rides on token swaps, avoids doubling SVG payload). Same trick for furnace/ingot "always molten = secondary" elements — those are unconditional `--ds-secondary`, no swap needed.

### Task 1.6: Tests (vitest, mirrors `tests/unit/weekly.test.ts` style)
- storeys: max repo → 8 (yard maxStoreys), zero lines → 0 (lot), monotonic with score, min 1 for any repo with score > 0.
- litFrac: bounds [0.12, 1], deterministic seeding (same seed string → same sequence).
- layout coverage: every repo in a fixture repo list has a YARD slot; missing slot throws.
- weekly: pennant count = `min(6, pr_merge_count)`; strip only renders repos present in that week's `repos[]`.
- snapshot-free: assert on structured output (ledger ranks, storeys map), not raw SVG string matching (brittle).

## Phase 2 — `src/components/WorksCity.astro`
Props: `variant: 'yard' | 'strip'`, `repos`, `night` not needed (CSS-driven per Task 1.5), `stamp?` (strip week label). Calls `buildWorksCity`, renders `<svg>` via `<Fragment set:html={svg} />` (trusted build-time data only, not user input — safe). `role="img"` + `aria-label`. Wrap in reduced-motion-safe container — motion is already baked into the SVG's own `<style>` block with the `@media (prefers-reduced-motion: reduce)` override ported verbatim from the reference, so no extra Astro-level guard needed.

## Phase 3 — `Telemetry.astro` card
Insert between stat grid (`totals.*`) and the `data-reveal` "Since May 1" `<article>`. Markup per README §"Card markup around the SVG" #1-5 verbatim: header row, `<WorksCity variant="yard" />`, legend row, ledger grid (`auto-fill minmax(215px,1fr)`) ranked by lines added, caption line. `active` flag sourced from latest `data/weekly/*.json` (reuse the same `import.meta.glob` pattern as `updates.astro`).

## Phase 4 — `updates.astro` toggle
Per week `<article>`, after stat minis, before `<WeeklyHeatmap>`: Activity row + WORKS/GRID pill toggle + `<WorksCity variant="strip" stamp={...} />` (default visible) / `<WeeklyHeatmap>` (hidden by default, `hidden` attribute toggled). Tiny inline `<script>` at the bottom (site precedent: `Nav.astro`'s theme script) — event-delegated click handler over `.fy-works-toggle` buttons, `localStorage['fy-updates-view']` read on load to set initial per-card state, write on click.

## Phase 5 — QA
- `npm run build && npm test` green.
- Dev server screenshots: index `#telemetry` light + dark, `/updates` light + dark, hover a building (`<title>` present).
- Reduced-motion emulation: static single puff, no flicker.
- No console errors.

## Phase 6 — Review & ship
- `/code-review` (Workflow, high effort) on the diff.
- Fix CRITICAL/HIGH.
- Atomic commits per phase, single branch/PR per AGENTS.md.
- Interactive HTML manual-test checklist in `.scratch/` for anything a screenshot pass can't cover (hover tooltips on a real pointer, reduced-motion OS setting, toggle persistence across reload).
