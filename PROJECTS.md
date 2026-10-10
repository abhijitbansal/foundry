# Projects inventory

Source material for Foundry's project pages. One entry per repo under `github.com/abhijitbansal`. Regenerate when repos change (sweep via `gh repo list` + per-repo README summarization).

**Last updated:** 2026-10-10

## Apps (iOS / macOS / browser)

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

### purix — `active` · private repo · public site
Browser extension that strips tracking parameters from links entirely on-device, with no network calls. Blocklist-only with a hard keep-list, so it never guesses and never breaks a page; cleans links on navigation, on click, on copy, and from a context-menu item. One shared rule set across Chrome, Firefox, and Safari (macOS + iOS). Pre-launch — no store listings yet.
Tech: TypeScript, cross-browser WebExtension · [repo](https://github.com/abhijitbansal/purix) · site: abhijitbansal.github.io/purix

## AI / agent tooling

### raja — `heating-up` · private
Local iMessage assistant that runs on an always-on Mac. Claude drafts replies in headless mode with no tools; deterministic code decides who may receive a message and does every send. Allowlisted contacts get answers on their own when every gate rule passes; everything else, anything risky, and anything about buying or paying goes to the owner as a draft to approve, skip, or rewrite. Scans every inbound message for prompt injection before drafting, and learns the owner's voice from past replies and edits. v1 built, pending device testing.
Tech: TypeScript, Bun, Claude Code headless, SQLite, launchd · [repo](https://github.com/abhijitbansal/raja)

### swatkats — `early` · private
Local-first decision tool: drop a spreadsheet, paste text, or name a Jira epic and get typed decisions back — fill a column by choosing, scoring, or answering yes/no with a per-row confidence, or judge whether an epic is ready or done. Local models via Ollama by default; cloud CLIs and OpenAI-compatible APIs opt-in. Design spec and feasibility spike done; build not started.
Tech: Python, uv, Ollama, MCP · [repo](https://github.com/abhijitbansal/swatkats)

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

### orca-local — `active` · public · fork
Local-only fork of [stablyai/orca](https://github.com/stablyai/orca), the desktop app for running coding agents side by side in parallel worktrees. The fork strips cloud accounts, auto-update, telemetry upload, remote servers, and every network listener, and ships its own signed macOS releases. Mostly upstream's work — listed on the site as a card only, never a yard building (kept off `PROJECTS_ALLOWLIST`).
Tech: TypeScript, Electron · [repo](https://github.com/abhijitbansal/orca-local)

## Web / sites

### foundry — `active` · public
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
