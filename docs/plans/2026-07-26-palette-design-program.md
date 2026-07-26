# Palette & design program — implementation plan

> **For agentic workers:** execute task-by-task; each task's authoritative full spec (exact CSS/TS, ratios, rationale) is its entry in `.scratch/design-pass/palette-review/all-joined.json` (key: suggestion id) — read it before editing. This doc is the routing + sequencing contract.

**Goal:** Implement the judge-approved 2026-07-26 design review (46 kept suggestions minus v2-deferred) on `feat/site-design-pass`, extending PR #25.

**Architecture:** Additive `--fy-*` tokens + scoped `global.css` overrides; vendored `src/styles/tokens/*.css` never edited. New shared classes: `.fy-mono-cased`, `.fy-plate`, `.fy-well`, `.fy-stat`, `.fy-tint-*`. One coordinated `scene.ts` diff for the hero.

**Tech stack:** Astro 7 static, TypeScript, vanilla CSS, Three.js, Vitest. Zero new dependencies.

**Routing (decided here, per AGENTS.md):** default executor = **Sonnet / medium-high**. Divergences tagged per task: `[opus]` = Opus/high (hard visual/framework work). Orchestrator (Fable) verifies each phase in-browser and owns escalations.

## Global constraints

- Never edit `src/styles/tokens/foundation.css`, `brands.css`, `components.css` — overrides go in `src/styles/global.css` (specificity precedent: `html ` prefix, see `global.css` focus-ring block).
- Never touch `src/components/harness/*`, `src/lib/harness-svg*.ts`, `RoutingCard.tsx` (held for feat/harness-page-v2).
- Easter-egg keyframes/behavior untouched: `#fy-yard-card` night egg (`global.css` `.fy-yard-night` block pins bg/border with `!important`), drawings egg pieces, anvil/seal. `.fy-plate`/`.fy-well` must NOT be applied to `#fy-yard-card`.
- `HALO_FIT_NARROW` / `HALO_SCALE_NARROW` (`scene.ts:138-141`) are probe-tuned — do not modify.
- Text-token tier rule: cards `--ds-text-2`, page bg `--ds-text-3`, `--ds-text-faint` decorative-only.
- WCAG AA both themes for every color change (4.5:1 text, 3:1 non-text).
- Conventional commits, one logical change each, footers:
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` + `Claude-Session: https://claude.ai/code/session_01FVhomtKrTeNCv4w5eGeXud`.
  Executors are **authorized to commit exactly the files their task lists — never push**.
- Gates per phase (orchestrator): `npm run build` → `npm test` → in-browser check → push.
- Where a pinned unit test covers changed output (`tests/unit/telemetry.test.ts`, works tests): update the test FIRST (red), then implement (green).

## Deferred (do NOT implement — v2 branch)

PAL-9 (`--fy-secondary-text`, harness files), TYP-3 (tracking curve, bleeds to harness), TYP-5 (`text-wrap:balance` tiers, bleeds to harness), SUR-7's harness applications. Listed in PR body as deferred.

---

### Phase 1 — Foundations & quick wins

| Task | Files | Change (see JSON for full spec) | Commit |
|---|---|---|---|
| PAL-3 | `src/styles/global.css` | `body.ds-root` block restating `.brand-skills` accent family both themes (light `#0E8FB0`/`#0B7894`/soft/`#04141A`/`#B07A18`/`#6D52C4`; dark `#34D3EE`/`#5ADCF1`/soft/`#04141A`/`#E8B94A`/`#A892F0`; dark via both `[data-theme="dark"]` and the `prefers` mirror) | `fix: default document to Foundry brand, kill Paperix-red root fallback` |
| BRA-1 | `src/styles/global.css` | `--fy-ember` `#AE4318` light / `#E8663A` dark (+ `--fy-ember-soft` rgba .10/.14), at `:root` + `html[data-theme="dark"]` + prefers mirror. **Amended hexes, not the JSON's `#FF8A4C`.** | `feat: add --fy-ember second brand token` |
| PAL-1 | `src/lib/telemetry.ts:100-105`, `tests/unit/telemetry.test.ts` | MODEL_MIX_COLORS slot 5 `var(--ds-warning)` → `var(--ds-danger)`; test first | `fix: model-mix legend slot 5 gold to danger — was 1.04:1 from slot 2` |
| TYP-1 | `src/styles/global.css` + call sites (grep `.ds-micro`/`.ds-kicker` content with semantic casing: Expertise, ProjectCard, Hero, Footer, Telemetry) | `.fy-mono-cased { text-transform: none; letter-spacing: 0.06em; }` modifier; apply to SwiftUI/SwiftData/RoomPlan/domains/email runs | `fix: stop uppercasing semantic casing in mono labels` |
| MOT-1 | `src/lib/works-svg.ts:94-95`, reduced-motion block ~:56-58 | Move transition to base `.fyw-building`; add to reduced-motion block | `fix: works-city hover dim releases at 250ms instead of snapping` |
| LAY-2 | `src/lib/works.ts:17,110-116` + any pinned test | Drop yard titleBlock l1/l2; crop 150 viewBox units (`YARD_CONF.vw`) | `refactor: drop yard SVG internal title block, crop dead viewBox` |
| LAY-1 | `src/components/WorksCity.astro`, `src/styles/global.css`, `src/pages/updates.astro` | Cap weekly strip figure width (max-width rule per JSON) | `fix: cap updates weekly strip upscale` |
| BRA-2 | `src/lib/works-svg.ts` light blocks (~:62-70, ~:82-89) | `--fyw-window-lit`/`--fyw-clerestory` → ember mixes; `--fyw-hot-fill` lit in light. Depends BRA-1 | `feat: relight light-theme foundry windows and furnace in ember` |

