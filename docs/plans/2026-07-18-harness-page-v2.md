# The Harness page — v2 delta update implementation plan

Source docs: cubby's `docs/harness/{ARCHITECTURE.md,EVALUATION.md,harness-explainer.html}` + `AGENTS.md`, all touched in the 2026-07-18 s56/s57 wave (commits `8a47490`, `6e26954`) — the point-in-time snapshot the current foundry `/harness/` page depicts is 2026-07-12/07-13 (session 6, launched 07-15). This plan updates the existing page to reflect what's new since, marks net-new content as **v2**, and adds one new bottom section that shows the v1→v2 delta honestly — no rebuild, no re-score, no new figure. Executor tier (**Sonnet**), medium–high effort: the design decisions below are already made and defended, this is a content-mapping + additive-component build. The two sub-decisions that touch locked geometry or a locked content-exception (§3.4 figure-adjacent marks, §2 the new section's placement) are pre-resolved here at plan-authoring time so no executor re-routes to planner tier mid-build.

## Global constraints (from AGENTS.md + session-6 learnings — do not violate)

- **Zero client framework except the one scoped React island** (`RoutingCard.tsx`). The new section and every v2 mark are dependency-free Astro/HTML + existing CSS tokens. No new React, no new SVG-string builder unless a phase explicitly calls for one (none does).
- **Existing figure geometry is locked.** `harness-svg.ts` / `harness-svg-primitives.ts` headers say "collision-tuned … do not re-layout"; `TEXT_BUMP = 0` is pinned (a flat font bump overflowed the Tracker boxes — `harness-svg-primitives.ts:44-54`). Any change to an existing figure must be **additive** (a pip in verified-empty whitespace) or copy-only — never a coordinate re-layout, never a chip-width or note-anchor change. The default in this plan is to touch **zero SVG bytes**; the one optional in-figure mark (§4.2) is browser-verify-gated and recommended against.
- **Three CSS traps** (foundry AGENTS.md "SVG figures & fullscreen/modal overlays"): (1) `--ds-*` tokens are brand-scoped to `.brand-skills`, not `:root` — the new section is a DOM descendant of `<main class="brand-skills">` so it inherits correctly, but any fixed/portal element would need the class explicitly (none added here); (2) a `viewBox`-only `<svg>` has no intrinsic size — N/A, no new figure; (3) `transform:scale()` on an svg doesn't push trailing HTML — N/A.
- **No live runtime data.** Static output, no server, no client fetch. Volatile stats are extracted to a **build-time** checked-in module (`src/data/harness.ts`), refreshed by hand from the private cubby source — never fetched at runtime. The full script-driven pipeline is explicitly **deferred** (§4.1, with reasoning).
- **Private-repo content review.** New verbatim cubby content (AGENTS.md byte/line refresh, the 11 delta items, the ARCHITECTURE banner counts) is the same category — curated, non-secret, process/rules text — already vetted under the Paper-section exception. No new approval gate; the "reviewed before publish" checkpoint still applies to the diff.
- **Scope of "v2": a scoped label on new/changed content, not a page relaunch.** The page's spine (routing tiers, orchestration modes, hooks lifecycle, dev-tracker, learning loop) is unchanged by the s56/s57 wave — it's refinements, one retirement, one closed investigation. Re-titling the whole page "v2" would over-claim a rebuild that didn't happen and break the URL/identity a launched, LinkedIn-shared page has earned. So: the page stays "The Harness"; **v2** is a chip on the handful of things that moved, plus one new closing section that carries the delta.

## File structure

- `src/data/harness.ts` (**new**) — typed model + the delta dataset (11 items) + volatile scalars (score, counts, AGENTS.md size/lines, dates). Single edit-point for future re-scores; the lightweight in-scope half of the deferred data-pipeline.
- `src/data/harness.types.ts` (**new**) — `DeltaItem`, `DeltaBadge`, `HarnessScalars` types.
- `src/components/harness/HarnessDelta.astro` (**new**) — section "07 · The retool", the delta card grid.
- `tests/unit/harness-data.test.ts` (**new**) — shape/enum guards on the delta data (mirrors `tests/unit/weekly.test.ts` style).
- `src/pages/harness.astro` (**edit**) — import + place `<HarnessDelta />` between `<HarnessScore />` and `<HarnessFooterCTA />`.
- `src/components/harness/HarnessPaper.astro` (**edit**) — AGENTS.md size/lines refresh + v2 chip.
- `src/components/harness/HarnessArsenal.astro` (**edit**) — plugin count 13→17 (sample rewording), time-relative wording → dated, s56/v2 chips.
- `src/components/harness/HarnessScore.astro` (**edit**) — delta pointer chip; numbers unchanged.
- `src/components/harness/HarnessLifecycle.astro` (**edit**) — appended s56 clause on the "honest line" callout (figure-adjacent v2 mark, zero SVG bytes).
- `src/components/harness/HarnessTracker.astro` (**edit**) — appended tracker-hygiene note beside the Ledger figure (figure-adjacent v2 mark, zero SVG bytes, same pattern as Lifecycle).
- `src/styles/tokens/components.css` (**edit**) — one `.ds-chip--warn` modifier; reuse `.ds-chip` / `.ds-chip--accent` for everything else.

---

## Phase 1 — Data model + the v2 marking vocabulary

### Task 1.1: `src/data/harness.ts` + `harness.types.ts`

Extract the page's volatile scalars into one typed module so the *next* re-score touches one file, not seven — and so section 07's data isn't hardcoded in markup. This is the in-scope, no-script half of the data-architecture idea (the full pipeline is deferred, §4.1). Types:

```ts
export type DeltaBadge = 'NEW' | 'RULE' | 'APPLIED' | 'RETIRED' | 'CLOSED' | 'CHANGED' | 'NOTE';
export interface DeltaItem {
  badge: DeltaBadge;
  wave: 's56' | 's57' | 's45→s56';   // provenance tag rendered as a micro
  title: string;                       // punchy, ≤ ~52 chars
  body: string;                        // 1–2 sentences, the "why", names the incident/mechanism
  ref?: string;                        // optional file/hook name in mono, e.g. 'bash-guard.sh'
}
export interface HarnessScalars {
  score: number;                 // 79 — unchanged, DO NOT invent a new one
  scorePrev: number;             // 73
  scoreAsOf: string;             // '2026-07-12' (event date, not "current as of")
  agentsKb: string;              // '67.3 KB'  (was 51 KB)
  agentsLines: number;           // 332        (was 305)
  plugins: number;               // 17         (was 13)
  skills: number;                // 114
  agents: number;                // 81
  hooks: number;                 // 43
  skillsInstalled: string;       // '~360+'
  deltaWaveDate: string;         // '2026-07-18'
}
```

`harness.ts` exports one `SCALARS: HarnessScalars` const and one `DELTA_ITEMS: DeltaItem[]` (the 11 items, authored in Task 2.2). Keep it pure data — no functions, no `window`. Scalars carry a comment block citing the source: `// Refreshed by hand from cubby docs/harness + AGENTS.md, s56/s57 wave 2026-07-18. Private repo — see AGENTS.md content-exception. No runtime fetch.` Only migrate the scalars that section 07 or the factual-refresh phase actually reads — do **not** re-plumb every string on the page through this module (that's a large diff touching verbatim-from-dc.html copy the components deliberately hold inline; YAGNI).

### Task 1.2: v2 badge vocabulary (CSS)

Borrow `harness-explainer.html`'s changelog badge register (NEW / FIXED / RULE / APPLIED / REVERTED) and adapt to this delta's actual shapes: **NEW · RULE · APPLIED · RETIRED · CLOSED · CHANGED · NOTE**. Do **not** invent a `.ds-badge` class family — `.ds-chip` (`components.css:76-94`) already gives the exact mono/uppercase/pill treatment; reuse it with three semantic weights:

- **accent** (`.ds-chip--accent`, exists): things *added* — NEW, RULE, APPLIED.
- **warn** (`.ds-chip--warn`, **new, one small block**): things *removed or declined* — RETIRED, CLOSED. Mirror `.ds-chip--accent`'s shape exactly, swapping color/border/background to the warning token: `color: var(--ds-warning); border-color: color-mix(in srgb, var(--ds-warning) 55%, transparent); background: color-mix(in srgb, var(--ds-warning) 10%, transparent);`.
- **neutral** (`.ds-chip`, exists): CHANGED, NOTE — the muted default.

The badge word is the chip text; the color is the semantic weight (so RETIRED and CLOSED both read "warn", NEW/RULE/APPLIED all read "accent"). This keeps the new CSS to a single modifier and stays DRY. The "v2" and "s56"/"s57" marks used on *existing* sections (Phase 3) reuse `.ds-chip--accent` (v2, additive) and plain `.ds-chip` (wave tag) — no further CSS.

---

## Phase 2 — Section 07: the retool (the primary ask)

**Decision — HTML card grid, no new SVG figure.** Defended: (a) a delta is a list of discrete, text-heavy items — it *reads* as cards, which is exactly how the source `harness-explainer.html` renders its own changelog; (b) a new isometric figure would need its own collision-tuned geometry, a fullscreen tab, and to clear all three CSS traps — planner-tier design work wildly disproportionate to a content update; (c) the page already alternates figure and figure-less sections — Paper (04) and Arsenal (05) carry no figure, so a figure-less 07 is idiomatic, not a gap. A figure-less section also correctly gets **no** `data-harness-figure` attribute, so the generic fullscreen discovery (`harness-fullscreen.ts`) skips it automatically — no script change, consistent with Paper/Arsenal.

**Decision — title "07 · The retool."** The section titles are single industrial nouns ("switchyard / conveyor / ledger / paper / arsenal / audit"); "the delta" (the brief's working name) is accurate but breaks the metaphor. *Retool* = re-fitting the line between pours — the industrial word for exactly this. h2 carries the honesty move; kicker carries the number. (If the executor finds "retool" reads obscure in-browser, the sanctioned fallback is the plain "07 · The delta" — but retool is the recommendation.)

### Task 2.1: `HarnessDelta.astro` — shell, framing, honest ownership

Structure mirrors the other figure-less sections (`HarnessArsenal.astro:7-14` as the template): `<section id="harness-delta" data-screen-label="07 Retool" style="scroll-margin-top:72px">`, inner `max-width:1200px` wrapper with the same `clamp(64px,9vw,110px)…` padding rhythm, then kicker/h2/lead/rule header:

- kicker: `07 · The retool`
- h2 (`ds-display-lg`): **"What changed since — without re-grading our own homework."**
- lead (`ds-lead`, max-60ch): the "no new number" framing, lifted straight from the source docs' own stance so it's honest, not evasive — *"The audit above still reads 79. Six days of hardening later, the source docs deliberately decline a fresh score — EVALUATION.md's own note treats 79 as stale until an independent re-run, and the s56 addendum records status deltas only, not a new grade. So this is the honest version of a changelog: what moved, what got retired, what got turned down — no self-assigned number attached."*
- Then a short **ownership callout** (`ds-callout`, the same class the Lifecycle "honest line" uses), placed right under the rule, that names the locked-figure mismatch before a reader can catch it: *"The conveyor up in 02 still draws the v1 guards, the ledger in 03 still shows the 07-13 backlog snapshot, and the loop in 06 still shows the metrics observer — those figures are frozen at the point they were drawn. Here's what the drawings don't yet show."* This turns the locked-geometry constraint into the section's credibility instead of a silent contradiction — the same move the page already makes with "79/100, and what that number hides."

Add `data-reveal` on the section (or its header block) to match the `initReveals()` entrance the other sections use (`harness.astro:82`), keeping the scroll rhythm contiguous.

### Task 2.2: the delta card grid — the 11 items

A responsive grid, same idiom as Arsenal's (`grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr));gap:clamp(18px,3vw,36px)`). Each item is an `<article>` with a top hairline (`border-top:1px solid var(--ds-line);padding-top:20px`) matching Arsenal's cards, containing: a header row with the **badge chip** (Task 1.2 weight) + a right-aligned wave micro (`s56`/`s57`, `ds-micro` in `--ds-text-3`); an h3 (`ds-title`) title; a `ds-caption`/`ds-body-sm` body in `--ds-text-2`; and where present, the `ref` in a `ds-code`. Author the 11 items into `DELTA_ITEMS` (Task 1.1), each cross-checked against the source so the "why" names the real incident:

1. **NEW · s56** — *"A commit-on-main reminder that knows when to shut up."* `bash-guard.sh` now block-once-reminds on `git commit` to main/master; an identical retry passes — because `/release` legitimately commits on main. `ref: bash-guard.sh`
2. **NEW · s56** — *"Catches the chained command that silently did nothing."* `guard-push-gate.sh` warns when a chained `add && commit && push` didn't actually run — the s48 silent-commit-loss bug class, now caught. `ref: guard-push-gate.sh`
3. **RULE · s56** — *"Claim your session number before you touch anything."* New protocol: `git fetch origin`, scan `origin/*` for higher session numbers, push the session-log stub as the session's **first** commit — after parallel worktrees raced the naive `max()` counter and collided at least 8 times (AGENTS.md's own count: "≥8 renumber collisions to date"). Ironically the wave that shipped the fix collided too (55→56) — the protocol landed mid-wave, too late for its own claim.
4. **RETIRED · s45→s56** — *"The metrics rig came out; a new anti-pattern went in."* The whole s45 token/metrics-capture hook system was deleted; `HARNESS_METRICS.md` is now a design record for a retired system. It's the canonical example of **"instrument-now-mine-later"** — any new capture system now needs a stated mining plan + decision date before it's built.
5. **CLOSED · s57** — *"A plausible idea, turned down on the record."* A probe confirmed Claude Code's native `paths:` rule frontmatter *does* reach specialist reviewer subagents — but a reviewer flagged the probe rule itself as a prompt-injection vector. Decision: **close** — no migration, no mirroring. The harness catching a good-looking-but-risky idea and declining it.
6. **APPLIED · s56** — *"The repo now carries its own rulebook."* Every Cubby-relevant rule was mirrored from the operator's global `~/.claude/CLAUDE.md` into the project `AGENTS.md` verbatim (each tagged `*(mirrored … s56)*`) — a fresh clone now enforces the full ruleset without depending on a home-directory config.
7. **NEW · s56** — *"Reviews that widen where the risk is."* Wave-end now adds a design-vs-original-brief comparison pass, escalating review rounds for anything touching `@Model`/the save-sync path, and a final review scoped to the whole wave's diff rather than per-phase.
8. **RULE · s56** — *"Two hook facts, now written down."* Hooks must live committed in the repo (a fresh worktree silently loses enforcement — bit session 0013); hook edits don't hot-reload mid-session (bit session 0007).
9. **CHANGED · s56** — *"The arsenal grew and got counted honestly."* ARCHITECTURE.md's banner now reads **17 plugins · 114 skills · 81 agents · 43 hooks** — with the explicit caveat that this is the *enabled* subset of ~360+ installed. Plugins moved 13→17 since this page was built. (Renders the same scalars as the Arsenal refresh in §3.2 — sourced from `SCALARS`, not retyped.)
10. **CHANGED · s56** — *"The backlog got some real housekeeping."* The tracker's archive pipeline was fixed and actually run — 63 stuck items archived, the active ledger down to 649 lines. The Ledger figure in 03 still draws the frozen "27 open · s32–s33 · 2026-07-13" snapshot — the cleanup happened after that drawing was made. `ref: TRACKER.md`
11. **NOTE · s56** — *"Even the source doc has the bug this page warns about."* `harness-explainer.html`'s hero still hardcodes "Updated 2026-07-12 · Score 79/100" while its body carries s56 edits — a datestamp that quietly stopped matching its content. It's the exact staleness trap this section is built to avoid, which is why 07's own copy carries no "current as of" date.

Order: lead with the two guard-hardening items (they pair with the frozen Conveyor the callout just named), then the rules/retirement/closure/hygiene items, end on item 11 (the self-aware note) as the section's mic-drop — same "name your own weakness last" rhythm as the audit's "Still weak" list.

### Task 2.3: wire into the page

In `harness.astro`: `import HarnessDelta from '../components/harness/HarnessDelta.astro';` (after the `HarnessScore` import, line ~26) and place `<HarnessDelta />` between `<HarnessScore />` and `<HarnessFooterCTA />` (`harness.astro:46-47`). Placement rationale: 07 reads as the closing honest beat after the audit, immediately before the CTA — the reader lands on "here's what we fixed since" and then "help me get better," which is the page's whole thesis. No fullscreen-overlay change (no figure). Confirm `data-screen-label="07 Retool"` keeps the section-label sequence contiguous with 01–06.

---

## Phase 3 — Factual refresh + v2 marks on existing sections

Every stale number and time-relative phrase the s56/s57 research contradicts, with exact locations. All reads come from `SCALARS` (Task 1.1) where a component now needs a value, so the number lives in one place.

### Task 3.1: Paper — AGENTS.md size/lines

`HarnessPaper.astro:37` currently reads `51 KB · 305 lines`. Update to `67.3 KB · 332 lines` and append a small `<span class="ds-chip ds-chip--accent">v2</span>` after the micro. The CLAUDE.md "all 8 lines" (`:22`) is unchanged — no mark. The Part-1/Part-2 structure map (`:41-46`) is still accurate at the outline level — leave it; the wave added rules within those buckets, not new buckets, and section 07 carries that detail.

### Task 3.2: Arsenal — plugin count, sample rewording, dated wording

- `HarnessArsenal.astro:19` — `13 on · 4 retired 07-12` → read `SCALARS.plugins` → **`17 on · enabled subset`** (drop the now-unverifiable "4 retired" precise count unless the executor can confirm it from cubby; the retired *names* in the caption at `:36` stay as the documented 07-12 retirements). Add a `ds-chip ds-chip--accent` "v2" beside it.
- **The 13→17 honesty fix (do this, don't skip it):** the chip grid at `:22-34` shows exactly 13 plugin names — if the count says 17 but 13 chips show, the count contradicts what's visible, on the honesty page. The 4 net-new plugin names are **not** in the research and the executor (a foundry agent) likely can't read the private cubby repo. So: **reword the grid to a labeled sample** — add a `ds-micro` "a sample of the enabled set" label above/beside the chips so "17 enabled" is authoritative and the visible chips no longer need to total the count. Do **not** guess or invent 4 plugin names to pad the grid. The nicer-if-available option (pull the 4 real names from cubby `ARCHITECTURE.md` with the operator's help and add them as chips) is a follow-up, not the default path — leave no hook that tempts a guess.
- **Time-relative wording → dated** (the page must pass its own §07 staleness test): `:54` `session-log · tracker <span…>new</span>` and `:66` `Tracker <span…>new this week</span>` are relative phrases that silently age. Change "new" / "new this week" / "new this month" to a fixed marker — `new · 07-12` — so the label states *when*, matching the register's own "every rule traces to a … measured count" ethos. Add a `ds-chip` "s56" only where the item genuinely changed in the wave (the tracker commands are 07-12-era, so they keep the dated `07-12`, not an s56 tag).
- The lead (`:12`) "~360 skills are installed" still matches ARCHITECTURE's `~360+` — keep; optionally read `SCALARS.skillsInstalled` for consistency.

### Task 3.3: Score — keep the number, point to the delta

**No numeric change.** The 79 (`HarnessScore.astro`) and the six dimension bars (`:17-24`) are the last *independent* score; the source docs decline a re-score, so re-touching them would invent the number the whole plan refuses to invent. Two edits only: (1) the sub-lead already says "stale by its own rules until the next re-score" (`:32`) — append a pointer: `— <a href="#harness-delta">what changed since ↓</a>`. (2) `:37` "independent re-score, 2026-07-12" is a factual *event* date (the re-score did happen then), **not** a "current as of" claim — leave it verbatim. The "Still weak" list (`:54-59`) is all still true (instincts uncurated, sprawl unchanged, gates verify ritual, allowlist deferred) — leave it; s56 *hardened* two gates but the "verify ritual not reality" weakness stands, and 07 documents the hardening.

### Task 3.4: Lifecycle — figure-adjacent v2 mark (zero SVG bytes)

The Conveyor figure hardcodes `bash-guard` and `guard-push-gate` chips in their v1 state (`harness-svg.ts:276,279`) and can't be re-laid-out to annotate them. So the v1→v2 mark for this figure lives in the **editable HTML callout beside it**, not in the SVG. Append one clause to the "honest line" `ds-callout` (`HarnessLifecycle.astro:20`), after the existing sentence: *"Since (s56, 07-18) both of those block-once gates got sharper — a commit-on-main reminder and a chained-command 'nothing ran' warning; the drawing above predates them."* with an inline `ds-chip` "s56". This marks exactly the two chips that changed, adjacent to the figure, while touching zero collision-tuned coordinates. It also pre-empts the mismatch a sharp reader would otherwise catch between the frozen figure and section 07.

### Task 3.4b: Tracker — figure-adjacent v2 mark (zero SVG bytes, same pattern as 3.4)

The Ledger figure hardcodes its backlog footer as a literal SVG text run — `harness-svg.ts:404`: `Tx({ x: LX + 14, y: LY + LH - 8, t: '27 open on this branch · s32–s33 · 2026-07-13', ... })`. Same constraint as the Conveyor: this is a positioned coordinate inside a collision-tuned figure, not free text — leave the SVG byte-for-byte and add the mark in `HarnessTracker.astro`'s adjacent copy instead. Add one line under the existing capture/resolve/learn grid (or as a small `ds-caption` beneath the figure's bordered `<article>`): *"That backlog snapshot is frozen at 07-13. Since (s56, 07-18) the archive pipeline actually ran — 63 stuck items cleared, active ledger down to 649 lines."* with an inline `ds-chip` "s56" — mirrors Task 3.4's wording and rationale exactly (name the mismatch before a reader finds it themselves).

### Task 3.5: Page-wide staleness self-audit

Because section 07 publicly shames a stale datestamp (item 10), the page must pass its own test. After the edits above, grep the whole harness surface for datestamps and time-relative wording and confirm each is either a factual event date (keep) or has been made absolute:

- `grep -rnE '(this week|this month|last week|recently|new)\b|20[0-9]{2}-[0-9]{2}-[0-9]{2}' src/pages/harness.astro src/components/harness/ src/lib/harness-svg*.ts`
- Confirm `harness.astro:33` meta description hardcodes "79/100" — this is a **deliberate keep** (we're not re-scoring), note it in the session log so a future reader doesn't "fix" it.
- Confirm every surviving date is an event date ("re-score, 2026-07-12", "paused 07-12", "retired 07-12"), not a "current as of" claim.

---

## Phase 4 — Deferred / optional (documented, not built by default)

### Task 4.1: The full data pipeline — deferred, out of scope (with reasoning)

The `data/stats.json` precedent (`docs/plans/2026-07-11-the-works-commit-city.md`) works because a script generates it from **git history in this same repo** at build time. The harness stats have no such local source: they live in the **private cubby repo, not present at foundry build time**. Any foundry-side "refresh script" would still be a human copy-paste from cubby into `src/data/harness.ts` — indirection that doesn't remove the manual step. So the full pipeline buys nothing here and is **deferred**. The in-scope half — one typed `src/data/harness.ts` as a single hand-edited edit-point (Task 1.1) — captures the real maintainability win (next re-score = one file) without pretending an automatable source exists. Record this as a follow-up in `docs/sessions/`: *if* cubby's harness docs ever expose a machine-readable stats file the operator is willing to vendor, revisit.

### Task 4.2: In-figure SVG pip — optional, recommended against

The concrete option, stated so this isn't a hedge: the Conveyor has a verified ~37px empty gutter to the right of the PreToolUse chip cluster (chips span `x = 456…634` from `st.x=545, st.x-89`; next station's chips start at `x=671`), room for a tiny `↳ s56` `Tx(...)` pip at ~`x=638` beside the `bash-guard`/`guard-push-gate` rows — purely additive, no re-layout. **Recommended against**: it edits the locked figure for a mark the §3.4 caption already carries more legibly, and any in-SVG text change must be measured in-browser (foundry's "verify CSS in-browser" rule) at the 8px figure type floor before trusting it. If ever done, it's browser-verify-gated and belongs in its own commit, not bundled with the content work.

---

## Phase 5 — QA

- `npm run build && npm test` green (the new `harness-data.test.ts` asserts every `DELTA_ITEMS[].badge` is in the `DeltaBadge` union, every item has non-empty `title`/`body`, and `SCALARS.score === 79` so a stray re-score gets caught by CI).
- Dev-server screenshots, light + dark: section 07 (badges legible in both themes — `--ds-warning` chip contrast especially), the Paper `67.3 KB · 332 lines` + v2 chip, the Arsenal `17 on` + sample-labeled grid, the Score delta pointer link, the Lifecycle appended callout, the Tracker appended callout (Task 3.4b).
- Click the Score → `#harness-delta` anchor; confirm it lands on section 07 with the section's `scroll-margin-top`.
- Confirm section 07 has **no** fullscreen tab (no `data-harness-figure`), and the existing five figure tabs are unchanged.
- Reduced-motion: the new section's `data-reveal` entrance respects `prefers-reduced-motion` like every other section (no new animation added).
- Run the §3.5 grep; confirm zero surviving "current as of"-style stale wording.
- No console errors; `npx astro check` clean for the new `.astro` + `.ts` files.

## Phase 6 — Review & ship

- Single branch for the session (e.g. `feat/harness-page-v2`), atomic commits per phase: `chore: harness data module + v2 chip css`, `feat: harness section 07 the retool`, `fix: refresh stale harness stats + v2 marks`, then the docs/session-log commit separately.
- Gates before push (AGENTS.md): build/lint green → `npm test` green → `/code-review` (Workflow, high effort) on the diff, no CRITICAL/HIGH unfixed. `package.json`/`package-lock.json` are untouched (no new deps) so the `npx npm@10 ci` lock-check isn't triggered — confirm the diff really adds no dependency.
- **Content-review gate** (the private-repo exception): before push, re-read the 11 delta items + the AGENTS.md size/line refresh against the "no internal URLs, no credentials, no business-sensitive detail" bar — same checkpoint already granted for the Paper section, applied to the new verbatim content.
- One PR covering the whole session's work; session log to `docs/sessions/` with Achieved / Decisions (the five defended calls: scoped-v2, HTML-not-figure, defer-pipeline, reuse-ds-chip, meta-description-deliberate-keep) / Follow-ups (the 4 real plugin names; the deferred pipeline) / Resume pointer / Models.
- Branch-end interactive HTML manual-test checklist in `.scratch/` (per global rule): cover what screenshots can't — badge contrast on a real display in both themes, the Score→delta anchor on a real scroll, section-07 reading order/voice, and a human read of the 11 items for the private-content bar. Skip nothing to an empty checklist — this branch has real manual surface (visual/voice/content-review), so the checklist is warranted.
