# Handoff: Foundry — abhijitbansal.com portfolio

Design → production handoff for the **Foundry** personal portfolio site (Abhijit Bansal). Two locked-fidelity design prototypes are included; implement ONE (see "Picking the variant") as a static site deployable to GitHub Pages at **abhijitbansal.com**.

## About the design files

The HTML files in this bundle are **design references created in HTML** — interactive prototypes showing intended look, motion, and behavior. They are NOT production code to copy verbatim. The task is to **recreate these designs in a fresh production codebase** (stack recommendation below). Treat every visual value in them — hex, spacing, type sizes, easing — as the spec; read the source of `src/*.dc.html` for exact inline styles and the full Three.js scene code (in the `<script data-dc-script>` block at the bottom of each file).

- `Foundry-1A-Crucible.html` / `Foundry-1B-Monolith.html` — self-contained, open directly in any browser to experience each design (3D loads from CDN, needs network).
- `src/*.dc.html` — same designs, readable source. All styling is inline + a small token stylesheet; the scene code is plain readable JS.
- `tokens/*.css` — the House Design System token + component CSS (source of truth for colors/type/spacing).
- `data/stats.json` — Claude Code telemetry data consumed by the Telemetry section.

## Fidelity

**High-fidelity.** Recreate pixel-perfectly: colors, typography, spacing, copy, motion timing, and the 3D scenes. The only intentional deviations allowed are the production concerns listed under "Deviations for production".

## Picking the variant

Both variants share nav, expertise, telemetry, about, and footer. They differ in hero scene and Work-section layout:

- **1A "Crucible"** — molten core + 9 forged ingots orbiting on two tilted instrument rings; Work = grouped cards (2-col grid) with 3D hover tilt.
- **1B "Monolith"** — a 5-slab forged billet with a glowing molten interior breathing through the seams; Work = dense single-column ledger rows; stiller motion (no card tilt).

Default to **1A** unless told otherwise.

## Production stack — recommendation and rationale

**Astro + vanilla Three.js.** 

- Astro ships zero framework JS by default → the ≤300KB pre-3D budget is trivially met (this page needs ~5KB of hand-written JS besides Three).
- The page is one mostly-static document; there is no component state that justifies React. React Three Fiber would add the React runtime + reconciler (~45KB gz) to render ONE imperative scene — vanilla Three (~150KB gz core) in a hand-rolled module is smaller, faster to first frame, and matches the prototype code 1:1.
- 3D must be a lazy island: `const THREE = await import('three')` triggered on `requestIdleCallback` (or first intersection of the hero), never blocking first paint. Bundle it as its own Vite/Astro chunk — do NOT put three in the entry chunk.
- Vite alone also works; Astro is preferred for free content structure, `astro-sitemap`, and OG integration.
- Static output → `dist/`, GitHub Pages. **Hash anchors only** (`#work`, `#telemetry`…) — no history-API routes.

## Architecture requirements (from the original brief — all hard)