### Phase 2 — Palette program (strict order)

| Task | Files | Change | Commit |
|---|---|---|---|
| PAL-4 | `src/components/WorkSection.astro:56`, `ProjectCard.astro:33` | "Heating up" pill → warm family (`var(--fy-ember)` for the success-override; keep recently-active on warning) | `fix: map status temperature to color temperature on work pills` |
| PAL-8 | `src/lib/telemetry.ts:29-41` + test | `heatBucketColor` → warm sequential: quiet surface-2 → gold 25% → gold 55% → `var(--fy-ember)` → white-hot `var(--ds-text)`; test first | `feat: single-hue warm heat ramp, frees cyan for interaction` |
| PAL-6 | `src/styles/global.css:509,535` + works-svg.ts:76 | `--fy-tint-1/2/3` (6/14/28% accent mixes) + `--fy-tint-warn-1`; route existing recipes through them (skip HarnessScore — v2) | `refactor: accent tint tiers replace ad-hoc color-mix recipes` |
| PAL-2 | `src/styles/global.css` (extend :265 area + dark twin) | **LAST in phase.** Desaturate: light accent `#236F86`/hover `#175260`/soft; dark `#62C4D8`/`#7FD0E0`/soft. PLUS judge's two: fix `global.css:237` `#085E74` (must stay darker than resting) and audit light-link `--ds-accent-hover` routing (deliberate look change — verify in browser) | `feat: desaturate accents to ~60 pct, retire accent-hover workarounds` |

### Phase 3 — Surfaces & depth

| Task | Files | Change | Commit |
|---|---|---|---|
| SUR-2+SUR-1 | `src/styles/global.css` + card call sites (ProjectCard, Telemetry, updates) | `.fy-plate` class replacing 8× inline recipe; light shadow alpha .11/.15 warm; dark rim-light + `rgba(11,9,7,.55/.65)` shadows via `html ` override (vendored untouched). NOT `#fy-yard-card` | `feat: fy-plate card language — real elevation both themes` |
| SUR-7 | `src/styles/global.css`, Telemetry/WeeklyHeatmap/WorksCity/updates (non-harness only) | `.fy-well` recessed species for data/figures; coordinate with LAY-4 | `feat: fy-well recessed species for data panels` |
| SUR-4 | `src/styles/global.css` | Body grain: inline SVG turbulence data-URI per theme, NO `background-attachment:fixed`; suppress over harness-fs overlay | `feat: paper-tooth grain on body background` |
| SUR-5 | decision-gated | Only if gutter empty after LAY-9 — orchestrator decides in Phase 5 verify | — |

### Phase 4 — Hero scene `[opus]` (one coordinated diff)

| Task | Files | Change | Commit |
|---|---|---|---|
| BRA-7+SUR-6+MOT-5 | `src/lib/three/scene.ts` | Light-theme art direction (normal-blending ember-tinted halo/ember path; ring `0x8C8272`), `coreEmissiveScale` dark 1 / light 0.60, pointer-proximity heat (+22%/+30% caps, fine-pointer, damped). One diff. Acceptance: no light-hero pixel > (250,246,238) at 1440; 390 scrim floor untouched; do not touch :138-141 | `feat: art-direct light hero, core facets, pointer-proximity heat` |

### Phase 5 — Layout

