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
