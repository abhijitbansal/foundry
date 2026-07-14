# Session: The Harness — showcase page

**Session:** 6
**Started:** 2026-07-14
**Date:** 2026-07-14
**Branch:** feat/harness-showcase-page
**Last updated:** 2026-07-14

## Checkpoints

### Phase 1 — Understand the spec + decide deviations

**Achieved:**
- Read `docs/design/handoff/the-harness/PROMPT.md`/`README.md`/`src/*` (relocated this session from a bare `design_handoff_harness/` at repo root, following the `the-works/` precedent). Consulted advisor before building; advisor flagged two real risks: forced-dark theme untested in light, and the easter-egg comment needing to survive Astro's compiler at the right place in a real build.
- Surfaced three open decisions to the user rather than deciding silently: (1) both-theme support vs. the reference's forced dark, (2) page placement, (3) React island vs. dependency-free build-time SVG for the interactive figure.
- User's answers diverged from the recommended defaults on two of three: standalone `/harness/` route instead of an embedded main-page section, and React added as a new scoped dependency for the Switchyard island instead of the fully dependency-free approach used for the other four figures.

### Phase 2 — Build

**Achieved:**
- `src/lib/harness-svg-primitives.ts` + `src/lib/harness-svg.ts` — the four static figures (Hall, Lifecycle, Tracker, Loop) ported from `harness-hall.jsx`'s `React.createElement` calls to plain build-time TS string builders, mirroring `works.ts`/`works-svg.ts`. Zero client JS for these four.
- `src/components/harness/RoutingCard.tsx` — the one interactive figure (Switchyard), a `client:visible` React island; `@astrojs/react` + `react`/`react-dom` added to `package.json`, scoped to this single component.
- 8 section components under `src/components/harness/`, `src/pages/harness.astro` (standalone route), `src/lib/harness-hatch.ts` (the three-layer easter egg: source comment, console banner, `AGENTS()`), Nav link, index-page teaser card, `fyh-*` keyframes in `global.css`.
- All copy/data/coordinates ported verbatim per the locked spec (79/100, 51 KB/305 lines, 13 plugins, 114/360 skills, ~1.8M tokens, etc.).

### Phase 3 — Verify

