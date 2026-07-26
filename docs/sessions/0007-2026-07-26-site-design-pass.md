# Session: Site design pass — audit-driven refinements

**Session:** 7
**Started:** 2026-07-26
**Date:** 2026-07-26
**Branch:** feat/site-design-pass
**Last updated:** 2026-07-26

## Checkpoints

### Phase 1 — Scan + routing

**Achieved:**
- Routed via `design-router`: request = "redesign existing"; stack gate fails for Foundry (React without Tailwind — router names this repo as the canonical failing case) → governing rulebook `redesign-existing-projects`, loaded as the session's single design rulebook. `impeccable` excluded (exclusion set 2 vs brainstorming).
- Baseline screenshot matrix: 4 pages × 2 themes × 2 widths at `.scratch/design-pass/baseline/` (scroll-reveal force-revealed; theme set via `localStorage['fy-theme']` — emulating `prefers-color-scheme` is insufficient because dark is pinned by default). Two initially-missing dark-390 baselines (updates, harness) captured pre-implementation after the audit critic flagged the gap.

### Phase 2 — Audit workflow (diagnose + adversarial verify)

**Achieved:**
- 33-agent Workflow: 6 dimension finders (typography, color/contrast, layout, interactivity/motion, components/code, screenshot critique; Opus/high) → 26 findings verified by one adversarial skeptic each (Opus/xhigh, instructed to refute; re-read anchors, recomputed WCAG math, measured computed styles against dev server AND production bundle) → Fable coherence critic.
- Result: **22 confirmed/revised, 4 refuted** (vh→dvh sweep, Expertise alignment, pressed-feedback sweep, reveal stagger — all killed with primary-source proof), 13 low-ranked capped as unverified follow-ups. Full structured result: `.scratch/design-pass/audit-result.json` (session artifact).

**Decisions:**
- Critic-flagged conflicts resolved in the spec: (1) focus-ring duplicate applied once; (2) text-token direction — **informative text on cards → `--ds-text-2`, on page background → `--ds-text-3`, `--ds-text-faint` decorative-only** (the only direction that stays AA once the on-card text-3 fix lands); (3) hero = attribute-keyed scrim (`data-scene-layout` written by `sizeIt()`) + `haloFit` portrait multiplier, media-query arm dropped; (4) nav breakpoint 600→900 sequenced first; (5) `Telemetry.astro:137` single final state (text-2 + lh 1.8).
- All `src/components/harness/*` / `RoutingCard.tsx` contrast+italic fixes **deferred to the held `feat/harness-page-v2` branch** (it supersedes those files and already carries its own contrast commit).
- `works-svg.ts` sub-8px `inkFaint` figure text: filed as follow-up — needs a decorative/text ink split before any swap.

### Phase 3 — Spec + plan + implementation

**Achieved:**
- Spec `docs/superpowers/specs/2026-07-26-site-design-pass-design.md`; plan `docs/plans/2026-07-26-site-design-pass.md` (C1–C18 + V1, per-task exact edits, verifier text authoritative for tails).
- Implemented all 18 units in 4 sequential Sonnet executor phases (C1–C5 contrast/focus, C6–C7 hero+nav, C8–C10 states, C12–C18 type/components; C11 folded into C4), one atomic commit each, build + 93 tests green per commit.
- Orchestrator caught one cross-finding collision post-landing (the coherence critic missed it): C3 moved `.fy-view-btn`/`.harness-fs-tab` **resting** color to text-2, making C10's text-2 **hover** step a color no-op → hover ladder restored as resting text-2 → hover `--ds-text` → selected accent (`c4a8037`).

### Phase 4 — Verification

**Achieved:**
- Per-phase in-browser computed-style assertions (not cascade reasoning): focus ring `outlineStyle:solid` on CTAs; light kicker = `#0A6E88`; on-card labels = text-2 in dark; aria-current only on the current page; anvil ring solid.
- Hero acceptance at 390px, both themes, copy-hidden background sampling: worst-pixel contrast h1 **12.4–13.7:1**, lead **13.0–13.3:1** (floors 3/4.5; baseline measured 1.39–1.47:1). Art confirmed visible outside the text band. `data-scene-layout` flips wide↔narrow on resize; haloFit survives theme toggle by construction (separate multiplier, verified in scene.ts).
- Nav: burger at 768/850/899, single 23px row at 940. 404 renders as a real page with nav/footer in both themes and its own title.
- Critic-gap closures: reduced-motion verified for tilt.ts / three init / eggs (all gate); theme boot verified pre-paint inline (no flash); after-matrix 14 screenshots at `.scratch/design-pass/after/`.

**Follow-ups:**
- Deferred-to-v2 harness contrast/italic edits (enumerated per finding in audit-result.json).
- `works-svg.ts` inkFaint decorative/text split.
- 13 unverified capped findings (audit-result.json `unverified`) — candidates for a future pass.
- Deploy-gated manual checks: live 404 behavior on Pages, robots.txt on the custom domain (in the checklist).

**Resume pointer:** branch `feat/site-design-pass`, all 18 units + docs committed. Deliverables: `.scratch/design-pass/explainer.html` (per-change skill attribution), `.scratch/site-design-pass-test-checklist.html`. Dev server: `astro dev` daemon on 127.0.0.1:4321.

**Models:** Fable 5 (orchestrator, design decisions, spec/plan, conflict resolution, acceptance measurement) · Opus 5 (audit finders high, adversarial verifiers xhigh) · Fable 5 (coherence critic) · Sonnet 5 (four executor phases, medium–high) · cavecrew-reviewer (branch diff review).
