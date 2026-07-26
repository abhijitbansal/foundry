# Foundry site — variant 2A (Crucible, light-first) implementation plan

> **For agentic workers:** this plan is executed **inline, in the orchestrating session**, not via subagent-driven-development — the site is one tightly-coupled page where pixel parity across sections/themes/breakpoints matters more than task isolation. Follow phases in order; each phase ends with a manual verification step (dev server + browser) before moving on, since most of this surface (DOM/CSS/3D/motion) is not meaningfully unit-testable. Checkbox syntax (`- [ ]`) tracks progress.

**Goal:** Ship a production Astro + vanilla Three.js static site that recreates variant 2A ("Crucible Light") pixel-for-pixel from its design source, light-first with dark support, deployable to GitHub Pages at abhijitbansal.com.

**Architecture:** Astro (zero-JS-by-default) for the static DOM/CSS shell; a hand-rolled ES module for the Three.js hero scene, lazy-loaded via dynamic `import()` after first paint / on hero intersection; a build-time data pipeline that bakes `data/stats.json` telemetry numbers and resolved project links into static markup — no client-side fetching anywhere.

**Tech Stack:** Astro (static output), TypeScript, vanilla `three` (pinned, self-hosted, code-split), vitest for the pure-logic unit tests, GitHub Actions → GitHub Pages.

**Source of truth for content/values:** `docs/design/handoff/README.md` (spec) and `docs/design/handoff/src/Foundry 2A - Crucible Light.dc.html` (the picked-variant reference implementation — copy, inline styles, and the full `_buildScene` Three.js code live here; treat every hex/spacing/timing value in it as exact). Design tokens: `docs/design/handoff/tokens/{foundation,brands,components}.css`.

## Global Constraints