**Achieved:**
- `npm run build` green; curled the built `harness/index.html` to confirm the HELLO AGENT comment survives right after `<body>`.
- Browser pass (Chrome automation) against a real preview server: both console banners fire once each in order, `AGENTS()` works, scenario pills switch correctly (SVG + mode/ask/detail-lines all in sync) via click; light and dark theme both read cleanly across every figure — the color-mix risk the advisor flagged did not materialize (no swap layer needed, unlike `works-svg.ts`'s `FYW_STYLE`).
- Debugged one false alarm: a stale `astro dev` process from an earlier, unrelated session was squatting on port 4321 serving pre-React Vite dependency bundles, producing a `_jsxDEV is not a function` exception that looked like a broken Switchyard. Killed the stale process; the real preview server (4322) rendered correctly. No code bug.
- Generated and delivered the interactive manual-test checklist (`.scratch/feat-harness-showcase-page-test-checklist.html`) for what this pass couldn't reach: real device, real screen reader, OS-level reduced-motion.

### Phase 4 — Workflow code review (high effort) + fixes

**Achieved:**
- 7 findings, all confirmed by independent verification (no functional/correctness bugs found by the three correctness-angle finders — all from the cleanup angle). Fixed the five mechanical ones:
  - **Correctness**: the audit section's "Full method + scorecard" citation pointed at `docs/harness/EVALUATION.md`/`ARCHITECTURE.md` with no repo qualifier — those paths belong to the private Cubby repo, not this one. Added `cubby/` prefix + a "(private repo — not published here)" note.
  - **Simplification**: dead ternary in the Hall figure's corner-tick geometry (`c[0] - 0 + (c[0] < 500 ? 0 : 0)` — both branches always 0) — inherited from the source port, simplified to the equivalent no-op-free form.
  - **Reuse**: `RoutingCard.tsx` had its own copy of the `C` design-token map (15 keys) that had already drifted from `harness-svg-primitives.ts`'s copy (21 keys, missing `plate`/`plateEdge`/`shade`/`winOff`/`danger`/`serif`) — now imports `C`/`HAIR`/`Point` from the primitives module instead of redefining them.
  - **Process**: this session log itself (was missing before this fix).
  - **Process**: amended `AGENTS.md`'s Stack decision row to record the scoped React exception approved this session (see Decisions below), since the row was still formally "TBD."
- **Flagged to the user, not fixed unilaterally**: two CONFIRMED findings that the harness page's Paper section (and the `harness-hatch.ts` easter egg) publish verbatim internals of Cubby — a private repo — including its exact file size, internal doc structure, and quoted policy text with incident references. This directly matches `AGENTS.md`'s "never code, secrets, or repo internals" rule for private-project content, but is also the entire premise of the page as specified in the approved design handoff (a public case-study of Cubby's harness). Presented to the user as this session's "reviewed before publish" checkpoint — **user explicitly approved publishing as-is**, treating the design phase's own curation as the intended review. No content change made.

**Decisions:**
- **Stack (amends the still-open row in AGENTS.md):** React + `@astrojs/react` are now a real dependency, but scoped — the site's default remains dependency-free Astro/TS (see `works.ts`/`works-svg.ts`, and this session's own four static figures). React is justified only for genuinely stateful, non-trivial client interactivity where hand-rolled vanilla JS would cost more than it's worth; the general "Stack: TBD" question for the site as a whole remains open.
- Design-handoff source material lives under `docs/design/handoff/<name>/`, not a bare `design_handoff_<name>/` at repo root — confirmed as a repo-wide convention (this session relocated `design_handoff_harness/` to match `the-works/`'s existing precedent from session 0005).
- Cubby private-repo content on the harness page is intentional and user-approved (see above) — not a leak to be cleaned up in a future session.

**Follow-ups:**
- Manual-test checklist items are still open — see `.scratch/feat-harness-showcase-page-test-checklist.html`.

**Resume pointer:** Branch `feat/harness-showcase-page`, 2 commits, not yet pushed. Ready for PR — no open decisions remain.

**Models:** Sonnet 5 (executor, this session) for planning, implementation, and fixes; two parallel Sonnet dispatches for the mechanical SVG/React ports; workflow-backed code review ran its own agent fleet (13 agents) at high effort.

### Phase 5 — Docs sync + user-driven visual fixes

**Achieved:**
- Docs sync: rewrote `README.md`'s "Current state" (was still "scaffold only, not built yet") and expanded its repo map; amended `AGENTS.md`'s Stack/Deploy rows from "TBD" to their actual locked values, folding in the two scoped exceptions already recorded in Phase 4.
- Five user-reported visual fixes against screenshots of the live page, routed through advisor before implementation:
  - **CTA copy** — hero button `Tell me what's wrong ↗` → `Tell me what to sharpen ↗` (footer headline left as-is, no clash).
  - **Contrast** — the small SVG captions across all five figures measured ~2:1–4.3:1 against the surface (WCAG AA needs 4.5:1), both themes. Added two new tokens to `harness-svg-primitives.ts`'s `C` map — `capSoft`/`capFaint`, each `color-mix()`ing further toward `--ds-text` — and routed every `Tx()` text fill through them, while leaving `inkSoft`/`inkFaint`'s decorative-stroke uses (smoke, leader lines, hairline ticks) untouched. One shared fix, not five per-figure ones; verified ~7.6:1/4.5:1 dark and ~9.2:1 light by hand before touching code.
  - **Advisor pattern missing from the switchyard** — the 'team' scenario was sonnet+sonnet and depicted nothing like this session's own `advisor()` usage (Sonnet 5 executor, Opus advisor). Added a sixth scenario, `advisor`, to `RoutingCard.tsx`'s `SCN`/`DEFS`: a sonnet drop to the executor furnace plus a dashed "advisor() call" drop to the planner furnace, with caption copy citing this exact page as the example.
  - **No fullscreen** — added `src/lib/harness-fullscreen.ts` + overlay markup/CSS: a `position:fixed` CSS overlay (not `Element.requestFullscreen`, which iOS Safari has historically not supported for non-`<video>` elements) that *moves* each `[data-harness-figure]` DOM node into the overlay and back via a comment placeholder, rather than cloning — this is what lets the Switchyard's live React island survive the trip. A tab strip lets any of the 5 figures be selected without closing the overlay. Esc/backdrop-click/close-button all close and restore focus to the trigger.
  - **Mobile legibility** — in fullscreen, figures render at a forced `1100px` SVG width inside an `overflow:auto` stage; `BaseLayout`'s viewport meta has no `maximum-scale`, so native pinch-zoom already worked, this just gives it something worth zooming into instead of a shrunk-to-fit figure.
- Verified: `npm run build` green; browser pass (dark + light, desktop + real mobile viewport via chrome-devtools MCP emulation) — contrast fix confirmed visually in both themes, advisor scenario renders both drops correctly, fullscreen tab-switching and Esc-restore both work, Switchyard's pills stay interactive after being moved into the overlay, no console errors.

**Decisions:**
- Font sizes in the five figures were deliberately **not** bumped — geometry is collision-tuned per this file's own header comment ("do not re-layout"), and several captions sit inside fixed-width chips/rects where a larger font risks overflow/collision. Contrast alone closed the measured gap (2–4.3:1 → 4.5–9.2:1); the fullscreen feature's forced-width stage is the actual answer to small-on-mobile, so the two problems were split across two fixes instead of stacking risk on font-size.
- `capSoft`/`capFaint` are new tokens, not a remap of `inkSoft`/`inkFaint` — those two also paint non-text strokes (smoke wisps, leader lines, hairline ticks) that should stay faint; remapping the alias would have brightened decoration nobody complained about.

**Follow-ups:** none open.

**Resume pointer:** Branch `feat/harness-showcase-page`, folds into PR #18. Working tree clean after this phase's commit — no open decisions remain.

**Models:** Sonnet 5 (executor) throughout Phase 5; Opus advisor consulted once before implementation (confirmed the contrast diagnosis, the advisor-pattern gap, and flagged the iOS `requestFullscreen` and React-island-move risks ahead of time — see Achieved above for how each was resolved).
