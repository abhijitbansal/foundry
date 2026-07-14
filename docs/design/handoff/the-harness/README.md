# Handoff: Foundry — The Harness (exploration 05)

## Overview
A long-form showcase section for the portfolio: how the Claude Code harness around Cubby actually works — hooks, guards, routing, recorders — drawn as an isometric machine hall, with an interactive routing switchyard, a hook-lifecycle conveyor, the dev-tracker ledger, the CLAUDE.md/AGENTS.md story, the enabled arsenal, and the honest 79/100 audit. Ends in a feedback CTA (LinkedIn audience).

## About the design files
Files in `src/` are **design references built in HTML** — not production code. Recreate them in the Astro portfolio repo using its existing patterns (same repo/tokens as `design_handoff_foundry`). The one exception: `src/harness-hall.jsx` is framework-free React (`React.createElement` only, no JSX transform needed at runtime if precompiled, no imports beyond global `React`) and ports nearly verbatim into an Astro island or can be rendered to static SVG at build time — the SVGs are deterministic except for the switchyard's scenario prop.

## Fidelity
**High-fidelity.** Colors, type, and spacing are final and expressed entirely as `var(--ds-*)` tokens (already in the repo from the Foundry handoff). Dark theme is forced on this page (`data-theme="dark"`). Copy is final — every number (79/100, 51 KB, 305 lines, 13 plugins, 114/360 skills, 1.8M tokens) is real; do not invent or round.

## Integration with the main page — IMPORTANT
This section ships **inside the main portfolio page**, which already has its own menu:

- **Do not port the fixed header** in the reference (it exists only for standalone preview; the reference has a `showNav` switch for exactly this). 
- Keep the section anchors — `#routing`, `#lifecycle`, `#tracker`, `#paper`, `#arsenal`, `#score` — so the main page's menu (or a sub-nav) can deep-link into them. If the main menu gains a "Harness" item, point it at the hero (`#top` in the reference; rename to avoid colliding with existing ids).
- The hero's top padding (150px) assumed a fixed header; when embedded, use the main page's section rhythm instead.

## Files
- `src/Foundry 5A - Harness.dc.html` — the full page: markup, copy, scenario data, dimension scores, easter-egg logic. Treat as the spec.
- `src/harness-hall.jsx` — the five SVG figures, exposed as `window.FoundryHarness.{Hall, Switchyard, Lifecycle, Tracker, Loop}`. Label positions inside are collision-tuned; port coordinates verbatim, do not re-layout.
- `PROMPT.md` — the build prompt for Claude Code.

## Interactions & behavior
- **Switchyard scenarios**: five pill buttons (`fix`, `review`, `wave`, `audit`, `team`) set one state var; it drives the `Switchyard` SVG prop plus the mode label, ask line, and 3–4 detail lines (all data in the DC logic class `DEFS`).
- **Ambient motion**: three keyframes — `fyh-flow` (dash flow, 1.7s), `fyh-smoke` (5.2s), `fyh-glow` (3.4s) — all disabled under `prefers-reduced-motion`.
- **Easter egg — the service hatch** (see PROMPT.md §Easter egg): an HTML comment addressed to agents near the top of the served source, a styled console banner on load, and a global `AGENTS()` function printing the register digest. One faint tell line in section 04.

## Design tokens
None new. Everything references the existing `--ds-*` set; the figures use `color-mix()` blends of those tokens (see `C` map at the top of `harness-hall.jsx`).

## Assets
None. All figures are inline SVG; no images, no new fonts.