- Initial JS ≤ 300KB gz before the 3D chunk; 3D lazy-loaded after first paint; DPR capped at 2.
- Rendering pauses when the hero is scrolled out of view (IntersectionObserver) and when the tab is hidden (rAF's natural throttling suffices; the prototypes also carry a low-rate watchdog fallback that exists ONLY because design-tool iframes suppress rAF — you may drop it in production, but keep the IO pause).
- `prefers-reduced-motion` → do not init 3D at all; static poster (already designed: CSS ember gradients + instrument-ring SVG in the hero background, visible until the canvas fades in).
- WebGL unavailable / three fails to load → same poster; content is 100% real DOM and never blocked on the 3D bundle.
- Lighthouse mobile ≥ 90, LCP < 2.5s mid-tier mobile, 60fps desktop. The scenes as specced are far under budget (≤ ~3k vertices, no shadows, no postprocessing — glow is emissive + additive canvas-texture sprites).
- No glTF assets are needed — all geometry is procedural (keeps the asset budget at zero).
- Accessibility: semantic landmarks (`header/main/section/footer`), skip-link (prototype has one), keyboard focus visible (`:focus-visible` outline in accent), WCAG AA (the token pairs used pass on the dark bg), canvas/decoration `aria-hidden`, heatmap has `role="img"` + aria-label + per-day `title`.
- Zero trackers/analytics. No cookie UI.

## Design tokens (dark theme — the site is dark-only, pin `data-theme="dark"`)

From `tokens/foundation.css` + `tokens/brands.css` (Paperix accent family = the ember palette):

| Token | Value | Use |
|---|---|---|
| `--ds-bg` | `#1B1814` | page background |
| `--ds-surface` | `#24201A` | cards, contact panel |
| `--ds-surface-2` | `#16130F` | terminal/meme card, heatmap zero-cells |
| `--ds-line` | `#2F2920` | hairline borders |
| `--ds-line-strong` | `#3D362B` | stronger hairlines, quiet-button border |
| `--ds-text` | `#F0EAD6` | headings/body on dark |
| `--ds-text-2` | `#C5BBA1` | body copy |
| `--ds-text-3` | `#8B8270` | captions, mono labels |
| `--ds-text-faint` | `#5A5142` | faintest labels, card numbers |
| `--ds-accent` | `#E36A5E` | ember accent (kickers, links, fills) |
| `--ds-accent-hover` | `#BF4C40` | hover |
| `--ds-accent-soft` | `rgba(227,106,94,0.14)` | focus ring, callout bg |
| `--ds-on-accent` | `#1B1814` | text on accent fills |
| `--ds-secondary` | `#E6BF5A` | gold — heatmap peak, 1B hero em, model-mix segment |
| success/warning/danger/info | `#7FC8A0` / `#E6BF5A` / `#E08A6D` / `#5FB5D6` | status-pill dots, chart segments |

Type: `Instrument Serif` (display, 400 only), `Inter` (body), `JetBrains Mono` (kickers, micro labels, buttons, terminal). Google Fonts, `display=swap`, preconnect. Scale, spacing (4px grid), radii, and motion durations/easings: see `tokens/foundation.css` — use it verbatim (it is generated from the design-system repo; ideally consume it from `github.com/abhijitbansal/design-system` instead of vendoring).

Signature idioms to keep: uppercase-mono **kicker** above every heading; **section rule** (1px hairline with 64×3px accent tab); hairline-bordered flat cards; mono status **pills** with colored dot.

## Page structure & copy (both variants — copy is final, keep verbatim)

1. **Nav** (fixed, transparent → blurred `--ds-bg` at scrollY>14): ember tab + `FOUNDRY`; links Work · Expertise · Telemetry · About · GitHub ↗.
2. **Hero** (100vh): kicker `THE FOUNDRY OF ABHIJIT BANSAL` + pill `LAST FORGED · <build date>` (see Telemetry); H1 `I build privacy-first apps and AI agent tooling.` with *privacy-first* in italic serif accent (1A ember `--ds-accent`, 1B gold `--ds-secondary`); lead `Designed, engineered, and shipped end to end — solo. Apps on the App Store, tools in the open, infrastructure underneath. Everything below was forged here.`; CTA `See the work ↓` (solid) + `GitHub ↗` (quiet); mono links GitHub · LinkedIn · contact@abhijitbansal.com; scroll cue bottom-left (pulsing 1px gradient line + `SCROLL`).
3. **01 · Expertise** — `Three disciplines, one bench.` Three columns (copy in prototype): iOS & Apple platforms / AI agent tooling / Full-stack product craft, each with mono tech line.
4. **02 · The work** (1A `Forged here.`, 1B `The ledger.`) — grouped `Apps — iOS & macOS` (Cubby, Paperix, Floorprint, Folix), `AI / agent tooling` (cartoon, claude-skills, sift, memekit), `Foundation` (design-system), then the `In the forge` callout (personal financial adviser teaser + "build my own tools instead of renting mediocre ones."). Status pills: active (green dot), recently active (gold), in-the-forge callout uses info-blue `heating up`.
5. **03 · Forge telemetry** — see below.
6. **04 · About** — `Solo, end to end.` + privacy conviction callout + contact panel (GitHub / LinkedIn / Email rows).
7. **Footer** — ember tab + `Forged in the Foundry — © 2026 Abhijit Bansal`; links; `No trackers · No analytics · Nothing to consent to`.

## Project links — resolution rules (IMPORTANT)

Every project row/card has a bottom line: mono tech string (left) and a link or `Private` marker (right). Resolve links like this:

1. **Companion-site projects** — apps whose marketing site is deployed from a **matching public `*-site` repo**:
   - **Cubby** → `cubby-site` repo → site **gotcubby.com** (custom domain; already in the prototypes).
   - **Paperix** → `paperix-site` repo → its deployed GitHub Pages URL (read the repo's CNAME if present, else `https://abhijitbansal.github.io/paperix-site/`). Add this link — the prototype currently shows only `Private build`; production should show the site link instead.
   - **Floorprint** → `floorprint-site` repo → same resolution as Paperix. Add the link.
   - These app repos themselves are **private** → never link the app repo.
2. **Sites inside the repo itself** — for public tooling repos the site is part of the repo (GitHub Pages from `docs/`, `site/`, or a Pages archive):
   - **sift** → repo link `github.com/abhijitbansal/sift` **and** its Pages digest/archive URL (resolve from the repo's Pages config). Show both: `GitHub ↗` + `digest ↗`-style second link.
   - **cartoon**, **claude-skills** → repo link always; check each repo for a deployed Pages site (`docs/` or `site/`) and add a site link if one is live.
3. **Private, no companion site** — **Folix, memekit, design-system, Paperix/Floorprint app repos**: curated blurb + status pill only, `Private` marker, no code links.

At build time, keep this in one data file (e.g. `src/data/projects.ts`) with `{ name, status, blurb, tech, repoUrl?, siteUrl?, siteLabel?, private }` so link policy is data, not markup. Verify each resolved URL returns 200 during CI.

## 03 · Forge telemetry — data pipeline + spec

Shows Claude Code usage stats. **All numbers are baked at build time** — no client fetching.

- Source: `data/stats.json` (schema example included) — generated locally by the stats script in `claude-skills` from `~/.claude` session logs. Add a build step (or pre-deploy script) that copies the freshly generated `stats.json` into the site and regenerates the section's numbers. The **`LAST FORGED` pill date = deploy/build date**; the telemetry range comes from `meta.date_min/date_max`.
- Headline stats (from `totals`): lines added `292,504`; sessions `2,796` (sub: `5,091 prompts · 92,044 replies`); tokens written `76.7M` (`out_tokens`); tokens cache-read `11.2B` (`cache_read_tokens`).
- **Last-30-days card**: GitHub-style heatmap, 7 rows (Sun–Sat) × ~5 week columns, 16px cells, 5px gap, 3px radius, from `daily_out_tokens` (missing dates = quiet). Heat scale (cool→hot): `--ds-surface-2` + `--ds-line` border → `color-mix(accent 28%)` → `color-mix(accent 55%)` → `--ds-accent` → `--ds-secondary` (gold = hottest; thresholds used: >0, ≥1.5M, ≥4.5M, ≥7.5M out-tokens). Per-day `title` tooltip. Beside it: 30-day sessions / lines / tokens-out totals; below: peak-day line + cool→hot legend.
- **Model mix card**: stacked 8px bar + dot legend from `models` (messages share): Opus 4.8 45% accent · Sonnet 5 19% secondary · Fable 5 13% info · Haiku 4.5 9% success · Sonnet 4.6 7% warning · Opus 4.7 7% text-faint.
- **Top tools card**: 5 rows, 3px track/fill bars scaled to max (Bash 19,359 / Read 14,348 / Edit 4,933 / Write 1,979 / Grep 622).
- **Fun-fact chips**: thinking blocks 25,353 · subagent runs 603 · skill invocations 146 · `/compact × 32` · longest prompt 544,215 chars · 422 screenshots into cubby.
- **memekit terminal**: `--ds-surface-2` card, mono header `$ memekit react --to "the token ledger"`, `<pre>` with the in/out/cache table, the two kaomoji lines, accent punchline `0 regrets · 292,504 lines shipped`. Generate the reaction with **memekit itself** at build time if convenient — nice dogfooding.
- Footnote links to `claude-skills` and states the on-device stance.

## The 3D scenes — implementation spec

Full working code is in each `src/*.dc.html` (`_buildScene`). Port it as an ES module. Shared plumbing (both scenes):

- `WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })`, ACES tone mapping, exposure ~1.1, `setPixelRatio(min(dpr, 2))`, scene.background `#1b1814`, `FogExp2(0x17130e, ~0.05)`. (Drop `preserveDrawingBuffer` in production — it exists in the prototype only for design-tool screenshots.)
- Canvas absolutely fills the hero behind a text-protection gradient overlay; fades in (opacity 0→1, 1.4s) after the first rendered frame; the CSS poster (ember radial gradients + hairline instrument-ring SVG) sits beneath and remains as the no-WebGL/reduced-motion fallback (fade the ring SVG out once live).
- Pointer parallax (±0.55x / ±0.3y camera lerp at 0.045–0.05), **scroll cooling**: `p = clamp(scrollY / (heroHeight × 0.85))` dims emissive/lights/halos/embers by ~78–80% and eases the camera down/back — the forge literally cools as you reach the work.
- Ember particles: additive `Points` with a soft radial canvas texture, ~90 (1A) / 45 (1B), slow upward drift + sine sway, respawn near the source, opacity scales with heat.
- Bellows pulse: `0.8 + 0.15·sin(1.1–1.35t) + 0.05·sin(3.7–4.3t)` modulating light intensity, emissive, halo opacity.
- Guards: IO pause when hero off-screen; fps watchdog that drops DPR to 1.25 if the first 240 frames are slow; dispose everything on teardown.

**1A Crucible**: icosahedron core (r 0.8, detail 4) with CPU vertex displacement (two sine octaves, amp 0.17/0.05), `MeshStandardMaterial{ color #1a1108, emissive #ff4a1c, flatShading }`; PointLight `#ff7a3d` intensity ~55 decay 2 at core; two additive halo sprites (scale 5 @ 0.55, 9.5 @ 0.14); two hairline torus rings (r 2.6 / 3.4, `#544a3a`, opacity 0.7/0.4, `fog:false`) tilted `PI/2−0.42, z 0.18` and `PI/2−0.18, z −0.35`; 9 tapered-box ingots (BoxGeometry 1.5×0.42×0.62, bottom verts ×0.78/×0.7, flat-shaded standard mat, colors `#4a4136/#423a30/#554a3c`, metalness 0.45, roughness ~0.5, faint emissive floor `#201812`) orbiting on the ring planes (r 1.9–3.4, speed ∝ 3.2/r, slight wobble + self-spin). Camera fov 36 at (0, 0.32, 8.6); group offset x +2.1 on wide viewports (0 centered on narrow), lookAt `group.x × 0.3` keeps it right of the text.

**1B Monolith**: 5 slabs (BoxGeometry 1.85×0.55×1.12, per-vertex jitter ±0.05/±0.024 for the hand-forged look, same steel mats at metalness 0.4), stacked with 0.05 gaps around an inner emissive box core (1.5×H×0.86, `MeshBasicMaterial #ff702e` lerping to `#552418` as it cools) + PointLight `#ff6a2c` 60 inside + dim front fill light; the gap widths breathe `(0.02 + 0.028·sin(1.1t)) × heat`; halo sprite (7 @ 0.34) + additive floor-glow plane (5×5 @ 0.22) under the base. Camera fov 34 at (0, 0.35, 9.4); group x +2.25 wide; whole stack slowly yaws (`0.055t` + pointer).

## Interactions & motion (DOM layer)

- Scroll-reveal: elements start visible; JS hides only below-fold elements (opacity 0, translateY 16px) then reveals on approach (top < 92% vh) with 0.75s `cubic-bezier(0.16,1,0.3,1)`. Never gate content on JS — no-JS must show everything.
- 1A card tilt (fine pointers only, skip on reduced-motion): pointermove → `perspective(760px) rotateX(±3°) rotateY(±3.6°) translateY(-2px)`, rAF-throttled, spring-back 380ms on leave. 1B rows instead get bg tint + 2px inset accent bar on hover.
- Hover states throughout: links get accent color / underline fill; card borders warm to `color-mix(accent 45%, line)`.
- Smooth scroll via CSS `scroll-behavior: smooth` (disabled under reduced-motion); `scroll-margin-top: 72px` on section anchors.

## SEO / meta / deploy

- `<title>Abhijit Bansal — Foundry</title>`; meta description (one-liner identity); canonical `https://abhijitbansal.com`; Open Graph + Twitter card (`summary_large_image`) — generate a 1200×630 OG image of the hero (dark bg, ember core, name + identity line); favicon set from the ember-tab mark; `sitemap.xml` + `robots.txt`.
- GitHub Pages: build workflow → `dist/` → Pages artifact; `CNAME` = `abhijitbansal.com`; 404.html redirecting to `/`. Contact is mailto + external links only.
- LinkedIn URL used in prototypes: `linkedin.com/in/abhijitbansal` — **verify before ship**.

## Deviations for production (allowed/required)

- Pin `three` to an exact version, self-host the module chunk (no CDN), and code-split it.
- Drop the prototype-only `preserveDrawingBuffer`, rAF watchdog, and interval reveal fallback (keep scroll-listener reveals + IO pause).
- Regenerate telemetry numbers + `LAST FORGED` date at build; don't ship the baked prototype values if fresher data exists.
- Replace the DC runtime (`support.js`) entirely — it is a design-tool artifact.

## Assets

No raster/3D assets required. Fonts from Google Fonts (Instrument Serif 400 + italic, Inter 400–700, JetBrains Mono 400–700). All iconography is typographic (`↗`, `↓`, `·`) or 1px SVG lines. OG image + favicons to be produced during implementation.

## Files in this bundle

| File | What |
|---|---|
| `Foundry-1A-Crucible.html` | Standalone prototype, variant 1A (open in browser) |
| `Foundry-1B-Monolith.html` | Standalone prototype, variant 1B |
| `src/Foundry 1A - Crucible.dc.html` | Readable source: markup + inline styles + scene JS |
| `src/Foundry 1B - Monolith.dc.html` | Readable source, variant 1B |
| `tokens/foundation.css` `tokens/components.css` `tokens/brands.css` | Design-system tokens & component idioms (truth for values) |
| `data/stats.json` | Telemetry input (schema reference + current values) |
| `PROMPT.md` | Paste-ready kickoff prompt for Claude Code |

## Acceptance checklist

- [ ] Pixel-parity with the chosen prototype at 1440/1024/390 widths (dark only)
- [ ] Hero 3D lazy-loads after first paint; poster shows under no-WebGL / reduced-motion / load-failure
- [ ] 60fps desktop; render pauses off-screen and in hidden tabs; DPR ≤ 2
- [ ] Lighthouse mobile ≥ 90; LCP < 2.5s; initial JS ≤ 300KB gz pre-3D
- [ ] Project links follow the resolution rules (companion `*-site` repos; in-repo Pages for sift et al.; private = no links) and all 200
- [ ] Telemetry regenerated at build; `LAST FORGED` = build date
- [ ] Keyboard: skip-link, visible focus, all interactive elements reachable
- [ ] OG/Twitter cards render correctly in link previews; sitemap + favicon present
- [ ] Zero third-party requests except Google Fonts (or self-host fonts to hit zero)
