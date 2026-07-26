# Site Design Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the 18 adversarially-verified design changes from `docs/superpowers/specs/2026-07-26-site-design-pass-design.md`.

**Architecture:** All changes are site-side CSS (`src/styles/global.css`) or component-local edits; vendored token files are never touched. Contrast/focus first, then hero/nav responsive, then interaction states, then typography/components. One atomic conventional commit per task.

**Tech Stack:** Astro 7 static, vanilla CSS with `--ds-*` tokens, Three.js hero, Vitest.

## Global Constraints

- **Default executor tier: Sonnet, medium effort** (plan-time routing per AGENTS.md). Tasks tagged `[verify-heavy]` run in the orchestrator session (browser MCP needed).
- Never edit `src/styles/tokens/foundation.css`, `tokens/brands.css`, `tokens/components.css`.
- Never edit `src/components/harness/*`, `src/lib/harness-svg*.ts`, or `RoutingCard.tsx` (held `feat/harness-page-v2` branch supersedes them).
- Keep inline `style="…"` + token `var()` convention; never extract classes from inline styles; never hardcode a hex where a token var exists (the `.fy-yard-night` egg re-scopes tokens — hexes break it).
- After each task: `npm run build` then `npm test` must pass before commit (build first — instinct rule).
- Full verifier reasoning per finding: `.scratch/design-pass/audit-result.json` (`confirmed[]`, match by finding id). Read it if any edit below seems ambiguous — the verifier text is authoritative over this summary.
- Commit messages end with the two footers used by this session (Co-Authored-By Claude Fable 5 + Claude-Session URL — see git log for exact format).
- Dev server already running at `http://127.0.0.1:4321` (astro dev daemon, pid in `astro dev status`).

---

### Task C1: Focus ring on .ds-btn / .ds-btn-quiet

**Files:** Modify: `src/styles/global.css` (append after the `html[data-theme="light"] .ds-btn:hover` block, ~line 146)
**Finding ids:** `color-contrast/focus-ring-erased-on-buttons`, `interactivity-motion/ds-btn-focus-ring-invisible` (apply ONCE)

- [ ] **Step 1: Add the rule** (comment included; do not re-declare box-shadow):

```css
/* Restore the site focus ring on buttons. components.css:33/55 set
   `outline: none` and lean on a 10%-alpha `--ds-accent-soft` box-shadow,
   which composites to ~1.12:1 light / ~1.21:1 dark against --ds-bg — far
   under the 3:1 a focus indicator needs (WCAG 1.4.11), and these are the
   first two tab stops on the homepage. Re-applies the same 2px accent ring
   global.css:35 already gives every other focusable element. The `html `
   prefix is load-bearing: it lifts these to (0,2,1) so they beat
   components.css's (0,2,0) on specificity rather than on import order —
   components.css is vendored and an injection-order change would otherwise
   silently revert this. The soft glow is NOT re-declared: components.css
   already sets it on these exact selectors; it fills the 3px offset. */
html .ds-btn:focus-visible,
html .ds-btn-quiet:focus-visible {
  outline: 2px solid var(--ds-accent);
  outline-offset: 3px;
}
```

- [ ] **Step 2:** `npm run build && npm test` — both green.
- [ ] **Step 3 [verify-heavy]:** On `/`, focus each hero CTA; assert `getComputedStyle(el).outlineStyle === 'solid'` for `.ds-btn` and `.ds-btn-quiet`; control `a.fy-link-t2` still `solid`.
- [ ] **Step 4: Commit** `fix(a11y): restore visible focus ring on .ds-btn/.ds-btn-quiet`

### Task C2: Light-theme accent-hover one step darker

