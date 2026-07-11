# Claude Design — starter prompt

Copy-paste the block below into Claude design as the kickoff prompt. Keep this file in sync with any edits made during the design conversation.

---

Design and build **Foundry** — the personal portfolio website of **Abhijit Bansal** (abhijitbansal.com). This site is the window to my work: the single link I share on LinkedIn and everywhere else. It must read as professional-grade craft the moment it loads — the site itself is proof of what I build.

## Concept

"Foundry" — the place where my projects are forged. Lean into the metaphor with restraint: heat, metal, precision instruments — not cartoon anvils. Dark, confident base palette with ember/molten accent tones; strong typographic hierarchy; generous negative space. It should feel like a precision workshop, not a marketing template. No stock-portfolio tropes (no typewriter effects, no particle-swarm clichés, no skill bars).

## 3D requirement (the centerpiece)

- One signature WebGL hero scene (Three.js — vanilla or React Three Fiber, your call with rationale): an abstract foundry — think molten material coalescing into refined artifacts, each artifact representing a project. Scroll or pointer drives the scene subtly; it must feel physical and expensive, never gimmicky.
- Projects may render as forged objects/ingots in 3D, but every piece of information must ALSO exist as real DOM text — the 3D layer is atmosphere and delight, never the only carrier of content.
- Secondary 3D touches allowed (hover tilts, depth on cards) only where they stay 60fps.

## Hard technical constraints

- **Static site, deployable on GitHub Pages**: build output is plain files (Vite or Astro build → `dist/`). No SSR at runtime, no API routes, no backend. Single page or hash routing (no history-API routes that 404 on Pages). Contact = mailto + LinkedIn/GitHub links.
- **Performance is non-negotiable**: initial JS ≤ 300KB gzipped before the 3D bundle; 3D code lazy-loaded after first paint; glTF assets DRACO/meshopt-compressed, ≤ 1.5MB total; KTX2/basis textures where possible; pause rendering when tab/section not visible; devicePixelRatio capped at 2. Targets: Lighthouse Performance ≥ 90 mobile, LCP < 2.5s on mid-tier mobile, steady 60fps desktop.
- **Progressive enhancement**: full content readable and beautiful with WebGL unavailable, `prefers-reduced-motion`, or low-power devices — static poster/gradient fallback for the hero, content never blocked on the 3D bundle.
- **Accessibility**: semantic HTML, keyboard navigable, visible focus, WCAG AA contrast, alt text, reduced-motion respected.
- **SEO/meta**: proper title/description, Open Graph + Twitter card (I'll share this link constantly), sitemap, favicon set.
- Zero trackers/analytics. No cookie banners needed because nothing to consent to.

## Content

### Hero
Name, one-line identity: "I build privacy-first apps and AI agent tooling." CTA scrolls to projects. Links: GitHub (github.com/abhijitbansal), LinkedIn, email (contact@abhijitbansal.com).

### Expertise (three pillars)
1. **iOS / Apple platforms** — Swift 6, SwiftUI, SwiftData, Vision, RoomPlan, on-device ML; privacy-first, zero-backend architecture.
2. **AI agent tooling** — Claude Code skills/plugins, MCP servers, token-optimization, multi-agent orchestration.
3. **Full-stack product craft** — from Rust CLIs to design systems to shipping App Store releases solo.

### Projects (status badges: active / recently-active / paused / early)

**Apps:**
- **Cubby** (active, iOS) — inventory app for garage/basement storage: NFC tags + QR labels on racks and bins, scan to see contents, on-device Vision suggests item names, 3D rack view, widgets, Siri. Privacy-first, zero backend, zero third-party deps. Swift 6/SwiftUI/SwiftData. Site: gotcubby.com.
- **Paperix** (active, iOS) — document scanner that makes searchable PDFs with on-device OCR. No cloud, no accounts, no subscription — built because PDF-scanner apps shouldn't be rent.
- **Floorprint** (active, iOS + macOS) — scan rooms with LiDAR/RoomPlan into editable 2D floor plans; export PDF/DXF/USDZ/GLB/STEP; macOS mini-CAD editor. Organize the whole home in 3D.
- **Folix** (active, macOS, private) — privacy-first wealth dashboard: local Plaid pulls, on-device storage, AI-augmented insights. Seed of a personal financial adviser.

**AI / agent tooling:**
- **cartoon** (active, Rust, open source) — token-optimized CLI output for AI agents: reads 12 lines instead of 800, raw logs archived. Adapters for pytest/jest/eslint/tsc.
- **claude-skills** (active, open source) — collection of Claude Code skills, plugins, and agent tooling: iOS build loops, PM automation, prompt refinement.
- **sift** (active, Python, open source) — weekly AI-news pipeline: RSS ingestion, local dedup, one Claude call to curate into an HTML digest + Pages archive.
- **memekit** (recently-active, TypeScript) — deterministic ASCII meme reactions for CLIs/bots/agents; library + CLI + MCP server, zero deps.

**Foundation:**
- **design-system** (active, private) — cross-product design tokens: one source emitting CSS custom properties, SwiftUI tokens, Tailwind presets for all my apps and sites.

**In the forge (coming):** personal financial adviser, more personal-infrastructure tools — the theme: build my own tools instead of renting mediocre ones.

Private projects show these curated blurbs and status only — no code links; public ones link to GitHub.

### About (short)
Solo builder. I design, build, test, and ship end-to-end — apps, tooling, sites. Privacy-first is a conviction, not a feature flag: my apps run on-device with zero telemetry.

### Footer
GitHub · LinkedIn · email. Small "forged in the Foundry" mark.

## Deliverable

A **high-fidelity, single-file interactive prototype** — real working code (HTML + Three.js, or React), not a static image. It must actually render the 3D hero and all sections so I can feel the design, scroll it, and judge it on both desktop and mobile widths. This is the design phase: production implementation happens later in my repo, so don't worry about build tooling, multi-file structure, or CI — spend everything on visual direction, the 3D scene, typography, and motion.

Alongside the prototype, explain your design decisions: palette + type choices, how the foundry metaphor is expressed, how the 3D scene degrades on fallback, and what you'd recommend for the production stack (Vite vs Astro, vanilla Three.js vs React Three Fiber) given the performance budget above.

I'll iterate on variants here until the direction is locked, then hand the winner to Claude Code to build the production site (scaffold, code-splitting, compressed assets, GitHub Pages CI).
