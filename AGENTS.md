# AGENTS.md — Foundry conventions

Engineering guide for **Foundry** (Abhijit Bansal's portfolio website), for human contributors and AI coding agents. [`CLAUDE.md`](./CLAUDE.md) imports this file so Claude Code always loads it. User-facing overview: [`README.md`](./README.md).

Foundry is a 3D-heavy personal portfolio site: every project (public + private) with status, story, and links; expertise areas; shared via LinkedIn. Process and model-routing rules below are ported from the Cubby repo's battle-tested AGENTS.md (Part 2 — portable engineering process) and adapted for a website project.

---

## Project decisions

| Decision | Value | Notes |
|---|---|---|
| Stack | **Locked: Astro (static output) + TypeScript.** 3D via Three.js (`src/lib/three`). Default for all new UI: dependency-free build-time SVG/TS string builders (see `works.ts`/`works-svg.ts`, `harness-svg*.ts`) — no client framework unless a component is genuinely stateful and interactive. | **Scoped exception (2026-07-14):** React + `@astrojs/react` are a real dependency for the harness page's one interactive figure (`src/components/harness/RoutingCard.tsx`, `client:visible`) — every other component on the site, including that page's other four figures, stays dependency-free. Don't reach for React elsewhere without the same bar: hand-rolled vanilla JS would cost more than the dependency. |
| Content source | `PROJECTS.md` is the inventory of record for project pages | Regenerate via `gh repo list` sweep when repos change |
| Private repos on the site | Curated descriptions + status only — **never code, secrets, or repo internals** | Reviewed before publish. **Scoped exception (2026-07-14):** the `/harness/` page's Paper section + easter egg quote verbatim internals of the private `cubby` repo (size, doc structure, policy text) as its deliberate subject — a public case study of Cubby's own engineering harness, not an incidental leak. User-approved; the "reviewed before publish" checkpoint for this page specifically. |
| Design assets | Generative exploration via **Higgsfield MCP** (see below); curated finals committed under `assets/` | Raw generations stay in gitignored `.assets-inbox/` |
| Deploy | **Locked: GitHub Pages, custom domain** (`abhijitbansal.com`, via `public/CNAME`) | Static `astro build` output, no server runtime |

## Design → build model routing

The core lesson imported from Cubby: **route by tier, decide routing at plan time, never let both knobs (model + effort) inherit implicitly.**

> **Current tier mapping (edit me, not the rules):** planner/design tier = **Fable/Opus** · executor tier = **Sonnet** · chore tier = **Haiku**.

- **Fable designs; Sonnet builds.** All design work — visual direction, information architecture, 3D concept, stack selection, plan authoring, adversarial review/judging — runs at planner tier, high–xhigh effort. Implementation of a locked design runs at executor tier, medium–high. Inventory sweeps, digests, checklist generation run at chore tier, low.
- **Routing is decided at plan-writing time, task-by-task.** Plan header declares the default executor tier; tasks tag only divergences. Executors never re-route themselves.
- **Escalation is orchestrator-owned, effort before tier:** escalate when the identical diagnostic survives two materially different fix strategies, on a framework-level anomaly, or when a task turns out to amend a locked decision. Bump effort one step first, then tier. Log both with cause.
- **Never dispatch with both knobs implicit** — an unset knob inherits the orchestrator's top-tier/high-effort, pure waste on mechanical work.
- **Caching etiquette:** subagents don't share the session prompt cache — anchor `file:line`, never re-paste repo code; continue warm agents via SendMessage instead of respawning; schema every data-returning dispatch.

## Orchestration modes

Pick the cheapest mode that fits the task shape — escalate the mode, not by default:

| Mode | When |
|---|---|
| **Solo** | Single-file fixes, conversational turns, copy tweaks |
| **Single agent dispatch** | One bounded delegation: a search, a focused review, a doc lookup |
| **Workflow** | Deterministic fan-out over a known work-list (e.g. per-repo inventory sweep); find→verify pipelines; schema-validated aggregation |
| **Agent team** | Long-lived roles needing cross-talk across phases |

A standing ultracode/session directive authorizes orchestration; it does not mandate the heaviest mode. Verification-heavy work (audits, reviews, research) defaults to Workflow with adversarial verify.

## Agent behavior

- **Surgical changes only.** Touch only what the task requires — no drive-by reformatting or restructuring. If your change orphans an import/variable/helper, remove it; pre-existing dead code gets flagged, not deleted.
- **Think before coding; surface tradeoffs on anything touching a locked decision** — never quietly pick the expedient path. State assumptions; present competing interpretations.
- **Simplicity first.** Minimum code that solves the problem. No speculative abstractions.
- **Goal-driven execution.** Convert tasks to testable success criteria; loop until verified.

## Branch & commit strategy

Solo developer, no human co-reviewers. Simpler than Cubby's wave workflow (no device-test gate here) but same spine:

- **Never commit work directly to `main`** (single exception: the initial repo bootstrap commit). Feature work = short-lived branch → PR → merge → delete branch.
- **One branch per session, not a stack of small PRs.** Solo dev, no co-reviewers — reviewing five tiny stacked PRs in sequence is pure overhead compared to one branch with several atomic commits. When a session spans multiple phases/tasks, keep them all on the single branch that session started (rename/consolidate onto one branch if a session accidentally splits into several) and open one PR at the end covering the whole session's work. This does not relax the "atomic commits" rule below — many small commits on one branch is exactly right; many small *branches/PRs* is not.
- **Commits are task-level and atomic** — conventional format (`feat:`, `fix:`, `docs:`, `chore:`, …), one logical change each. No history rewriting.
- **Gates before push:** build/lint green → tests green (once a stack exists) → reviewer pass on the diff (e.g. `/code-review`) with no CRITICAL/HIGH unfixed.
- Multi-phase work (2+ dependent phases) gets a plan doc in `docs/plans/` first; the plan's task structure is authoritative.
- Branch-end manual-test checklist (interactive HTML, per global rules) goes in `.scratch/` — this repo has no committed-checklist mandate.

## Session logs

Every AI coding session that makes commits logs to **`docs/sessions/`** (one markdown file per session, `docs/sessions/README.md` is index + counter) — same template and rules as Cubby: checkpoint at phase boundaries and session end with **Achieved / Decisions / Follow-ups / Resume pointer / Models**. Read the latest log before resuming stale work. Log commits are separate `docs:` commits after the work they describe. A decision that constrains future sessions gets folded into this file — a decision living only in a session log is session-local by definition.

## SVG figures & fullscreen/modal overlays

Learned the hard way (session 6, harness page) — three CSS traps that will bite again the moment a new figure or overlay is added:

- **`--ds-accent`/`--ds-secondary`/etc. are brand-scoped** (`.brand-skills` and friends in `tokens/brands.css`), not set at `:root` — `:root`'s own default is Paperix red. Any fixed/portal-style overlay that isn't a DOM descendant of the page's `.brand-*` wrapper needs that class added explicitly, or every accent-colored element inside it silently renders the wrong brand's color.
- **A `viewBox`-only `<svg>` (no `width`/`height` attributes) has no intrinsic size.** Giving it `width:auto` inside a shrink-to-fit parent (or capping it with a *percentage* `max-width`/`max-height` relative to that same parent) is a circular size dependency — verified in-browser that Chrome resolves it by collapsing both to 0×0, not by falling back to any default. Fix: give the wrapper a definite width (viewport units or px, not `%`, not `auto`), then leave the svg's own `width:100%;height:auto` alone — it resolves against that definite width the same way it already does in every non-modal embed on this site.
- **`transform:scale()` on an svg doesn't push down HTML that follows it in document flow.** Zooming only the `<svg>` inside a card that also has trailing caption/paragraph content visibly overlaps that text. Scale the whole card (wrapper), not the svg alone.

## Higgsfield / generative design assets

- Higgsfield is a **design-exploration tool, not a runtime dependency** — the shipped site never calls generative APIs at runtime.
- Raw generations land in gitignored `.assets-inbox/`; only curated, optimized finals are committed under `assets/` (with compression appropriate for web — no multi-MB hero images).
- MCP: the **official hosted Higgsfield MCP server** is registered project-scoped in `.mcp.json` (`https://mcp.higgsfield.ai/mcp`, streamable HTTP). Auth is **OAuth** — first use opens a browser to sign into the Higgsfield account (`/mcp` in Claude Code to authenticate); no API key in the repo or env. Billing is credit-based against the Higgsfield plan.
- Capability note: Higgsfield outputs **2D cinematic images/video (4K image gen, image-to-video, upscale, reframe)** — no exportable 3D meshes. For real 3D geometry (glTF/mesh generation), the candidates are fal.ai or Replicate MCPs (TripoSR/Hunyuan3D-class models) — add only when design phase actually needs them.

## Security & content rules

- No secrets in the repo, ever (`.env` gitignored; `.env.example` documents required vars).
- The site describes private projects — **review every private-project blurb before publish**: no internal URLs, no credentials, no business-sensitive detail.
- No analytics/telemetry beyond privacy-respecting basics if ever added — decide explicitly, record here.
