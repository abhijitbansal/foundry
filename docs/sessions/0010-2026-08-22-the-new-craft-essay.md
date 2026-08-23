# Session 0010 — 2026-08-22 — The New Craft: /craft/ essay page

**Branch:** `feat/craft-page` · **Session:** `session_01KH2tRkQ9hRThsBqat5B8AG` (foundry-new-age-AI-engineer-m4pro)

## Achieved

- **Brainstorm → canvas → build pipeline** for a new editorial page, `/craft/` ("The New Craft"): the thesis that code is the smallest part of the job and the durable skills are a people-manager's — you run a team that happens to be made of agents.
- **Content design** (`.scratch/craft-brainstorm.md`): three acts + coda (Direct: first principles, owning the outcome · Delegate: org design, harness engineering, agents' limits · Verify: curiosity to challenge, tester's mindset, security as risk ownership · Coda: team upgrades every quarter). Wholly original taxonomy — deliberately no numbered-skills-list shape, no attribution footprint (user decision).
- **Design canvas** (Claude Design artifact "The New Craft", 4 artboards: desktop light, phone, figure close-up, dark hero) — approved, then upgraded with nine per-skill ink vignettes + the room-is-the-harness org chart.
- **Implementation:** `src/pages/craft.astro` + `src/components/craft/` (Hero, Act, Figure, Coda, FooterCTA) + `src/lib/craft-svg.ts` / `craft-content.ts` (build-time string builders, all colors via `--ds-*`), nav link, `.craft-*` layout classes in global.css. Brand: `brand-skills` cyan (editorial lane shared with /harness/).
- **Design-tuning gate** (design-router → impeccable critique, dual-agent: Opus review 19/32 + detector/browser evidence): fixed 68ch essay measure, margin-rail contrast/placement/labels, hero rag + act-list anchors + byline/evidence tile, `--ds-amber-ink` token (dark #C89B3C) pinning figure amber near ink weight, fullscreen machinery on the room figure, footer CTA promotion + path to work. Snapshot in `.impeccable/critique/`.
- **Code review** (ten finder angles; nine sets landed): fixed the reveal×fullscreen interaction bugs (data-reveal moved off the figure node — invisible-modal + zoom no-op), coda vignette viewBox clipping (translate −10), single-tab strip gated in `harness-fullscreen.ts`, shared `FullscreenOverlay.astro` extracted (used by both pages), `CRAFT_ACTS` readonly const, `.craft-skill-body`/`.craft-margin-note` classes, `buildRoom` split, `tests/unit/craft.test.ts` (6 tests).
- Gates green throughout: `npm run build`, `npm test` (109), in-browser verification (light/dark/mobile screenshots; live fullscreen zoom check; harness page unregressed 5 tabs).

## Decisions

- `/craft/` reuses `brand-skills` — no new brand palette minted; a `--ds-amber-ink` figure-weight amber was added to `brand-skills` in `brands.css` instead (dark UI `--ds-secondary` flips figure/ground in line art).
- Fullscreen tab strip renders only when `figures.length > 1`; the `#harness-fs-tabs` markup must stay (module bails without it).
- Manager-lens marginalia is the page's signature: one "The manager's margin" label per act, notes in `.craft-margin-note`, vignette above note.
- Design mock findings from the impeccable hook on `.scratch/craft-canvas/*.dc.html` (Inter/Instrument Serif "overused-font" etc.) are classified false positives — the mocks reproduce the House DS by requirement.

## Follow-ups

- Unify svg token/builder sources: craft-svg's local consts vs `harness-svg-primitives.ts` `C` (note `C.paper` = surface, craft's PAPER = bg — naming mismatch to resolve first); consider `C.gold` → `--ds-amber-ink` canonicalization (touches works-svg, telemetry too).
- `harness-fs-*` ids/classes are now shared by two pages under a harness-branded name — rename to neutral `fs-*` when a third consumer appears.
- Figure-card wrapper pattern now has 4 inline copies (3 harness + craft) — extraction candidate.
- Homepage `CraftPromo` teaser (HarnessPromo sibling) — user decision pending; page currently reachable only via nav.
- Optional editorial: sticky act indicator / progress affordance on the 5,000px read; per-claim evidence links for the skeptical-reader persona.
- finder-A and finder-efficiency review sets were lost to the finder-routing failure — re-run those two angles if paranoia warrants.
- LinkedIn post for the page: next phase (`/linkedin-post`), planned from the start.

## Resume pointer

Branch `feat/craft-page`, 4 commits (`3c70636`, `979109f`, `080b01e`, `73032df`), all gates green; PR opening + branch-end checklist happen at the end of this session. Canvas artifact: "The New Craft" (claude.ai/code/artifact/ae71b4cb-…). Brainstorm + working mock files in `.scratch/craft-canvas/`.

## Models

- Orchestrator/design: Fable 5 (planner tier, per AGENTS.md "Fable designs").
- Critique assessment A: Opus · assessment B + initial (stalled, killed) builder: Sonnet. Build was redone inline at planner tier after the executor dispatch stalled 46 min with no output — deviation from "Sonnet builds", logged with cause (stall + user instruction to redo).
- Review: /code-review at high → ten Sonnet finders; aggregation/verification pulled back into the main session after finder→fork routing failed.
