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

---

## Part 2 — Palette & design program (same session, same branch)

User-approved follow-on goal: implement the palette/design review's recommendations in phases; push, test, PR, dev server.

### Review → plan

**Achieved:**
- 7-agent Workflow (6 opus/high lenses — palette, surfaces, type, layout, motion, brand — → opus/xhigh adversarial judge): 51 suggestions → 46 kept / 5 killed (3 absorbed, 1 no-visual-delta, 1 falsified on a hidden-egg measurement). Result JSON: `.scratch/design-pass/palette-review/all-joined.json`.
- **Direction call (hybrid, judge-ratified):** cyan stays the interaction accent; the hero's molten orange formalized as `--fy-ember` (light `#AE4318` / dark `#E8663A` — judge overrode the finder's `#FF8A4C` on saturation + danger-collision grounds). Standing rule: **cyan = instruments & interaction; gold→ember = material & temperature (incl. temperature-statuses); ember never a link/focus/toggle.**
- Proposal delivered (`.scratch/design-pass/palette-plan.{md,html}`), then implementation plan `docs/plans/2026-07-26-palette-design-program.md` (routing decided at plan time: Sonnet executors, opus for scene.ts, Fable orchestration).

### Implementation (44 commits, 8 phases)

**Achieved:** all 42 in-scope items (46 kept minus v2-deferred PAL-9/TYP-3/TYP-5/SUR-7-harness). Sonnet executor pool (4 warm agents, SendMessage-continued) + one opus scene agent. Per-commit build+test green; per-item in-browser verification with measured numbers throughout (computed styles, ratios, scrollWidth, WebGL framebuffer sampling via a headless-CDP probe kept at `.scratch/design-pass/hero-probe.mjs`).

**Decisions (constrain future sessions):**
- `--fy-ember` + `--fy-tint-1/2/3` + Foundry-brand default all scoped at `:root`/`body.ds-root`, NOT `.brand-skills` — portal-overlay safety (extends the PAL-3 rationale). Paperix-red `:root` fallback is dead.
- Heat ramp is single-hue warm: quiet surface-2 → gold 25% → gold 55% → ember → white-hot `--ds-text` (dark 1.0/1.72/3.84/5.64/15.38 vs surface-2, monotonic). `weekly.ts` `heatmapCellColor` uses ember too. Tests pin the exact strings.
- Accents desaturated ~60%: light `#236F86`/hover `#175260` (btn hover `#0F3A44`), dark `#62C4D8`/`#7FD0E0`. The six accent-hover AA workarounds retired.
- Card species: `.fy-plate` (prose; light=shadow, dark=rim-light) / `.fy-well` (data; recessed surface-2). Never on `#fy-yard-card` (egg). Shadow tokens overridden at `html:root` scope (bare `html` loses to `:root` — real trap, caught pre-commit).
- **Inline-style trap (bitten 3×, now doctrine):** an inline `grid-template-columns`/`transition` beats any class rule — move the default into the class and strip the inline property before adding a media-query variant (`.fy-bench`, `.fy-cards`, `.fy-tele-grid`, ProjectCard transitions).
- Scene: light theme has its own art direction (NormalBlending + ember-tinted `haloTexLight`/`etexLight`, swapped in `applyTheme` with the blending mode); `coreEmissiveScale` 1/0.60; MOT-5 pointer-proximity composes inside `heat`. Acceptance: 168,613 → 0 pixels over (250,246,238) at 1440 light. Dark byte-identical except the spec'd fine-pointer flare.
- View transitions ship: sun-pop measured imperceptible (canvas 1.2% opacity at 180ms crossfade end). MOT-2 rule-strike degrades to static ticks on harness (unresolved named timeline renders end keyframe — verified, safe).
- Multi-agent shared-worktree protocol: **path-scoped commits** (`git commit -m … -- <files>`) + `git diff --cached --stat` immediately pre-commit, after two staging races put foreign files in a commit (both caught + repaired via reset).

### Review gate + fixes

- Independent opus whole-diff review: 1 CRITICAL (telemetry 12-col never applied — the inline trap again; horizontal scroll 900–1183px), 1 HIGH (yard bleed content-box overflow 1240–1349px), 2 MEDIUM (title-block `textLength` squeeze; quiet cells 1.00:1 on wells), LOWs. All fixed (4 commits) + re-measured: zero overflow at 900/1024/1100/1180/1240/1360/1440/1728; 12-col gate raised to 1100px; `.fy-yard-bleed` border-box. 103 tests (pins added for yard geometry).
- Hard-constraint sweep clean: zero vendored-token/harness-held-file edits, eggs verified live (night egg triggered on the full-bleed card), `HALO_FIT_NARROW`/`HALO_SCALE_NARROW` untouched.
- 16-shot final screenshot matrix (`.scratch/design-pass/after-v2/`) + orchestrator eyeball pass.

**Follow-ups:**
- v2 branch inherits: PAL-9, TYP-3, TYP-5, `.fy-well` harness application, MOT-2 harness wiring, harness `--fy-tint-warn-1` consumer.
- `ogImage` prop wired, unconsumed — per-page OG card art.
- Pre-existing (reviewer-flagged, untouched): theme toggle under reduced-motion leaves last WebGL frame; memekit aside text-3 on surface-2 4.29:1 light.

**Resume pointer:** branch `feat/site-design-pass` @ `e6644b2`, pushed, PR #25 updated (both programs). Deliverables: `palette-plan.{md,html}`, refreshed `site-design-pass-test-checklist.html`, `after-v2/` matrix. Dev server 127.0.0.1:4321.

**Models:** Fable 5 (orchestration, direction ratification, gates) · Opus 5 (6 lens finders high, judge xhigh, scene executor, branch reviewer) · Sonnet 5 (4-agent executor pool, all batches).