| Task | Files | Change | Commit |
|---|---|---|---|
| LAY-4 | `src/components/Telemetry.astro:187-255`, `Heatmap.astro:21` | 12-col re-cut, model-mix full width; with SUR-7 classes | `refactor: telemetry grid 12-col, model-mix full width` |
| LAY-3 | `Telemetry.astro:134`, `global.css` | `.fy-yard-bleed` ≥1240px (after LAY-2) | `feat: forge-yard full-bleed moment on wide screens` |
| LAY-7 | `Telemetry.astro:97`, `WorkSection.astro:10`, `HarnessPromo.astro:9` | Rebalance section gaps per JSON measurements | `fix: section gap hierarchy follows subject changes` |
| LAY-9 | Expertise/WorkSection/Telemetry/About + `global.css` | `fy-sheet-num` margin ordinals ≥1360px (drop the nonexistent `::before` line) | `feat: section ordinals as sheet marginalia` |
| LAY-5 | `Expertise.astro:12` + `global.css` | Stepped bench — use milder 0/20/40px | `feat: step the expertise bench` |
| LAY-6 | `WorkGroup.astro`, `WorkSection.astro:21` | `lead` prop, Apps lead card | `feat: lead card for the Apps work group` |
| LAY-8 | `Hero.astro:92` | Padding → `clamp(84px, 13vh, 150px) … clamp(64px, 10vh, 130px)`; column stays 680px | `fix: hero padding scales with viewport` |

### Phase 6 — Type

| Task | Files | Change | Commit |
|---|---|---|---|
| TYP-2 | `global.css` (scope `#fy-callout-a`) | Hero H1 ceiling 76px, steeper clamp | `feat: hero headline reaches 76px, stops idling at floor` |
| TYP-8 | `global.css` (scope `#fy-callout-c`) | ≤666px: lead 17px | `fix: restore display-to-lead ratio at phone widths` |
| TYP-4 | `Telemetry.astro:160-165` | Legend spans get `.fy-mono-cased` (keep mono + text-2) | `fix: yard legend drops all-caps, keeps mono` |
| TYP-6 | `updates.astro:87` | 72ch → 58ch + `text-wrap:pretty` | `fix: updates summary measure to 58ch` |
| TYP-7 | `global.css` + `Telemetry.astro` stats, `updates.astro:92-100` | `.fy-stat` numeral role: tabular-nums, zero tracking | `feat: fy-stat numeral role off display classes` |
| TYP-9 | `updates.astro:87` first-week branch + `global.css` | Serif standfirst for newest week | `feat: serif standfirst anchors the newest week` |
| TYP-10 | `src/pages/404.astro` | System type scale | `refactor: 404 joins the system type scale` |

### Phase 7 — Motion

| Task | Files | Change | Commit |
|---|---|---|---|
| MOT-8 | `updates.astro` | initReveals script + 2 `data-reveal` sites | `fix: updates page gets entrance reveals` |
| MOT-2 | `global.css` | Scroll-driven `.ds-rule::before` strike inside `@supports (animation-timeline: view())`; scaleX(0) only inside | `feat: scroll-driven strike for the rule accent tab` |
| MOT-3 | `src/lib/tilt.ts:22` | Fast linear transform transition in rAF write | `fix: card tilt responds fast, releases heavy` |
| MOT-6 | `global.css` after :424 | Reduced-motion: nav slide/burger/harness-fs | `fix: reduced-motion covers nav, burger, fullscreen zoom` |
| MOT-7 | `global.css` | `html .ds-btn` transition unified 120ms | `fix: unify ds-btn hover transition timing` |
| MOT-4 | `global.css` | `@view-transition` + nav hold. Orchestrator verifies sun-pop cost in browser before keeping | `feat: cross-document view transitions` |

### Phase 8 — Brand assets

| Task | Files | Change | Commit |
|---|---|---|---|
| BRA-4 | `public/favicon.svg`, `favicon-32.png`, `favicon-180.png`, `BaseLayout.astro` | Favicons → ember disc-in-ring (match og-image mark); per-page og support (prop + per-page cards if assets feasible — else title/desc per page, note in PR) | `feat: unify brand mark across favicon and og` |
| BRA-6+LAY-10+TYP-10 seq | `src/pages/404.astro` (+ works-svg reuse) | Left-anchor page; cold-forge building, single ember coal 0.35 | `feat: the cold forge on 404` |

### Finalization

Full build+test, whole-site screenshot matrix both themes 1440/390, reviewer pass on diff, push, PR #25 body update (scope grows: design pass + palette program; deferred list), branch-end interactive HTML checklist update, session log, dev server confirmed running.
