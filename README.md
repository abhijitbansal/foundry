# Foundry

Personal portfolio website for **Abhijit Bansal** — the place where all my projects are forged and shown.

## Vision

A 3D-heavy, visually striking site that:

- **Showcases every project** — public and private — with current status, a short story of what it is, and links (repo, live site, App Store where applicable). Private projects show curated information, not their code.
- **Shows expertise** — the domains I build in: iOS apps (Swift 6 / SwiftUI), AI agent tooling, CLI tools, web.
- **Is the link I share** — on LinkedIn and elsewhere, one URL that tells the whole story.
- **Leans into 3D rendering** — WebGL/Three.js-class visuals, not a template portfolio. Generative design assets via Higgsfield where they raise the bar.

## Current state

**Scaffold only — the site is not built yet.** Design phase comes first (see [AGENTS.md](./AGENTS.md) for the design→build process). The stack is deliberately undecided until design direction is locked.

## Repo map

| File | Purpose |
|---|---|
| [PROJECTS.md](./PROJECTS.md) | Inventory of all my repos — status + what each one is. Source material for the site's project pages. |
| [AGENTS.md](./AGENTS.md) | Engineering conventions for humans and AI agents — model routing (Fable designs, Sonnet builds), workflow, session logs. |
| `.scratch/` | Gitignored working area for generated artifacts. |

## Process

1. **Design first** — visual direction, information architecture, 3D concepts (planner-tier model, Higgsfield for asset exploration).
2. **Then build** — executor-tier implementation against the locked design.
3. Deploy target: TBD (GitHub Pages / Vercel / Netlify decided with the stack).