- Light-first: `html[data-theme]` defaults to `light` on first visit; dark supported; no system-pref flash on load (inline head script reads `localStorage['fy-theme']` before paint — this is a hard requirement, not an optimization).
- Accent family = `.brand-skills` from `tokens/brands.css`: light `#0E8FB0`/`#0B7894`/secondary `#B07A18`/tertiary `#6D52C4`; dark (forced via `data-theme`, not just `prefers-color-scheme`) `#34D3EE`/`#5ADCF1`/secondary `#E8B94A`/tertiary `#A892F0` — must mirror brands.css's `@media(prefers-color-scheme:dark)` block into a `[data-theme="dark"] .brand-skills` rule, since brands.css alone doesn't react to a forced `data-theme` attribute.
- Copy is final and copied verbatim from the 2A source — never paraphrase.
- Initial JS ≤ 300KB gz before the Three.js chunk; three.js is its own lazy chunk, never in the entry bundle.
- DPR capped at 2 (1.25 under the fps-watchdog degrade path — keep this guard, it's not a prototype-only artifact).
- `prefers-reduced-motion` → skip 3D init entirely; CSS poster (ember gradients + `#fy-poster-rings` SVG) is the permanent fallback, also used for no-WebGL / load-failure.
- Drop prototype-only artifacts when porting the scene: `console.log` in `applyTheme`, the rAF watchdog `setInterval` fallback, `preserveDrawingBuffer: true`, and the `setInterval(check, 400)` reveal safety net (keep scroll+resize listener reveals and the IntersectionObserver hero-visibility pause).
- Zero third-party requests except Google Fonts (or self-host to hit true zero) — no analytics, no trackers.
- Hash-anchor navigation only (`#work`, `#telemetry`, …), no client routing.
- Test scope: pure-logic modules (telemetry number formatting, heatmap heat-bucket calc, project-link resolution, theme storage helpers) get vitest unit tests per testing.md's 80%-of-testable-logic bar. DOM layout, motion, and the 3D scene are **not** unit-testable in a meaningful way — verify those with the dev server in a real browser at 1440/1024/390 × {light, dark} before moving to the next phase, per user instruction to work design-first.

---

## File structure

```
astro.config.mjs
package.json
tsconfig.json
vitest.config.ts
public/
  robots.txt
  CNAME                          # abhijitbansal.com
  favicon.svg + favicon-*.png    # from ember-tab mark
  og-image.png                   # generated once, committed
src/
  layouts/BaseLayout.astro       # <head>, theme no-flash script, fonts, skip link mount point
  components/
    SkipLink.astro
    Nav.astro                    # header + theme toggle button
    Hero.astro                   # kicker/H1/lead/CTA/links + canvas mount + poster SVG + gradient overlay
    Expertise.astro
    WorkSection.astro            # renders WorkGroup × 3 + InForgeCallout, reads projects.ts
    WorkGroup.astro               # one grouped block (Apps / AI tooling / Foundation), receives projects[]
    ProjectCard.astro            # single card, tilt-eligible
    Telemetry.astro              # headline stats + heatmap + model-mix + top-tools + chips + terminal
    Heatmap.astro                # the 7×N grid, consumes computed cell data
    About.astro
    Footer.astro
  data/
    projects.ts                  # typed project list + resolved links (see Task 5)
    projects.types.ts            # `Project` interface: { name, status, blurb, tech, repoUrl?, siteUrl?, siteLabel?, private: boolean }
  lib/
    theme.ts                     # THEME_KEY constant, getInitialThemeScript() (returns the literal inline-script string for BaseLayout), applyThemeClass()
    reveal.ts                    # scroll-reveal wire-up (ported from _setupReveals, drop the setInterval safety net)
    tilt.ts                      # card tilt wire-up (ported from _setupTilt)
    header.ts                    # nav blur-on-scroll (ported from _setupHeader)
    telemetry.ts                 # pure functions: formatCount(), heatBucket(dailyOutTokens, thresholds), modelMixSegments(), topToolBars(), memekitTerminal() — all pure, all unit-tested
    telemetry.types.ts
    three/
      scene.ts                   # createHeroScene(THREE, mount, hero, opts): ported _buildScene, returns {setTheme, setEnabled, dispose}
      init.ts                    # lazy-load orchestration: reduced-motion check, dynamic import('three'), IO-gated init, wires theme toggle button to scene.setTheme
  pages/
    index.astro                  # assembles BaseLayout + all sections
    404.astro                    # redirects to /
  styles/
    tokens/
      foundation.css             # vendored verbatim from docs/design/handoff/tokens/foundation.css
      brands.css                 # vendored + the [data-theme="dark"] .brand-skills mirror rule added
      components.css             # vendored verbatim
    global.css                   # body.ds-root base, ::selection, :focus-visible, fy-cue keyframes, scroll-behavior, poster-ring transition, .fy-tilt transition base
scripts/
  fetch-stats.mjs                # pre-build step: copies data/stats.json from $STATS_SOURCE if set, else uses the committed snapshot; stamps meta.build_date
tests/
  unit/telemetry.test.ts
  unit/theme.test.ts
  unit/projects.test.ts
data/
  stats.json                     # committed snapshot (copy of docs/design/handoff/data/stats.json), refreshed by scripts/fetch-stats.mjs pre-deploy
docs/design/handoff/             # moved here from repo root (was design_handoff_foundry/ + the loose 2A .dc.html file), read-only reference
.github/workflows/deploy.yml
```

---

## Phase 0 — Repo hygiene + scaffold

### Task 0.1: Relocate design reference material

- [ ] Move `design_handoff_foundry/` → `docs/design/handoff/` (git mv, preserves history for the untracked files as a fresh add).
- [ ] Move `Foundry 2A - Crucible Light.dc.html` → `docs/design/handoff/src/Foundry 2A - Crucible Light.dc.html`.
- [ ] Leave `Foundry Portfolio.zip` untouched at repo root but add it to `.gitignore` (it's a redundant zip of the same bundle — do not commit a duplicate binary of already-tracked source).
- [ ] Commit: `docs: relocate design handoff bundle under docs/design/handoff`.

### Task 0.2: Astro scaffold

- [ ] `npm create astro@latest . -- --template minimal --typescript strict --no-install --skip-houston` (or equivalent non-interactive scaffold) at repo root. If the CLI insists on an empty directory, scaffold into a temp dir and merge, preserving `AGENTS.md`, `CLAUDE.md`, `PROJECTS.md`, `README.md`, `.gitignore`, `docs/`, `.mcp.json`, `.scratch/`.
- [ ] `npm install three@0.170.0 --save-exact` (pin to the exact version the prototype was authored against, per README's "pin three to an exact version, self-host" deviation).
- [ ] `npm install -D vitest`.
- [ ] Add `"test": "vitest run"` to `package.json` scripts.
- [ ] Verify `npm run dev` serves the default Astro welcome page.
- [ ] Commit: `chore: scaffold Astro + pin three`.

---

## Phase 1 — Tokens + global CSS (no components yet)

### Task 1.1: Vendor design tokens

- [ ] Copy `docs/design/handoff/tokens/foundation.css` → `src/styles/tokens/foundation.css` verbatim.
- [ ] Copy `docs/design/handoff/tokens/components.css` → `src/styles/tokens/components.css` verbatim.
- [ ] Copy `docs/design/handoff/tokens/brands.css` → `src/styles/tokens/brands.css`, then append the dark-mirror rule (2A source `Foundry 2A - Crucible Light.dc.html:36-39`):
  ```css
  [data-theme="dark"] .brand-skills {
    --ds-accent: #34D3EE; --ds-accent-hover: #5ADCF1; --ds-accent-soft: rgba(52,211,238,0.10);
    --ds-on-accent: #04141A; --ds-secondary: #E8B94A; --ds-tertiary: #A892F0;
  }
  ```
- [ ] Add a one-line comment at the top of each vendored file noting it's sourced from `docs/design/handoff/tokens/` and should ideally come from `github.com/abhijitbansal/design-system` once that repo is consumable as a package (per README §Design tokens).

### Task 1.2: Global base styles

- [ ] Create `src/styles/global.css` porting the prototype's inline `<style>` block (2A source lines 21-33): `html{scroll-behavior:smooth}`, `body{margin:0}`, `a{color:var(--ds-accent)}` / hover, `::selection`, `:focus-visible{outline:2px solid var(--ds-accent);outline-offset:3px}`, the `@keyframes fy-cue` + `.fy-cue-anim` (2.8s, `var(--ds-ease-standard)`, `transform-origin:top`), and the `@media(prefers-reduced-motion:reduce)` override that kills both the smooth scroll and the cue animation.
- [ ] Add `body.ds-root` class application (Astro layout adds this class directly on `<body>` — no need for the prototype's DC-runtime `classList.add` dance).
- [ ] Import order in `BaseLayout.astro`: `foundation.css` → `brands.css` → `components.css` → `global.css`.

### Task 1.3: Manual check

- [ ] `npm run dev`, open the (still-empty) page, confirm no console errors, fonts/tokens load. This is a build-plumbing check, not a visual one yet — nothing to compare against.
- [ ] Commit: `feat: vendor design tokens + global base styles`.

---

## Phase 2 — Theme system (no-flash toggle, before any content)

### Task 2.1: `src/lib/theme.ts`

- [ ] Write:
  ```ts
  export const THEME_KEY = 'fy-theme';
  export type Theme = 'light' | 'dark';

  export function noFlashInlineScript(): string {
    return `
      var t = null;
      try { t = localStorage.getItem('${THEME_KEY}'); } catch (e) {}
      document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light');
    `;
  }

  export function readTheme(): Theme {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  export function setTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }

  export function toggleTheme(): Theme {
    const next: Theme = readTheme() === 'dark' ? 'light' : 'dark';
    setTheme(next);
    return next;
  }
  ```
- [ ] `tests/unit/theme.test.ts`: mock `document.documentElement` + a fake `localStorage`; assert `toggleTheme()` flips the attribute and persists it, and that `setTheme` swallows a `localStorage` throw (private-browsing Safari) without crashing.
- [ ] Run `npm test`, confirm pass.

### Task 2.2: Wire into `BaseLayout.astro`

- [ ] `<script is:inline set:html={noFlashInlineScript()}></script>` as the **first** thing in `<head>`, before any stylesheet link — must run before first paint, matching 2A lines 13-20 minus the DC-runtime bits (`document.title`, `ds-root` class) which move to normal Astro `<title>` / `<body class="ds-root">`.
- [ ] Default light is enforced by `noFlashInlineScript()` itself (falls back to `'light'` for any value other than `'dark'`), matching the 2A delta ("default light… no system-pref flash").
- [ ] Nav theme-toggle button (`#fy-theme-btn`, text `Theme · Light` / `Theme · Dark`) gets its click handler from a small inline module in `Nav.astro` that imports `toggleTheme` from `src/lib/theme.ts` and updates its own label — same logic as 2A lines 556-571, minus the `_three.setTheme` call (that wiring happens in Phase 6 once the scene module exists; guard it behind `window.__foundryScene?.setTheme?.(...)`).

---

## Phase 3 — Static DOM, pixel parity, light + dark, 1440/1024/390 (before touching Three.js)

Build every section as an Astro component, copying markup/copy/inline-style values **verbatim** from `docs/design/handoff/src/Foundry 2A - Crucible Light.dc.html`. Reference line ranges below; do not paraphrase copy.

### Task 3.1: `SkipLink.astro` + `Nav.astro`

- [ ] Skip link: 2A lines 43. Nav: lines 45-62 (ember tab mark, `FOUNDRY` wordmark, Work/Expertise/Telemetry/About links, theme toggle button, GitHub ↗). `#fy-headerbg` blur-on-scroll div stays — its opacity is driven by `src/lib/header.ts` (ported in Phase 4), not CSS alone.

### Task 3.2: `Hero.astro`

- [ ] Lines 65-100: radial-gradient background div, `#fy-poster-rings` SVG (4 concentric circles, exact `r`/`opacity`/`stroke-dasharray` values), `#fy-canvas-mount` (empty until Phase 6), the text-protection gradient overlay, kicker + `LAST FORGED` pill, H1 with italic accent-colored `privacy-first`, lead paragraph, CTA buttons, mono contact links row, scroll cue.
- [ ] `LAST FORGED · <build date>` — leave the date as a prop, `<slot>` or Astro expression fed by `new Date()` at build time (formatted `MMM D, YYYY`), not a hardcoded string — this is the "regenerate at build" requirement from the README, applies to the hero pill too even though the README's Telemetry section is the one that spells it out explicitly.
- [ ] Email links: 2A uses Cloudflare email-obfuscation (`__cf_email__` / `/cdn-cgi/l/email-protection#…`) — that's a Cloudflare-Pages-only feature, not available on GitHub Pages. Replace with a plain `mailto:contact@abhijitbansal.com` link (visible plaintext) — flag this as an intentional, necessary deviation, not an oversight, since the README's "Deviations for production" list doesn't cover it (Cloudflare-specific tooling doesn't carry over to GitHub Pages).

### Task 3.3: `Expertise.astro`

- [ ] Lines 102-130: three `<article>` columns (iOS & Apple platforms / AI agent tooling / Full-stack product craft), verbatim body copy + mono tech lines.

### Task 3.4: Work section — data-driven cards

- [ ] `src/data/projects.types.ts`:
  ```ts
  export type ProjectStatus = 'active' | 'recently-active' | 'heating-up';
  export interface Project {
    name: string;
    status: ProjectStatus;
    blurb: string;
    tech: string;
    repoUrl?: string;
    siteUrl?: string;
    siteLabel?: string;
    private: boolean;
  }
  ```
- [ ] `src/data/projects.ts`: transcribe all 9 projects + the "In the forge" callout copy from 2A lines 147-279 into typed objects, grouped as `appsProjects`, `aiToolingProjects`, `foundationProjects` (matching the three `<div style="...margin:...4vw,56px)...">` group headers at lines 141/197/253). **Link fields for Cubby, Paperix, Floorprint, sift, cartoon, claude-skills come from Task 3.4a below — do not hardcode guesses.**
- [ ] `WorkGroup.astro`: renders a group header row (label + hairline + count) then a `repeat(auto-fill,minmax(min(390px,100%),1fr))` grid of `ProjectCard`.
- [ ] `ProjectCard.astro`: renders one card per 2A's per-project markup shape (lines 147-158 is the exact template — number badge, title + status pill, blurb, footer row with tech string + right-aligned link-or-`Private`). Status pill logic: `active` → default green dot (no override), `recently-active` → `style="--ds-success:var(--ds-warning)"` (2A line 243), `heating-up` (the callout only) → `style="--ds-success:var(--ds-info)"` (2A line 278). Right-column logic: `siteUrl` → `<a>{siteLabel ?? siteUrl-host} ↗</a>` styled as accent link; `repoUrl` (no siteUrl) → `GitHub ↗` link; neither → `<span class="ds-micro" style="color:var(--ds-text-faint)">Private build</span>`. For `sift`, render **two** links per README §Project links rule 2 (`GitHub ↗` + a `digest ↗`-style second link) — extend `Project` with an optional `extraLink?: {url: string; label: string}`.
- [ ] `WorkSection.astro`: kicker/H1/lead/rule (lines 134-139), then the three `WorkGroup`s in order (Apps → AI/agent tooling → Foundation, matching 2A group order), then the "In the forge" `<aside class="ds-callout">` (lines 273-279, verbatim copy).
- [ ] `.fy-tilt` class stays on every card (behavior wired in Phase 4); `data-reveal` attribute stays on every reveal-eligible element throughout every component in this phase.

### Task 3.4a: Resolve and hardcode project links (data task, not visual)

- [x] **Already resolved** (via `gh api repos/abhijitbansal/<repo>/pages` + `curl -I` live checks on 2026-07-11 — all returned 200, no re-verification needed unless this plan goes stale):
  | Project | repoUrl | siteUrl | siteLabel | extraLink |
  |---|---|---|---|---|
  | Cubby | — (private) | `https://gotcubby.com` | `gotcubby.com ↗` | — |
  | Paperix | — (private, `doc-scan` app repo never linked) | `https://abhijitbansal.github.io/paperix-site/` | `paperix-site ↗` | — |
  | Floorprint | — (private) | `https://abhijitbansal.github.io/floorprint-site/` | `floorprint-site ↗` | — |
  | sift | `https://github.com/abhijitbansal/sift` | — | `GitHub ↗` | `{url:'https://abhijitbansal.github.io/sift/', label:'digest ↗'}` |
  | cartoon | `https://github.com/abhijitbansal/cartoon` | `https://abhijitbansal.github.io/cartoon/` | `GitHub ↗` (site link rendered as the `extraLink`-style second link, same as sift) | — |
  | claude-skills | `https://github.com/abhijitbansal/claude-skills` | `https://abhijitbansal.github.io/claude-skills/` | `GitHub ↗` (+ site link, same pattern) | — |
  Folix, memekit, design-system, and the private app repos themselves (`cubby`, `doc-scan`, `floorprint`) stay `private: true` with no link fields, per README rule 3 — never link an app repo even though it's the thing being described.
- [ ] Transcribe the table above into `repoUrl`/`siteUrl`/`siteLabel`/`extraLink` fields in `src/data/projects.ts`.
- [ ] `tests/unit/projects.test.ts`: assert every project with `private: false` has at least one of `repoUrl`/`siteUrl` set, and every project with `private: true` has neither — a cheap regression guard against the data drifting out of sync with the resolution rules.

### Task 3.5: `Telemetry.astro` static shell (numbers wired in Phase 5)

- [ ] Structure only for now, using the *committed snapshot* numbers from `docs/design/handoff/data/stats.json` / the 2A source (lines 283-457) so the section is visually complete for the Phase 3 parity check; Phase 5 replaces the hardcoded numbers with values computed from `data/stats.json` at build time so they don't silently drift.
- [ ] Include: headline 4-stat row, the "Last 30 days" heatmap card (structure only — real cell generation is `Heatmap.astro` in Phase 5), model-mix stacked bar + legend, top-tools bars, fun-fact chips, memekit terminal `<pre>` block, footnote paragraph.

### Task 3.6: `About.astro` + `Footer.astro`

- [ ] Lines 461-502, verbatim. Contact panel rows: GitHub / LinkedIn / Email (plain `mailto:`, same Cloudflare-obfuscation deviation as Task 3.2).

### Task 3.7: Assemble `pages/index.astro` + manual pixel-parity pass

- [ ] `BaseLayout` wraps `SkipLink + Nav + <main class="brand-skills">{Hero, Expertise, WorkSection, Telemetry, About}</main> + Footer`.
- [ ] `npm run dev`. Using the browser (resize to exactly 1440×900, 1024×768, 390×844 — devtools responsive mode with the device toolbar), compare every section side-by-side against `docs/design/handoff/Foundry-1A-Crucible.html`'s 2A sibling — actually against `docs/design/handoff/src/Foundry 2A - Crucible Light.dc.html` opened directly in a browser tab (open the file via `file://`, DC-runtime `support.js` will 404 but the static markup/CSS still renders since styles are inline) — at each of the 3 widths, in both `data-theme="light"` and `data-theme="dark"` (toggle via the nav button once Phase 2 wiring is live). Check: spacing, type sizes, colors (especially accent = teal not ember — this is the one deliberate content difference from the README baseline), card grid wrapping, hairline positions.
- [ ] Fix any drift found. Do not proceed to Phase 4 until all 6 combinations (3 widths × 2 themes) look correct.
- [ ] Commit: `feat: static DOM sections, pixel-parity with 2A source`.

---

## Phase 4 — Interaction JS (header blur, scroll-reveal, card tilt)

### Task 4.1: `src/lib/header.ts`

- [ ] Port `_setupHeader` (2A lines 544-554) as a plain function `initHeaderBlur(): () => void` (returns a cleanup/unsubscribe). No `_cleanup` array pattern needed — Astro pages don't unmount.
- [ ] Call from a small inline `<script>` in `Nav.astro`.

### Task 4.2: `src/lib/reveal.ts`

- [ ] Port `_setupReveals` (2A lines 573-603) **minus the `setInterval(check, 400)` safety net** (Global Constraints — that's the "interval reveal fallback" the README explicitly says to drop). Keep the reduced-motion early return, the initial pending-set computation, and the scroll/resize-driven `check()`.
- [ ] Wire from a page-level inline script (not per-component) since it needs to run once against the whole `[data-reveal]` set.

### Task 4.3: `src/lib/tilt.ts`

- [ ] Port `_setupTilt` (2A lines 605-632) verbatim logic (reduced-motion + fine-pointer guards, rAF-throttled `perspective(760px) rotateX/rotateY` transform, 380ms spring-back on leave). Runs against `.fy-tilt` cards.

### Task 4.4: Manual check

- [ ] Confirm header blurs past `scrollY>14`, sections fade/rise into view on scroll (both themes, all 3 widths), cards tilt on pointer move (desktop only — verify it's absent on the 390 mobile-emulation width where `pointer:fine` is false).
- [ ] Commit: `feat: header blur, scroll-reveal, card tilt interactions`.

---

## Phase 5 — Telemetry data pipeline (build-time, no client fetch)

### Task 5.1: `src/lib/telemetry.types.ts` + `src/lib/telemetry.ts`

- [ ] Types mirroring `data/stats.json`'s `meta`/`totals` shape (only the fields the page consumes — do not model the whole schema, e.g. skip `top_agents`/`top_slash`/`model_breakdown` which the page doesn't render).
- [ ] Pure functions, all unit-tested:
  ```ts
  export function formatCompact(n: number): string {
    // 292504 -> "292,504"; 76683120 -> "76.7M"; 11156632042 -> "11.2B"
  }

  export function heatBucket(outTokens: number | undefined): 'quiet' | 'low' | 'mid' | 'high' | 'peak' {
    if (outTokens === undefined || outTokens <= 0) return 'quiet';
    if (outTokens < 1_500_000) return 'low';
    if (outTokens < 4_500_000) return 'mid';
    if (outTokens < 7_500_000) return 'high';
    return 'peak';
  }
  // thresholds per README §03: >0, >=1.5M, >=4.5M, >=7.5M — 'peak' is gold (--ds-secondary), 'high' is full accent

  export function heatBucketColor(b: ReturnType<typeof heatBucket>): string {
    switch (b) {
      case 'quiet': return 'var(--ds-surface-2)';
      case 'low': return 'color-mix(in srgb, var(--ds-accent) 28%, var(--ds-surface-2))';
      case 'mid': return 'color-mix(in srgb, var(--ds-accent) 55%, var(--ds-surface-2))';
      case 'high': return 'var(--ds-accent)';
      case 'peak': return 'var(--ds-secondary)';
    }
  }

  export function last30DaysCells(dailyOutTokens: Record<string, number>, endDateISO: string): Array<{ date: string; label: string; tokens: number | undefined }> {
    // builds the 30-day, Sun-first, 7-row grid the heatmap consumes; missing dates => tokens undefined ("quiet")
  }
  ```
- [ ] `tests/unit/telemetry.test.ts`: table-test `formatCompact` against the exact values from the spec (`292504→"292,504"`, `76683120→"76.7M"`, `11156632042→"11.2B"`, `2796→"2,796"`); table-test `heatBucket` at the threshold boundaries (0, 1_499_999, 1_500_000, 4_499_999, 4_500_000, 7_499_999, 7_500_000) since off-by-one here silently miscolors the heatmap; test `last30DaysCells` produces exactly 30 entries ending on the given date and marks a missing date as `tokens: undefined`.

### Task 5.2: `data/stats.json` + `scripts/fetch-stats.mjs`

- [ ] Copy `docs/design/handoff/data/stats.json` → `data/stats.json` (committed snapshot, build input).
- [ ] `scripts/fetch-stats.mjs`: if `process.env.STATS_SOURCE` is set and the file exists, copy it over `data/stats.json`; otherwise leave the committed snapshot as-is. Log which path was taken. Wire as `"prebuild": "node scripts/fetch-stats.mjs"` in `package.json` so it runs before every `astro build` — this is the "add a build step that copies the freshly generated stats.json" requirement from the README; the actual generator script lives in `claude-skills` (out of this repo's scope) and is expected to write to whatever path `STATS_SOURCE` points at in CI.
- [ ] `LAST FORGED` date: compute in `Hero.astro`/`BaseLayout` as `new Date().toISOString()` formatted at build time — this is the literal build date, per README ("LAST FORGED pill date = deploy/build date"), independent of `stats.json`'s own `date_max`.

### Task 5.3: Wire `Telemetry.astro` + `Heatmap.astro` to computed data

- [ ] `Telemetry.astro` frontmatter imports `data/stats.json` directly (Astro/Vite supports JSON imports) and calls the Task 5.1 functions to derive every displayed number — replace the Phase 3 hardcoded values.
- [ ] `Heatmap.astro`: renders `last30DaysCells(...)` as the 7-row grid, each cell's `title` attribute built as `"{label} — {formatCompact(tokens)} tokens out"` or `"{label} — quiet"` (matching 2A's per-cell `title` pattern at lines 323-352), background from `heatBucketColor`.
- [ ] Model-mix bar segment widths and top-tools bar-fill widths: compute from `totals`/`models`/`top_tools` arrays in `stats.json` rather than hardcoding the percentages (guards against stats.json changing without the page updating). Round to the nearest whole percent for the bar segments; keep the six-model / five-tool ordering exactly as the design (accent/secondary/tertiary/success/warning/text-faint color assignment order for the six model-mix segments).
- [ ] Memekit terminal `<pre>` block: pull `in_tokens`/`out_tokens`/`cache_read_tokens` from `totals` and format with the same `in ....... N` label-padding style as 2A line 447-449 (a small local helper, not a general-purpose table formatter — this one block only).

### Task 5.4: Manual check

- [ ] Re-run the Phase 3 pixel-parity pass specifically on the Telemetry section — numbers should be visually identical to the 2A source snapshot since `data/stats.json` is currently the same data the prototype was built from.
- [ ] `npm test` — all telemetry/theme/projects unit tests green.
- [ ] Commit: `feat: build-time telemetry pipeline, drop hardcoded stats`.

---

## Phase 6 — Three.js hero scene (lazy island, theme-aware)

### Task 6.1: `src/lib/three/scene.ts`

- [ ] Port `_buildScene` (2A lines 658-952) into `export function createHeroScene(THREE: typeof import('three'), mount: HTMLElement, hero: HTMLElement, opts: { reducedMotion: boolean }): HeroScene`, where:
  ```ts
  export interface HeroScene {
    setTheme(dark: boolean): void;
    setEnabled(on: boolean): void;
    dispose(): void;
  }
  ```
- [ ] Faithful port of: renderer setup (ACES tone mapping, exposure 1.12, `setPixelRatio(min(dpr,2))`), molten-core icosahedron + CPU vertex displacement, halo sprites, instrument rings, 9 orbiting ingots with the deterministic mulberry32-style `rand()` seeded at `20260711`, 90-particle ember system, bellows pulse, pointer parallax, scroll-cooling, the fps watchdog that drops DPR to 1.25 after 240 slow frames, IO-based pause, resize handling, and `applyTheme(dark)` (lines 793-807) re-palette (scene background/fog, ring/hemi/dir light colors+intensity, halo/ember base opacities cream↔ink per the light-mode tuning already in the 2A source — light mode's `haloBase1=0.36`/`haloBase2=0.06`/`emberBase=0.62` are already dialed down from dark's `0.5`/`0.14`/`0.85`, so no additional glow-washout tuning is needed beyond what 2A already specifies).
- [ ] **Drop** per Global Constraints: the `console.log('[foundry] applyTheme dark=', dark)` line, the `watchdog` `setInterval` fallback inside `syncRun`, `preserveDrawingBuffer: true` in the `WebGLRenderer` constructor. **Keep**: the fps-degrade watchdog (`frames`/`slowFrames`/`degraded`, distinct from the rAF-liveness watchdog being dropped), the `ResizeObserver`, the `IntersectionObserver` hero-visibility pause, the immediate first-frame paint call.
- [ ] Molten core color (`#ff4a1c` emissive / `#1a1108` base) does **not** change with theme — only ambient/environment values re-palette, per the 2A `applyTheme` function (core material is untouched by it) and the task brief's "molten core stays orange in both themes."

### Task 6.2: `src/lib/three/init.ts`

- [ ] `export async function initHeroScene(): Promise<void>`: reduced-motion check (bail, leave poster) → `requestIdleCallback` (with `setTimeout` fallback for Safari) or first-intersection-of-hero trigger, whichever fires first → `const THREE = await import('three')` (self-hosted package import, not the CDN URL the prototype used) → `createHeroScene(...)` → store the returned `HeroScene` on `window.__foundryScene` so `Nav.astro`'s theme-toggle handler can call `.setTheme()` without a module-scope import cycle.
- [ ] Canvas fade-in (opacity 0→1, 1400ms) and poster-ring fade-out on first rendered frame — same behavior as 2A, implemented via the `shownOnce` flag already ported in Task 6.1.
- [ ] No-WebGL / load-failure: `try/catch` around the dynamic import and around `new THREE.WebGLRenderer(...)` inside `createHeroScene` (already present as a `try{}catch{return null}` in the ported code) — on failure, leave the poster SVG at full opacity, log a `console.warn`, do not throw.

### Task 6.3: Wire into `Hero.astro` + code-split verification

- [ ] Inline `<script type="module">import { initHeroScene } from '../lib/three/init.ts'; initHeroScene();</script>` at the end of `Hero.astro` (or a page-level script — either works since Astro processes and bundles it either way; page-level keeps `Hero.astro` markup-only).
- [ ] `npm run build` then inspect `dist/_astro/*.js` chunk sizes: confirm `three` and `scene.ts` land in a separate chunk from the entry bundle, and that the entry bundle (everything except the three chunk) is under 300KB gzipped (`gzip -c dist/_astro/<entry>.js | wc -c`).
- [ ] Manual check: dev server, hero scene renders, theme toggle re-palettes the scene live (background/fog/lights swap, core stays orange), pointer parallax works, scroll-cooling dims the scene approaching `#work`, scrolling the hero fully out of view pauses the render loop (verify via a `performance.now()` console probe or the browser's rendering FPS meter going idle), `prefers-reduced-motion` (devtools emulation) skips 3D entirely and leaves the poster visible.
- [ ] Commit: `feat: port Three.js hero scene as a lazy, theme-aware island`.

---

## Phase 7 — Accessibility

### Task 7.1: Landmarks + focus + aria pass

- [ ] Confirm `header`/`main`/`footer` landmarks exist (already true from `BaseLayout` structure — verify, don't re-derive).
- [ ] Skip link keyboard-focus visible and functional (`Tab` from page load lands on it, `Enter` jumps to `#work`).
- [ ] `:focus-visible` outline present on every interactive element (nav links, theme toggle, CTA buttons, project card links, contact rows) — already covered by the global `:focus-visible` rule from Task 1.2, but verify no component overrides `outline: none` without an alternative.
- [ ] `#fy-canvas-mount`, `#fy-poster-rings`, and all decorative gradient/background divs get `aria-hidden="true"` (already true in the ported markup — verify it survived the Astro port).
- [ ] Heatmap: `role="img"` + `aria-label` summarizing the range and heaviest days (already in 2A markup, line 322 pattern) + per-cell `title` (Task 5.3 already produces these).
- [ ] Keyboard-only pass: `Tab` through the entire page, confirm every link/button is reachable in visual order and nothing is a keyboard trap (card tilt / reveal must not intercept focus).
- [ ] Commit if any fixes were needed: `fix: accessibility gaps found in keyboard/aria pass`.

---

## Phase 8 — SEO / meta / assets

### Task 8.1: `BaseLayout.astro` head tags

- [ ] `<title>Abhijit Bansal — Foundry</title>`, meta description (one-liner identity, e.g. "Privacy-first iOS apps and AI agent tooling, designed and shipped solo."), `<link rel="canonical" href="https://abhijitbansal.com">`, Open Graph (`og:title`, `og:description`, `og:image`, `og:url`, `og:type=website`) + Twitter card `summary_large_image`.
- [ ] Google Fonts: Instrument Serif (400 + italic), Inter (400-700), JetBrains Mono (400-700), with `display=swap` and `<link rel="preconnect">` to `fonts.googleapis.com` + `fonts.gstatic.com` (crossorigin).

### Task 8.2: OG image + favicons

- [ ] Build `scripts/og-image/generate.mjs`: a small Node script using `sharp` (added as a devDependency) that rasterizes a 1200×630 SVG (dark bg `#1B1814`, ember-orange core glyph, "Abhijit Bansal" + "Foundry — privacy-first apps & AI agent tooling" text in the design system's type) to `public/og-image.png`. Run once locally, commit the PNG (not regenerated on every build — it's static content, not derived from `stats.json`).
- [ ] Favicon set from the ember-tab mark (the `16×3px` accent bar + circle motif used in the nav/footer): produce `public/favicon.svg` (vector, theme-agnostic — use the dark-mode accent `#34D3EE` teal as a fixed color since favicons don't get `data-theme`) and rasterize to `favicon-32.png`/`favicon-180.png` (apple-touch-icon) via the same `sharp` script. Wire `<link rel="icon">` / `<link rel="apple-touch-icon">` in `BaseLayout`.

### Task 8.3: `sitemap.xml` + `robots.txt`

- [ ] `npm install @astrojs/sitemap`, add to `astro.config.mjs` with `site: 'https://abhijitbansal.com'`.
- [ ] `public/robots.txt`: `User-agent: *\nAllow: /\nSitemap: https://abhijitbansal.com/sitemap-index.xml`.

### Task 8.4: Manual check

- [ ] `npm run build`, serve `dist/` locally, verify OG/Twitter meta via a link-preview debugger's markup rules (view-source check is sufficient — no external service call needed), confirm `sitemap-index.xml` and `robots.txt` exist in `dist/`.
- [ ] Commit: `feat: SEO meta, OG image, favicons, sitemap`.

---

## Phase 9 — Deploy

### Task 9.1: `astro.config.mjs` for GitHub Pages

- [ ] `site: 'https://abhijitbansal.com'`, no `base` (custom domain serves from root).

### Task 9.2: `public/CNAME` + `pages/404.astro`

- [ ] `public/CNAME` containing exactly `abhijitbansal.com`.
- [ ] `src/pages/404.astro`: minimal page with `<meta http-equiv="refresh" content="0; url=/">` and a plain-text fallback link, styled with the same tokens (not a bare unstyled page).

### Task 9.3: `.github/workflows/deploy.yml`

- [ ] Standard Astro-on-Pages workflow: checkout → setup-node → `npm ci` → `npm run build` (which runs `prebuild` → `fetch-stats.mjs` → `astro build`) → `actions/upload-pages-artifact` on `dist/` → `actions/deploy-pages`. Trigger on push to `main`. Set `permissions: { contents: read, pages: write, id-token: write }`.
- [ ] Do not attempt to actually trigger a deploy or touch GitHub Pages settings in this session — that's a repo-settings change with external effect; hand off to the user with the exact steps (enable Pages → "GitHub Actions" source, add the custom domain in repo settings, verify DNS) rather than performing it.
- [ ] Commit: `ci: add GitHub Pages deploy workflow`.

---

## Phase 10 — Full acceptance pass

### Task 10.1: Run the README's acceptance checklist verbatim, both themes

- [ ] Re-verify pixel parity at 1440/1024/390 in **both** light and dark (light was the Phase 3 focus; dark needs an explicit re-pass here since it's the 2A delta).
- [ ] Hero 3D lazy-loads after first paint; poster shows under no-WebGL / reduced-motion / load-failure (test via devtools "disable WebGL" flag or throttled/offline network for the dynamic import).
- [ ] 60fps desktop (devtools Performance panel, record 5s of idle hero); render pauses off-screen (scroll `#work` into view, confirm rAF stops in a `performance` trace) and in hidden tabs (switch tabs, confirm no CPU activity); DPR ≤ 2 (`renderer.getPixelRatio()` console check).
- [ ] Lighthouse mobile ≥ 90, LCP < 2.5s, initial JS ≤ 300KB gz pre-3D (Lighthouse run against the built `dist/` served locally, mobile throttling profile).
- [ ] Project links: run `curl -I` against every resolved `repoUrl`/`siteUrl`/`extraLink` in `src/data/projects.ts`, confirm all 200.
- [ ] Telemetry regenerated at build; LAST FORGED = build date (rebuild twice a minute apart, confirm the pill date tracks — or just confirm it reads `new Date()` at build time, not a hardcoded string).
- [ ] Keyboard pass (repeat of Phase 7, now against the fully-assembled built site).
- [ ] OG/Twitter cards render correctly (view-source check), sitemap + favicon present in `dist/`.
- [ ] Zero third-party requests except Google Fonts (devtools Network panel, full page load, filter by domain).
- [ ] `npm test` — full unit suite green.
- [ ] Fix anything that fails, re-run until the whole checklist is clean.

### Task 10.2: Session log + manual-test checklist + PR

- [ ] Write `docs/sessions/0002-2026-07-11-site-2a-implementation.md` following the existing session-log template (`docs/sessions/README.md`), covering Achieved / Decisions (esp. the Cloudflare-email-obfuscation deviation, the `STATS_SOURCE` build-step compromise, and any pixel-parity fixes made along the way) / Follow-ups (GitHub Pages settings + DNS, the OG image needing a human design pass if the generated one looks rough) / Resume pointer / Models.
- [ ] Generate the interactive HTML manual-test checklist (per global CLAUDE.md rule) to `.scratch/feat-site-2a-implementation-test-checklist.html` covering: device-only checks (real mobile Safari/Chrome, not devtools emulation — touch tilt-card behavior, real-device Lighthouse), DNS/CNAME propagation once Pages is configured, and anything the automated acceptance pass in Task 10.1 could not verify from a dev machine. Deliver via `SendUserFile`.
- [ ] Open the PR (`gh pr create`) once the branch is pushed, summarizing the phases above and linking the acceptance checklist results.
