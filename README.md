# Foundry

Personal portfolio website for **Abhijit Bansal** — the place where all my projects are forged and shown. Live at [abhijitbansal.com](https://abhijitbansal.com).

## Vision

A 3D-heavy, visually striking site that:

- **Showcases every project** — public and private — with current status, a short story of what it is, and links (repo, live site, App Store where applicable). Private projects show curated information, not their code.
- **Shows expertise** — the domains I build in: iOS apps (Swift 6 / SwiftUI), AI agent tooling, CLI tools, web.
- **Is the link I share** — on LinkedIn and elsewhere, one URL that tells the whole story.
- **Leans into 3D rendering** — WebGL/Three.js-class visuals, not a template portfolio. Generative design assets via Higgsfield where they raise the bar.

## Current state

**Live.** Astro (static output) + TypeScript, deployed to GitHub Pages on a custom domain. Three.js drives the 3D work-yard visualization; everything else is dependency-free build-time SVG/TS — the one exception is a single React island (`@astrojs/react`, scoped to the harness page's interactive routing diagram, see [AGENTS.md](./AGENTS.md)'s Stack row).

Pages:

- `/` — hero, expertise, work (project cards from [PROJECTS.md](./PROJECTS.md)), forge telemetry (parsed from local Claude Code session logs), about, footer.
- `/updates/` — weekly digest archive, newest-first, generated every Monday by `scripts/weekly/run_weekly.sh` (see `docs/automation/weekly-pipeline.md`).
- `/harness/` — a showcase of the Claude Code harness that runs this repo (and, as a case study, the private `cubby` repo): routing, hook lifecycle, dev-tracker, the CLAUDE.md/AGENTS.md story, the enabled arsenal, and a self-audit score. Has its own three-layer easter egg for anyone (human or agent) who reads the page source.

Session-log history of how the site got built lives in `docs/sessions/` (index: `docs/sessions/README.md`).

## Repo map

| File | Purpose |
|---|---|
| [PROJECTS.md](./PROJECTS.md) | Inventory of all my repos — status + what each one is. Source material for the site's project pages. |
| [AGENTS.md](./AGENTS.md) | Engineering conventions for humans and AI agents — model routing (Fable designs, Sonnet builds), workflow, session logs, locked stack/deploy decisions. |
| `src/pages/` | Astro routes — one file per page. |
| `src/components/` | Page sections and reusable UI, organized by feature (e.g. `src/components/harness/`). |
| `src/lib/` | Build-time logic: SVG generators, stats/telemetry parsing, theme, easter-egg runtime. |
| `data/` | Generated/committed data snapshots (`stats.json`, `weekly/*.json`) consumed at build time. |
| `docs/design/handoff/` | Design-reference material (HTML/JSX mockups) each feature was built against — kept for provenance, not shipped. |
| `docs/sessions/` | One markdown file per AI coding session that made commits — what shipped, why, and where to resume. |
| `docs/plans/` | Multi-phase implementation plans written before larger features. |
| `docs/automation/` | How the scheduled jobs (weekly digest) work and how to debug them. |
| `.scratch/` | Gitignored working area for generated artifacts (test checklists, etc.). |

## Local development

```sh
npm install
npm run dev       # dev server with HMR
npm run build     # static build to dist/
npm run preview   # serve the built output locally
npm test          # vitest unit tests (tests/unit/)
```

## Process

Solo dev, no co-reviewers — see [AGENTS.md](./AGENTS.md) for the full engineering playbook: branch/commit strategy, model-tier routing for AI-assisted work, and the session-log convention.