**Files:** Modify: `src/styles/global.css` (immediately after C1's block)
**Finding id:** `color-contrast/accent-hover-text-under-aa-light`

- [ ] **Step 1: Add** (full comment from the verifier — see audit-result.json — must be carried; abbreviated here):

```css
/* Light-theme accent-text contrast, second pass. --ds-accent-hover #0B7894
   on --ds-bg #F4EFE6 measures 4.44:1 — 0.06 short of AA for the 11-13px
   mono text it carries; worse over accent-tinted composites (.ds-callout
   3.97:1, .ds-chip--accent 4.28:1). Darkening the variable one step reaches
   the ~20 inline var(--ds-accent-hover) consumers no class rule can touch.
   #0A6E88: 5.10:1 on --ds-bg, 5.50:1 on --ds-surface, 4.55:1 on the callout
   composite. Light only — dark's accent-hover is the deliberately brighter
   half (9.98-10.90:1). Off-palette by one step, same as #085E74 above. */
html[data-theme="light"] .brand-skills {
  --ds-accent-hover: #0A6E88;
}
```

- [ ] **Step 2:** build + test green.
- [ ] **Step 3 [verify-heavy]:** Light theme: computed color of hero `.ds-kicker`, "In the forge" callout kicker, `.ds-btn-quiet` = `rgb(10,110,136)`; `.ds-btn` resting fill uses the same var (now #0A6E88) — hover step to `#085E74` must remain visibly darker.
- [ ] **Step 4: Commit** `fix(a11y): darken light-theme accent-hover text one step to clear AA`

### Task C3: On-card text-3 → text-2

**Files:** Modify: `src/styles/global.css`, `src/components/ProjectCard.astro`, `src/components/Telemetry.astro`, `src/pages/updates.astro`
**Finding id:** `color-contrast/text3-on-surface-below-aa` (read its full proposal — enumerated, with guards)

- [ ] **Step 1: Chip rule** — insert IMMEDIATELY BEFORE `.fy-link-t2` (global.css ~line 59), with the verifier's comment:

```css
.ds-chip:not(.ds-chip--accent) { color: var(--ds-text-2); }
```

(`:not()` guard + placement are load-bearing: bare `.ds-chip` would flatten accent chips; placed before `.fy-link-t2` so updates' `class="ds-chip fy-link-t2"` hover still wins on source order.)

- [ ] **Step 2: Inline swaps** `color:var(--ds-text-3)` → `color:var(--ds-text-2)` at: ProjectCard.astro:58, :78 · Telemetry.astro:142, :150–:155, :157, :168, :192, :196, :200, :251 · updates.astro:112, :147, :152, and `.fy-view-btn` rule at :185.
- [ ] **Step 3: Bare caption** Telemetry.astro:205 (`Peak: …`): add `style="color:var(--ds-text-2)"`.
- [ ] **Step 4: Harness-fs controls** (global.css only — NOT harness markup): `.harness-fs-trigger` (:323), `.harness-fs-tab` (:366), `#harness-fs-zoom-level` (:443): `--ds-text-3` → `--ds-text-2`.
- [ ] **Step 5:** build + test green. **Do NOT touch** Telemetry :112/:117/:122/:127/:273/:286 or updates:71 (verified passing on bg/surface-2).
- [ ] **Step 6 [verify-heavy]:** dark theme: sample a project-card tech line & works legend row — computed `rgb(197,187,161)`; HarnessArsenal accent chips still accent-colored; updates chip hover still turns accent.
- [ ] **Step 7: Commit** `fix(a11y): route on-card text-3 labels to text-2 (dark 4.26:1 → 8.48:1)`

### Task C4: Informative text-faint → text-3 (bg) / text-2 (cards)

**Files:** Modify: `src/components/Hero.astro:140`, `src/pages/404.astro:46`, `src/components/Telemetry.astro` (:137, :166, :174, :181, :213, :219, :228, :274), `src/components/WeeklyHeatmap.astro` (:24, :47), `src/pages/updates.astro` (:83, :125), `src/components/ProjectLinks.astro:41`
**Finding ids:** `color-contrast/text-faint-used-for-informative-copy` + `visual-critique/faint-token-microcopy-unreadable` (merged; spec conflict-resolution #2)

- [ ] **Step 1: On-bg swaps → `var(--ds-text-3)`:** Hero.astro:140 ("drawings on file…"), 404.astro:46 (`.fy-404-lead` in style block).
- [ ] **Step 2: On-card swaps → `var(--ds-text-2)`:** all Telemetry anchors above (NOTE :137 also gets C11's `line-height:1.8` — apply both here if C11 not yet run, then skip C11's edit), WeeklyHeatmap :24/:47, updates :83/:125, ProjectLinks:41. Telemetry:274 sits on `--ds-surface-2` — still text-2 (9.79/9.70).
- [ ] **Step 3: Leave decorative faint:** Hero:150/159 dots, Expertise index numerals, ProjectCard badges, WorkGroup:30 count, telemetry.ts:104 (C5 owns it), works-svg.ts everywhere.
- [ ] **Step 4:** build + test green.
- [ ] **Step 5 [verify-heavy]:** 404 lead + hero micro line computed `rgb(115,106,89)` light; Telemetry card lines `rgb(197,187,161)` dark; egg night-yard (hold the yard pill 1.1s) still renders its scoped palette.
- [ ] **Step 6: Commit** `fix(a11y): retire text-faint from informative copy (1.92:1 → AA)`

### Task C5: Model-mix sixth series perceivable

**Files:** Modify: `src/lib/telemetry.ts` (:104 value, :96-97 comment), `tests/unit/telemetry.test.ts` (:165-174 pinned colors)
**Finding id:** `color-contrast/model-mix-sixth-series-invisible`

- [ ] **Step 1:** Update the pinned expectation in `tests/unit/telemetry.test.ts` to `'var(--ds-text-3)'` for index 5. Run `npm test` — expect FAIL (value not yet changed).
- [ ] **Step 2:** `MODEL_MIX_COLORS[5]` → `'var(--ds-text-3)'`; rewrite the :96-97 comment: list mirrors the 2A source's six segments **except** the sixth, deliberately diverged from `--ds-text-faint` (imperceptible at 1.2:1 on-card) to `--ds-text-3` (5.03/4.26 ≥ 3:1 non-text) — neutral tail intent preserved.
- [ ] **Step 3:** `npm run build && npm test` — green.
- [ ] **Step 4: Commit** `fix(a11y): make model-mix sixth series visible (text-3, was text-faint)`

### Task C6: Nav collapse breakpoint 600 → 900

**Files:** Modify: `src/styles/global.css:77`
**Finding id:** `layout/nav-collapses-only-at-600px`

- [ ] **Step 1:** `@media (max-width: 600px)` → `@media (max-width: 900px)` (only 600px query in codebase — `grep -rn "600px" src/` must return just this line before editing).
- [ ] **Step 2:** build + test green.
- [ ] **Step 3 [verify-heavy]:** at 768/850/899 the burger shows and the dropdown opens; at 901+ the full row shows; every nav item ≤26px tall (no wrap) at 901-960.
- [ ] **Step 4: Commit** `fix(nav): collapse to burger below 900px (row wraps/clips 600-900)`

### Task C7: Hero narrow-layout scrim + halo fit

**Files:** Modify: `src/components/Hero.astro:60`, `src/styles/global.css`, `src/lib/three/scene.ts` (`sizeIt()`, frame loop, `dispose()`)
**Finding ids:** `layout/hero-3d-collides-with-headline-in-portrait` + `visual-critique/hero-3d-washout-mobile` (merged; spec conflict-resolution #3 — read BOTH full proposals in audit-result.json before starting)

- [ ] **Step 1: Hero.astro:60** — move ONLY `background` out of the inline style into new class `fy-hero-scrim`; keep `position/inset/z-index/pointer-events` inline.
- [ ] **Step 2: global.css** — add `.fy-hero-scrim` (desktop 3-layer background, byte-identical to current inline value) and `#top[data-scene-layout='narrow'] .fy-hero-scrim` (vertical band variant: plateau `18% 70%` at 90% `--ds-bg` mix; layers 2-3 identical to desktop). Carry the verifier's measured-contrast comment (1.39:1 lead unpatched; 90% plateau = floor; do not weaken without re-probing).
- [ ] **Step 3: scene.ts `sizeIt()`** — alongside the existing `wide` ternary: `hero.dataset.sceneLayout = wide ? 'wide' : 'narrow';` (unconditional both branches). In `dispose()`: `delete hero.dataset.sceneLayout;`. Add `let haloFit = 1;` set in `sizeIt()` (`wide ? 1 : ~0.55` — tune at Step 5), applied in the frame loop: `halo1.material.opacity = haloBase1 * pulse * heat * haloFit;` `halo2.material.opacity = haloBase2 * heat * haloFit;` plus a portrait scale reduction on both halo sprites. Do NOT mutate `haloBase1/2` (applyTheme clobbers them).
- [ ] **Step 4:** build + test green.
- [ ] **Step 5 [verify-heavy] Acceptance (frame-frozen):** at 390 and 430, both themes: sample under h1 (≥3:1) and lead (≥4.5:1); art visible outside the text band; rotate to landscape clears `narrow`; theme toggle in portrait keeps haloFit (clobber check); reduced-motion/no-WebGL poster path unchanged (scrim keeps full desktop art form). Tune haloFit/scale until pass.
- [ ] **Step 6: Commit** `fix(hero): portrait scrim + halo fit — AA text over the 3D scene on mobile`

### Task C8: Hidden-UI a11y (anvil ring, drawings overlay)

**Files:** Modify: `src/styles/global.css` (beside :35), `src/components/Hero.astro` (`<style>` + `applyOpen`)
**Finding ids:** `interactivity-motion/all-unset-buttons-no-focus-ring` + `components-code/hero-drawings-title-block-focusable-while-invisible` (merged)

- [ ] **Step 1: global.css** (comment from verifier: inline `all:unset` outranks stylesheet; only `!important` beats it; no outline-offset — 44px hit area already overlaps copy):

```css
#fy-anvil:focus-visible {
  outline: 2px solid var(--ds-accent) !important;
}
```

- [ ] **Step 2: Hero.astro `<style>`** — `.fy-dwg-piece`: add `visibility: hidden;` and add `visibility` to the transition list; `#top.fy-dwg-open .fy-dwg-piece`: add `visibility: visible;` (mirrors global.css:81-108 mobile-nav pattern).
- [ ] **Step 3: Hero.astro script** — in `applyOpen`: `const titleBlock = document.getElementById('fy-dwg-title-block');` then `titleBlock?.toggleAttribute('inert', !open);` (kills the phantom tab stop when closed).
- [ ] **Step 4:** build + test green.
- [ ] **Step 5 [verify-heavy]:** Tab through closed page — `#fy-dwg-close` unreachable; type "plans" — overlay opens, close button reachable, focus ring on anvil visible.
- [ ] **Step 6: Commit** `fix(a11y): anvil focus ring; drawings overlay out of tab order when closed`

### Task C9: Nav current-page marker

**Files:** Modify: `src/components/Nav.astro` (frontmatter + Updates/Harness anchors), `src/styles/global.css` (after :68, NOT inside the media block)
**Finding id:** `interactivity-motion/nav-no-current-page` (read full proposal — the CSS comment explains why `--ds-text`, not accent)

- [ ] **Step 1: Frontmatter:**

```ts
const base = import.meta.env.BASE_URL;
const here = Astro.url.pathname;
const isUpdates = here.startsWith(`${base}updates`);
const isHarness = here.startsWith(`${base}harness`);
```

- [ ] **Step 2:** `aria-current={isUpdates ? 'page' : undefined}` on the Updates anchor; same with `isHarness` for Harness. No other attribute changes.
- [ ] **Step 3: global.css** — current-page rule per verifier (color `var(--ds-text)`, weight 600 marker; full block in audit-result.json), placed after line 68.
- [ ] **Step 4:** build + test green.
- [ ] **Step 5 [verify-heavy]:** on /updates/ the Updates link computed color = `--ds-text` and `[aria-current="page"]` present; on / neither is marked; mobile dropdown at 390 also shows the marker.
- [ ] **Step 6: Commit** `feat(nav): mark current page on Updates/Harness links`

### Task C10: Segmented-toggle hover states

**Files:** Modify: `src/pages/updates.astro` (scoped style, after :191), `src/styles/global.css` (after :373)
**Finding id:** `interactivity-motion/segmented-toggles-no-hover`

- [ ] **Step 1: updates.astro:**

```css
.fy-view-btn:not([aria-pressed='true']):hover,
.fy-view-btn:not([aria-pressed='true']):focus-visible {
  color: var(--ds-text-2);
  border-color: var(--ds-line-strong);
}
```

- [ ] **Step 2: global.css** (color only — border already `--ds-line-strong`):

```css
.harness-fs-tab:not([aria-current='true']):hover,
.harness-fs-tab:not([aria-current='true']):focus-visible {
  color: var(--ds-text-2);
}
```

- [ ] **Step 3:** build + test green. No transition added to `.harness-fs-tab` (siblings hover instantly — consistency).
- [ ] **Step 4: Commit** `feat(ui): hover/focus step on WORKS/GRID and fullscreen tabs`

### Task C11: Yard-meta leading

**Files:** Modify: `src/components/Telemetry.astro:137`
**Finding id:** `typography/micro-label-utility-used-for-wrapping-prose`

- [ ] **Step 1:** If C4 already ran, the line has `color:var(--ds-text-2)` — append `;line-height:1.8` to that same style attr. Final: `style="color:var(--ds-text-2);line-height:1.8"`. (1.8 matches Expertise.astro:20/29/37 precedent — do not invent another value.) Legend spans :150-155 stay untouched.
- [ ] **Step 2:** build + test green. **Step 3: Commit** `fix(type): breathing room for wrapped yard-meta line (lh 1.8, Expertise precedent)`

### Task C12: Works-city labeled fullscreen trigger ≤640px

**Files:** Modify: `src/components/WorksCity.astro` (button :33-36 + scoped style)
**Finding id:** `visual-critique/works-city-mobile-annotations-illegible` (part 2 only — part 1 was refuted; read full proposal)

- [ ] **Step 1:** after the icon svg inside `.fyw-expand-btn`: `<span class="fyw-expand-label">Fullscreen — easier to read</span>`; scoped style:

```css
.fyw-expand-label { display: none; }
@media (max-width: 640px) {
  .fyw-expand-btn { position: static; width: auto; height: auto; gap: 6px; padding: 6px 10px; margin: 0 0 10px auto; border-radius: var(--ds-radius-pill); }
  .fyw-expand-label { font: 500 11px/1 var(--ds-font-mono); letter-spacing: 0.08em; display: inline; }
}
```

(`position:static` is load-bearing — the absolute button collides with the yard's north arrow; check the remaining tail of the verifier proposal for the strip-variant note before finishing.)

- [ ] **Step 2:** build + test green. **Step 3 [verify-heavy]:** 390: labeled pill button above each city, no overlap; 1440: unchanged icon button. **Step 4: Commit** `feat(mobile): labeled fullscreen trigger on works-city figures`

### Task C13: Works caption measure

**Files:** Modify: `src/components/Telemetry.astro:174`
**Finding id:** `typography/prose-measure-outliers`

- [ ] **Step 1:** append `;max-width:72ch;text-wrap:pretty` to the style attr (color already text-2 via C4). 72ch = file's own precedent (:286). Do NOT touch updates:87 or Telemetry:286.
- [ ] **Step 2:** build + test green. **Step 3: Commit** `fix(type): cap data-driven works caption at 72ch`

### Task C14: Inter italic axis

**Files:** Modify: `src/layouts/BaseLayout.astro:67`
**Finding id:** `typography/inter-italic-face-not-requested`

- [ ] **Step 1:** Inter segment → `Inter:ital,wght@0,400;0,500;0,600;0,700;1,400`. Other families + `display=swap` + preconnects unchanged.
- [ ] **Step 2:** build + test green. **Step 3: Commit** `fix(type): request Inter italic face — real <em> runs, no synthesized oblique`

### Task C15: Nav container border-box

**Files:** Modify: `src/components/Nav.astro:25`
**Finding id:** `layout/nav-container-not-border-box`

- [ ] **Step 1:** add `box-sizing:border-box;` to the inline style (matches Footer.astro:22 and every section container).
- [ ] **Step 2:** build + test green. **Step 3 [verify-heavy]:** at ≥1312px, header container width = 1200 and logo left edge aligns with section headers. **Step 4: Commit** `fix(nav): border-box container — header edges align with content grid`

### Task C16: Week identity in repeated accessible names

**Files:** Modify: `src/components/WorksCity.astro` (Props + :33 + :39), `src/pages/updates.astro:119-124`
**Finding id:** `components-code/updates-repeated-controls-share-identical-accessible-names` (read full proposal for the Props-union note)

- [ ] **Step 1: WorksCity Props** — intersect the discriminated union with `{ label?: string }` (optional + fallback; Astro won't typecheck at build).
- [ ] **Step 2:** button :33: `aria-label={props.label ? \`View ${props.label} fullscreen\` : 'View fullscreen'}`; dialog :39: `aria-label={props.label ? \`${result.ariaLabel} — ${props.label}\` : result.ariaLabel}` (suffix, never replace). "Close fullscreen" stays.
- [ ] **Step 3: updates.astro** — pass `label={formatWeekRange(week.week_start, week.week_end)}`. Telemetry.astro:140 (yard) passes nothing.
- [ ] **Step 4:** build + test green. **Step 5: Commit** `fix(a11y): unique accessible names for per-week fullscreen controls`

### Task C17: 404 becomes a real destination

**Files:** Modify: `src/pages/404.astro`, `docs/design/handoff/README.md:138`
**Finding id:** `components-code/404-branded-page-is-unreachable-and-has-no-nav` (read full proposal — item 5 tail included there)

- [ ] **Step 1:** delete the meta-refresh (line 9); update header comment (no longer a redirect).
- [ ] **Step 2:** add `<SkipLink href="#not-found" label="Skip to the message" />`, `<Nav />`, `<Footer />`; `<main id="not-found" class="brand-skills fy-404">`.
- [ ] **Step 3:** `.fy-404 { min-height: calc(100vh - 64px); box-sizing: border-box; padding: calc(64px + 2rem) 2rem 2rem; }` (fixed 64px nav clearance).
- [ ] **Step 4:** lead copy → `Nothing was forged at this address.` (site lexicon); keep homepage link. `.fy-404-lead` color: `var(--ds-text-3)` (C4). Amend handoff deploy note per proposal.
- [ ] **Step 5:** build + test green. **Step 6 [verify-heavy]:** `astro preview` `/404` renders nav + footer, no redirect; theme toggle works. **Step 7: Commit** `feat(404): real branded destination — nav, footer, no instant redirect`

### Task C18: robots.txt custom-domain sitemap

**Files:** Modify: `public/robots.txt` (entire 6-line file)
**Finding id:** `components-code/robots-sitemap-points-at-dead-github-io-url` (verifier re-rated low; hygiene fix)

- [ ] **Step 1:** replace full contents:

```
User-agent: *
Allow: /
Sitemap: https://abhijitbansal.com/sitemap-index.xml
```

- [ ] **Step 2:** build green (sitemap integration unaffected). **Step 3: Commit** `chore(seo): point robots.txt sitemap at custom domain, drop stale TODO`

### Task V1 [verify-heavy]: Gap closures + full acceptance matrix

**Finding source:** audit critic `missing[]`

- [ ] **Step 1:** capture the two missing baselines first if not already: `updates-390-dark.png`, `harness-390-dark.png` (pre-implementation state is gone after C-tasks — capture from `git stash`-free main preview OR accept post-only for these two and note it).
- [ ] **Step 2:** reduced-motion grep: `tilt.ts`, `eggs.ts` night-shift/drawings paths — confirm each checks `prefers-reduced-motion` or is exempt; file follow-ups only, no edits.
- [ ] **Step 3:** after-matrix screenshots (4 pages × 2 themes × 2 widths + the two new dark-390 shots), side-by-side against baseline; hero acceptance numbers recorded.
- [ ] **Step 4:** `npx vitest run` + `npm run build` + `astro preview` smoke of all four routes.
- [ ] **Step 5: Commit** any checklist/doc artifacts produced.

## Self-review

Spec coverage: C1-C18 map 1:1 to the spec table; V1 covers the spec's verification protocol items 3-6. Type consistency: `data-scene-layout` values `'wide'|'narrow'` used identically in C7 CSS and scene.ts; `label?: string` prop name consistent across C16 steps. No placeholders: every step carries exact code or an explicit pointer to the authoritative verifier text in `.scratch/design-pass/audit-result.json` for tails too long to inline (C7, C9, C12, C16, C17 note this explicitly).
