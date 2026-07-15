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

**Follow-ups:** none open at the time — see Phase 6 below, three of the "no open decisions" turned out to have real bugs once screenshotted.

**Resume pointer:** Branch `feat/harness-showcase-page`, folds into PR #18. Working tree clean after this phase's commit — no open decisions remain.

**Models:** Sonnet 5 (executor) throughout Phase 5; Opus advisor consulted once before implementation (confirmed the contrast diagnosis, the advisor-pattern gap, and flagged the iOS `requestFullscreen` and React-island-move risks ahead of time — see Achieved above for how each was resolved).

### Phase 6 — Fullscreen was actually broken; fixed for real this time

User came back with 6 more screenshots. Three were genuine bugs in Phase 5's fullscreen work, not new requests — logged here in full because the diagnosis mattered as much as the fix.

**Achieved:**
- **Fullscreen rendered in the wrong brand color (red, not cyan).** `--ds-accent` is brand-scoped (`brands.css`, `.brand-skills` on `<main>`), not set at `:root` — `:root`'s own default is Paperix red. `#harness-fs-overlay` is a sibling of `<main>`, not a descendant, so it fell through to that red default for every accent-colored element inside it (active tabs, close-button hover, leader-line captions in the Hall figure). Fixed by adding `class="brand-skills"` to the overlay div. Not by design, as the user suspected.
- **Fullscreen's "bigger text" fix from Phase 5 barely did anything.** `width:1100px` against a `viewBox` that's ~1140 wide for most figures is a 0.96× scale — *smaller* than native, not bigger. Contrast (Phase 5) was real progress but was never the whole fix; size matters just as much, including on desktop-width cards (image evidence: the Conveyor figure was still unreadable at regular desktop card width, not just on mobile).
- **Rebuilt fullscreen sizing as contain-fit + an explicit zoom control**, per advisor's plan: `.harness-fs-active` gets a definite `width: min(88vw, 1500px)` (verified in-browser that a *percentage* max-width here creates a circular auto-sizing dependency between the wrapper and its `viewBox`-only svg — Chrome resolves that cycle by collapsing both to 0×0, not by falling back to any default size); the untouched `width:100%;height:auto` on the svg itself then resolves against that definite width, same as it already does in the normal embed. A `+`/`−` zoom control in the fullscreen bar (`src/lib/harness-fullscreen.ts`, `ZOOM_LEVELS = [1, 1.5, 2, 2.5, 3]`) drives `transform:scale()` on `.harness-fs-active` — scaling the whole card rather than just the inner `<svg>`, because scaling only the svg doesn't push down the caption text that follows it in document flow (first attempt visibly overlapped card copy with the zoomed diagram). Resets to 100% on open and on every tab switch.
- **Fixed a real overflow bug, not just a legibility one.** The Switchyard's fullscreen wrapper carries non-SVG HTML (scenario pills, the trailing caption paragraph) that had no width constraint in the flex-centered stage — it sized to its own unconstrained max-content width and bled off both edges symmetrically (`justify-content:center` hides overflow evenly, which is exactly why it read as "text is cut off" on both sides rather than "needs scrolling"). The same `width: min(88vw, 1500px)` on the wrapper fixes this for free.
- **CTA copy, humility framing:** hero button → `Help me get better ↗` (user's own words); footer headline `Steal what's useful. Tell me what's wrong.` → `Steal what's useful. Help me get better.` so the two don't clash in tone.
- **Checked the reported "text overflowing... regular too"** against the non-fullscreen embed directly: no DOM/CSS overflow exists there (`document.body.scrollWidth === window.innerWidth` on a 390px viewport) and the `advisor` scenario's long `gateNote` string measured fully inside the viewBox (`bboxX` 515, right edge 1128, viewBox width 1140 — no clip). The "overflow" read there is the embed's inherent scale (viewBox ~1140 rendered into a ~350-390px mobile card ≈ 0.3×, so an 8px nominal caption paints at ~2.5px) rather than a layout bug — the fullscreen + zoom fix above is the intended answer to that, not a change to the inline embed's own sizing.
- Verified in-browser via chrome-devtools MCP emulation at each fix, not just at the end: mobile (390×844) and desktop (1512×900), dark and light, for Hall/Switchyard/Conveyor/Ledger/Loop, at 100% and zoomed to 200%. Confirmed: correct cyan accent throughout, centered + large by default, zoom control reaches genuinely readable text with no overlap or clipping, Switchyard's pills stay interactive after the move, no console errors. `npm run build` green throughout.

**Decisions:**
- Percentage sizing (`max-width:100%`, `max-height:100%`) on an element whose parent has no definite width is not safe for this codebase's figures — they're `viewBox`-only `<svg>` with no `width`/`height` attributes, so there's no intrinsic size for the browser to fall back to, and the cycle collapses to 0×0 in Chrome rather than to any sane default. Any future figure-sizing work should give the wrapper a definite (viewport-relative or px) width first, then let the svg's own `width:100%` resolve against it.
- Scale-the-whole-card over scale-just-the-svg for the zoom control — the reverse breaks document flow between the diagram and any trailing HTML caption, which only the Switchyard has today but would bite any figure that grows one later.

**Follow-ups:** none open.

**Resume pointer:** Branch `feat/harness-showcase-page`, folds into PR #18. Working tree clean after this phase's commit — no open decisions remain.

**Models:** Sonnet 5 (executor) throughout Phase 6; Opus advisor consulted once before implementation (confirmed both bug diagnoses, proposed contain-fit + explicit zoom over per-chip hover — "hover is dead on touch, which is exactly where legibility is worst" — and flagged the exact desktop-vs-mobile sizing tension that drove the final design). Two in-browser regressions (0×0 collapse, zoomed-text overlap) were caught empirically after the first two implementation attempts looked correct in the CSS but weren't — both fixed by measuring computed styles/bounding boxes directly rather than reasoning further about the cascade.

### Phase 7 — Ready-for-PR pass (no merge)

User asked for the branch made fully ready without merging. Full gate sweep, not just a re-check of prior work.

**Achieved:**
- `npm run build`, `npm test` (93 tests) — both green.
- **CI was actually broken**, found by checking `gh pr checks` rather than assuming green: `npm ci` failed on the runner with `Missing: @emnapi/core@1.11.2 from lock file`. Root cause: local npm 11.5.1 silently tolerates a lock file that's missing this entry; CI's Node 22 setup uses npm 10, which enforces it strictly and hard-fails. Reproduced locally with `npx npm@10 ci`, fixed by regenerating with `npx npm@10 install` (12-line diff), verified clean under both npm versions plus a full build+test pass. Second time this exact failure mode has hit the repo (see `ea94028`) — added an explicit `npx npm@10 ci` gate to `AGENTS.md`'s push checklist so it isn't rediscovered a third time.
- Ran a second workflow-backed code review (high effort, 9 agents) against the full branch diff vs `main`, not just the day's changes. 3 findings, all confirmed or plausible, all fixed:
  - **BaseLayout hardcoded every `<head>` tag to the homepage** with no override — `/harness/`, built specifically to be "shared via LinkedIn" per this file, was unfurling and getting indexed as a duplicate of the homepage. Added optional `title`/`description`/`canonicalPath` props to `BaseLayout.astro`, defaulting to the existing homepage values (index/updates/404 render byte-identical `<head>` output, unchanged); `harness.astro` now passes its own.
  - **`aria-modal="true"` on the fullscreen overlay was cosmetic** — nothing stopped Tab from walking out into the rest of the page. Fixed with `inert` on every background sibling of the overlay, toggled in `open()`/`close()`.
  - **Zoom's `transform-origin: center top` made the left half of a zoomed figure unreachable by scroll** — content grew equally in both directions from center, and `overflow:auto` only reliably reaches growth in the positive direction from a fixed point. Changed to `left top`; verified via `scrollWidth`/`scrollLeft` measurements and screenshots at 300% zoom that the entire figure is now reachable in both scroll directions.
- Updated the PR #18 description to cover all three phases of work (it previously only described the initial build).
- Regenerated `.scratch/feat-harness-showcase-page-test-checklist.html` (gitignored, delivered separately) to cover everything added since it was first created: the advisor scenario, the fullscreen mode end-to-end, and 5 explicitly-tagged regression checks for the bugs found and fixed in Phases 6–7 (wrong accent color, insufficient zoom magnification, text overlap at zoom, Switchyard text bleeding off-screen, and — new — the keyboard-focus-trap and zoom-scroll-reachability fixes from this phase).

**Decisions:** none new — this phase was verification and fixing already-decided work, not new design.

**Follow-ups:** none open.

**Resume pointer:** Branch `feat/harness-showcase-page`, 18 commits ahead of `main`, folds into PR #18 (description updated, not merged per instruction). Build/tests/CI all green, code review clean, working tree clean.

**Models:** Sonnet 5 (executor) throughout Phase 7; workflow-backed code review (9 agents, high effort) is the verification mechanism, not a second opinion sought separately — its 3 findings were all real and are the bulk of this phase's work.
