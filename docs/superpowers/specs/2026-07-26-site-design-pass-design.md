# Site design pass — audit-driven refinements (2026-07-26)

**Status:** approved for implementation (autonomous session; user directive: full-site design review against the installed design skills, every change adversarially verified before implementation).

## How this spec was produced

- **Routing:** `design-router` classified the request as "redesign existing"; the stack gate fails for Foundry (React without Tailwind — named in the router as the canonical failing case), so the governing rulebook is **`redesign-existing-projects`**, loaded as the single design rulebook for the session (exclusion-set rule).
- **Process:** `superpowers:brainstorming` → 33-agent audit Workflow: 6 dimension finders (typography, color/contrast, layout, interactivity/motion, components/code, perceptual screenshot critique) → 1 adversarial verifier per finding (instructed to refute; re-read anchors, recomputed WCAG math, measured computed styles in-browser against the dev server and the production bundle) → 1 coherence critic.
- **Result:** 39 raw findings → 26 verified → **22 confirmed/revised, 4 refuted**, 13 low-ranked capped as follow-ups. Full structured result with per-finding verdict reasoning: `.scratch/design-pass/audit-result.json` (session artifact, gitignored).
- Baseline screenshots (4 pages × 2 themes × 2 widths, scroll-reveal forced): `.scratch/design-pass/baseline/`.

## Scope decision

Three approaches considered:

- **A (chosen): implement all 22 confirmed changes**, merged where the critic found overlaps, ordered by the rulebook's fix priority (contrast/states → layout → typography → components). Grounded, bounded, every item survived adversarial review.
- B: high-impact only — rejected; the mediums are small, verified, and cheap on the same branch.
- C: include the 13 capped findings — rejected; they were never adversarially verified, and the session mandate is verified-only.

## Locked decisions honored (none violated — critic-checked)

Fonts, token files (`foundation.css`/`brands.css` values), dark-as-default, brand-scoped accents, zero new dependencies, verbatim-spec keyframes, project blurb meaning, existing WCAG-fix comments, inline `--ds-*` style convention. The held `feat/harness-page-v2` branch supersedes `src/components/harness/*` and `harness-svg*.ts` — all fixes touching those files are **deferred to that branch** (listed in each finding); sitewide CSS that also improves /harness is in scope.

## Critic conflict resolutions (decisions)

1. **Focus-ring duplicate** (`color-contrast/focus-ring-erased-on-buttons` × `interactivity-motion/ds-btn-focus-ring-invisible`): one change, applied once.
2. **Text-token direction** (three overlapping findings): final coherent rule — **informative text on cards (`--ds-surface`/`-2`/composites) → `--ds-text-2`; informative text on page background → `--ds-text-3`; `--ds-text-faint` is decorative-only.** This follows from `text3-on-surface-below-aa` landing (dark text-3 on surface = 4.26:1 < AA); the "one rule, text-3 everywhere" variant would re-fail AA on cards.
3. **Hero mechanism** (`hero-3d-collides` × `hero-3d-washout`): merged — `data-scene-layout` attribute written by `scene.ts sizeIt()` keys the scrim variant (no media query, mirrors the scene's own 1.05 aspect switch, inert when the scene never mounts) **plus** the `haloFit` portrait halo treatment (root cause of the dark-theme bloom; separate multiplier so `applyTheme()` can't clobber it). The washout finding's `@media 600px` scrim arm is dropped as superseded; scrim plateau strength tuned at acceptance against measured AA (h1 ≥3:1, lead ≥4.5:1 at 390/430, both themes) while keeping the art visible outside the text band.
4. **Nav breakpoint** 600→900 lands **before** the hero work; nothing else may cite the 600px query (the merged hero fix uses the attribute, so the stale-citation hazard is gone).
5. **`Telemetry.astro:137`**: single final state — `color:var(--ds-text-2);line-height:1.8` (color from the token rule; leading from the micro-label finding; the three-span split that also targeted this line was refuted and does not happen).

## Changes (18 implementation units)

Phase 1 — contrast & focus (rulebook priority: color cleanup, states):
| # | Change | Files | Finding(s) |
|---|---|---|---|
| C1 | Restore 2px accent focus ring on `.ds-btn`/`.ds-btn-quiet` (`html` prefix beats vendored `outline:none` on specificity; ring 1.12:1 → 3.29/9.85:1) | global.css | focus-ring-erased + ds-btn-focus-ring (merged) |
| C2 | Light-only `--ds-accent-hover: #0A6E88` on `.brand-skills` (4.44:1 → 5.10:1; fixes callout 3.97 and accent-chip 4.28 composites) | global.css | accent-hover-text-under-aa-light |
| C3 | On-card `--ds-text-3` → `--ds-text-2`: guarded `.ds-chip:not(.ds-chip--accent)` rule (placed before `.fy-link-t2`), enumerated inline swaps (ProjectCard, Telemetry, updates), one added color on bare `.ds-caption`, harness-fs controls (global.css only) | global.css, ProjectCard, Telemetry, updates | text3-on-surface-below-aa |
| C4 | Informative `--ds-text-faint` → text-3 on bg (Hero:140, 404:46) / text-2 on cards (Telemetry 137/166/174/181/213/219/228/274, WeeklyHeatmap 24/47, updates 83/125, ProjectLinks:41); decorative faint untouched | components | text-faint-informative + faint-microcopy (merged per rule 2) |
| C5 | `MODEL_MIX_COLORS[5]` → `var(--ds-text-3)` + comment updated to note deliberate 2A divergence + pinned test updated | telemetry.ts, telemetry.test.ts | model-mix-sixth-series |

