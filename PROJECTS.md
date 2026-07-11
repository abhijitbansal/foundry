# Projects inventory

Source material for Foundry's project pages. One entry per repo under `github.com/abhijitbansal`. Regenerate when repos change (sweep via `gh repo list` + per-repo README summarization).

**Last updated:** 2026-07-11

## Apps (iOS / macOS)

### cubby — `active` · private
iOS app for inventorying items stored in bins with NFC tags and QR codes. On-device Vision ML identifies items, append-only scan audit log, optional iCloud sync, Siri shortcuts, widgets, 3D rack view — privacy-first, zero server backend, zero third-party dependencies.
Tech: Swift 6, SwiftUI, SwiftData, Vision, CoreNFC, WidgetKit, RealityKit · [repo](https://github.com/abhijitbansal/cubby) · site: gotcubby.com

### doc-scan (Paperix) — `active` · private
iOS document scanner: captures multi-page documents via camera, generates searchable PDFs with on-device OCR (Vision). Everything stays on-device by default — no cloud, no accounts, optional iCloud sync. The "stop paying for shitty PDF scanners" app.
Tech: Swift, SwiftUI, Vision OCR · [repo](https://github.com/abhijitbansal/doc-scan)

### floorprint — `active` · private
iOS + macOS app that scans rooms with RoomPlan/LiDAR and generates editable 2D floor plans with annotation and multi-format export (PDF, DXF, USDZ, GLB, STEP). Companion macOS mini-CAD editor for building plans from scratch. Organize the whole home, in 3D.
Tech: Swift, SwiftUI, RoomPlan, SceneKit · [repo](https://github.com/abhijitbansal/floorprint)

### folix — `active` · private
Privacy-first personal wealth-tracking dashboard for macOS. Pulls portfolio data locally from Wealthfront via Plaid (bring-your-own-keys), stores everything on-device, AI-augmented insights. Seed of the "own financial adviser" project.
Tech: Swift, SwiftUI, GRDB, Plaid API, MCP server · [repo](https://github.com/abhijitbansal/folix)

## AI / agent tooling

### claude-skills — `active` · public
Unified collection of AI agent skills, plugins, and tools for Claude Code and AGENTS.md-aware platforms: iOS build-and-screenshot loops, Linear automation, usage-limit-aware orchestration, prompt refinement. Installable via marketplace or standalone CLI.
Tech: Python, Shell · [repo](https://github.com/abhijitbansal/claude-skills)

### cartoon — `active` · public
Token-optimized output wrapper for any CLI — an AI agent reads 12 lines instead of 800, raw log always archived. Adapters for pytest/jest/vitest/ruff/eslint/tsc plus a compression ladder for everything else; ~70% token reduction.
Tech: Rust · [repo](https://github.com/abhijitbansal/cartoon)

### memekit — `recently-active` · private
Deterministic dev-culture meme reactions as ASCII art for CLIs, bots, and AI agents. 45 original formats (build failures, merge conflicts, prod incidents), zero dependencies. Library + CLI + MCP server.
Tech: TypeScript · [repo](https://github.com/abhijitbansal/memekit)

### sift — `active` · public
Weekly AI-news curation pipeline: fetches RSS/Atom feeds, deduplicates locally, one Claude API call merges/categorizes/scores/summarizes into an HTML digest. Optional email delivery + browsable GitHub Pages archive with live dashboard.
Tech: Python, uv, Claude API, SQLite · [repo](https://github.com/abhijitbansal/sift)

## Web / sites

### foundry — `active` · private
This repo — the portfolio website itself.

### design-system — `active` · private
Cross-product design system: canonical token source (colors, typography, spacing) with per-product accent overrides for Paperix, Floorprint, Cartoon, claude-skills. Emits CSS custom properties, SwiftUI tokens, Tailwind presets, live preview.
Tech: JSON design tokens, CSS, Swift, Tailwind · [repo](https://github.com/abhijitbansal/design-system)

### cubby-site — `active` · public · companion site
Static marketing site for Cubby (landing, privacy, support) plus the AASA file powering Universal Links. Deployed from the cubby repo's `site/` subtree.
Tech: static HTML/CSS, GitHub Pages · [repo](https://github.com/abhijitbansal/cubby-site)

### paperix-site — `active` · public · companion site
Static GitHub Pages marketing site for Paperix: landing, privacy policy, support FAQ, device-framed feature showcase.
Tech: HTML/CSS, no build · [repo](https://github.com/abhijitbansal/paperix-site)

### floorprint-site — `companion-site` · public
GitHub Pages site for Floorprint: marketing, features, privacy, support. Auto-deployed from the private app repo.
Tech: HTML/CSS, GitHub Pages · [repo](https://github.com/abhijitbansal/floorprint-site)

## Experiments / paused

### mr_lender — `paused` · private
Local-first mortgage underwriting assistant: automates credit-report analysis, DTI calculation, payoff scenario modeling, contract review for loan officers.
Tech: Python FastAPI, React + TypeScript, SQLite, Ollama/LiteLLM · [repo](https://github.com/abhijitbansal/mr_lender)

### second-wind — `early` · private
Placeholder repo, README only — concept stage.
[repo](https://github.com/abhijitbansal/second-wind)