Phase 2 — hero & nav responsive:
| C6 | Nav collapse breakpoint 600→900 (only 600px query in codebase) | global.css | nav-collapses-only-at-600px |
| C7 | Hero narrow layout: `.fy-hero-scrim` class + `#top[data-scene-layout='narrow']` variant; `sizeIt()` writes `data-scene-layout` both branches, `dispose()` clears; `haloFit` multiplier in frame loop | Hero.astro, global.css, scene.ts | hero-3d-collides + hero-3d-washout (merged) |

Phase 3 — interaction states & hidden-UI a11y:
| C8 | `#fy-anvil:focus-visible` ring (`!important` beats inline `all:unset`); drawings overlay: `visibility` added to `.fy-dwg-piece` show/hide + `inert` toggle on title block | global.css, Hero.astro, Footer | all-unset-buttons + drawings-title-block (merged) |
| C9 | `aria-current="page"` on Updates/Harness nav links + current-page marker (`--ds-text`, not accent — accent would re-fail AA) | Nav.astro, global.css | nav-no-current-page |
| C10 | Hover/focus step on segmented toggles (`.fy-view-btn`, `.harness-fs-tab`) one step below selected state | updates.astro, global.css | segmented-toggles-no-hover |

Phase 4 — typography & components:
| C11 | `Telemetry.astro:137` `line-height:1.8` (matches Expertise precedent) — combined with C4's color swap | Telemetry | micro-label-for-wrapping-prose |
| C12 | Works-city labeled fullscreen trigger ≤640px ("Fullscreen — easier to read", static positioning to clear north-arrow collision) | WorksCity.astro | works-city-mobile-annotations (part 2 only; part 1 refuted) |
| C13 | `Telemetry.astro:174` caption `max-width:72ch;text-wrap:pretty` (file's own precedent) | Telemetry | prose-measure-outliers |
| C14 | Google Fonts URL: add Inter italic axis `ital,wght@0,400;…;1,400` (real `<em>` runs render synthesized oblique today — verified via font-CSS parse) | BaseLayout | inter-italic-face-not-requested |
| C15 | `box-sizing:border-box` on nav container (aligns header edges with section edges at 1200px) | Nav.astro | nav-container-not-border-box |
| C16 | Thread week identity into repeated accessible names (`label` prop on WorksCity button/dialog; updates passes `formatWeekRange(...)`) | WorksCity, updates | updates-repeated-controls-names |
| C17 | 404 becomes a real destination: drop meta-refresh, add SkipLink/Nav/Footer, fixed-nav padding math, copy in site lexicon ("Nothing was forged at this address."), amend handoff deploy note | 404.astro, docs/design/handoff/README.md | 404-unreachable-no-nav |
| C18 | robots.txt: drop stale TODO + point Sitemap at custom domain (impact re-rated low by verifier: old URL 301s today) | public/robots.txt | robots-sitemap-dead-url |

## Explicitly out of scope

- **Refuted (4):** vh→dvh sweep (verifier: no observable defect on these fixed-height boxes), Expertise tech-line alignment (measured aligned), pressed-feedback sweep (evidence misquoted), reveal stagger (reveal.ts is a verbatim port of the designer's own motion spec).
- **Capped, unverified (13):** listed in audit-result.json `unverified` — candidates for a future pass, not this branch.
- **Deferred to `feat/harness-page-v2`:** all `src/components/harness/*` + `RoutingCard.tsx` text-token and italic fixes (enumerated per finding).
- **Follow-up finding to file:** `works-svg.ts` `inkFaint` sub-8px figure text needs a decorative/text ink split before any swap (both faint verifiers + critic agree).

## Verification protocol (every change)

1. `npm run build` green, `npm test` green after each atomic commit.
2. **In-browser computed-style measurement, not cascade reasoning** (repo memory: this caught two false fixes) — each contrast change asserts computed ratios via evaluate-script; focus changes assert `outlineStyle`.
3. After-screenshot matrix = baseline matrix **plus** `updates-390-dark` and `harness-390-dark` (critic: missing baselines — captured before implementation for a valid before/after).
4. Hero acceptance at 390/430 both themes with frame-frozen rendering; poster/no-WebGL fallback contrast also sampled (critic gap).
5. Critic gap closures verified once: theme boot is pre-paint inline (`BaseLayout.astro:43` — no flash; verified by reading, closed), reduced-motion coverage grep for `tilt.ts`/eggs JS paths.
6. Production-bundle check for order-dependent CSS (`astro build` + preview), per C1's verifier.
