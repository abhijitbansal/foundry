# Design-skill auto-routing — design spec

**Date:** 2026-07-26
**Status:** Approved (pending spec review)
**Scope:** Global harness config (`~/.claude`, `~/.agents`) + one foundry override row
**Author:** Claude Opus 5, session on `docs/design-skill-routing`

---

## 1. Problem

Twelve-plus design skills are installed (impeccable plugin, Emil Kowalski's five-skill motion set, three anti-slop taste rulebooks, two pre-existing code-design skills). They do not reliably fire on their own, they overlap heavily, and several of them actively contradict each other. The goal: design/UI/motion work automatically consults the right skill without the user typing a skill name, and never loads two rulebooks that disagree.

The stated ask included "a single slash command that loads them all on demand." That conflates two mechanisms. A slash command is manual by definition and cannot satisfy "so I don't have to invoke them." The design therefore splits into an **auto lane** (fires with no user action) and a **manual lane** (explicit override). The command is the escape hatch, not the primary path.

---

## 2. Established facts

Each verified against files on disk during the audit; file:line given where a claim is load-bearing.

### 2.1 Only name + description are in context

For an installed-but-uninvoked skill, the model sees the YAML frontmatter `name` and `description` and nothing else. The SKILL.md body loads only when the skill triggers; bundled `references/` load later still.

- `~/.claude/plugins/cache/claude-plugins-official/superpowers/6.2.0/skills/writing-skills/anthropic-best-practices.md:1021` — "At startup, the name and description from all Skills' YAML frontmatter are loaded into the system prompt"
- same file `:20` — "Agents read SKILL.md only when the Skill becomes relevant"
- `~/.claude/plugins/cache/claude-plugins-official/plugin-dev/unknown/skills/skill-development/SKILL.md:81,274-276`

**Consequence:** the description *is* the trigger. Nothing else in the skill affects whether it fires.

### 2.2 Two of the new skills cannot auto-fire at all

`disable-model-invocation: true` in frontmatter strips the description from the model's reach — the skill becomes user-invoked only.

- `review-animations` — the motion-diff reviewer
- `pick-ui-library`

Per `~/.agents/skills/writing-great-skills/GLOSSARY.md:33`: "keep it and the skill is model-invoked... delete it and the skill is user-invoked."

**Consequence:** no description rewrite reaches these two. Something already in context must call them by name. This is the single strongest argument for a router skill over description surgery.

### 2.3 `impeccable:impeccable` already dominates the trigger space

Its description is ~900 characters naming 14 verbs (design, redesign, shape, critique, audit, polish, clarify, distill, harden, optimize, adapt, animate, colorize, extract) across websites, landing pages, dashboards, product UI, components, forms, onboarding, empty states. It is the strongest-triggering design description installed and will match most frontend requests today.

Structurally it is **one monolithic skill**, not a set. All 23 "commands" are argument routes inside a single SKILL.md (85 lines) that then loads exactly one `reference/*.md` playbook.

Operational detail: its `allowed-tools` is restricted to `Bash(npx impeccable *)` and `Bash(node .claude/skills/impeccable/scripts/*)`. It expects a per-project copy at `.claude/skills/impeccable`, and `scripts/context.mjs` must run with cwd at the project. **A project needs `/impeccable init` before its script-backed routes work.**

### 2.4 impeccable ships always-on hooks — kept, by decision

The plugin registers a PostToolUse hook (matcher `Edit|Write|MultiEdit`) and a Stop hook, both running `hook.mjs` — an anti-pattern / contrast / a11y detector. These run after every UI file edit and at session end whether or not `/impeccable` was invoked.

**Decision (2026-07-26): keep them on.** They are a free correctness net for contrast and a11y regressions. Accepted cost: a detector pass per UI edit. `/impeccable hooks off` remains available if the per-edit cost ever becomes noticeable.

### 2.5 Weak descriptions

Topic labels with no trigger phrasing, so they rely on implicit matching:

- `emil-design-eng` — "This skill encodes Emil Kowalski's philosophy on UI polish…" (also wrong person — first/implicit rather than third)
- `high-end-visual-design` — "Teaches the AI to design like a high-end agency…"
- `review-animations` — moot, see 2.2

Guidance says descriptions should be third person and lead with triggering conditions (`writing-skills/SKILL.md:99-102`, `:175-196`).

### 2.6 The taste skills are stack-locked and mutually redundant

- `design-taste-frontend` — 1207 lines, assumes React / Next.js / Tailwind / Motion / GSAP
- `high-end-visual-design` — 98 lines, assumes Tailwind + React
- `redesign-existing-projects` — 178 lines, **framework-agnostic**, explicitly works with vanilla CSS, and is the only one with don't-break-functionality constraints

All three ban overlapping sets of fonts, colors, layouts, and motion patterns, with different specifics. Two of them loading together produces contradictory rules with no defined precedence.

### 2.7 No `UserPromptSubmit` hook exists; the slot is free

`~/.claude/settings.json` configures two PreToolUse hooks (`bash-guard.sh`, cartoon rewrite) and two SessionStart hooks (session title, ultracode directive). No `UserPromptSubmit`, `PostToolUse`, or `Stop` hook at the user level. The SessionStart hooks already emit `hookSpecificOutput.additionalContext`, proving context injection works in this harness.

### 2.8 Upstream skills are symlinks

`~/.claude/skills/<name>` → `~/.agents/skills/<name>` for every skill in this set. Editing their `description:` lines mutates third-party content that a reinstall or update clobbers.

**Consequence:** the design must not depend on rewritten upstream descriptions. The router owns triggers instead.

---

## 3. Approach

**Router skill + nudge hook.** Rejected alternatives:

| Approach | Why rejected |
|---|---|
| Rewrite the weak upstream descriptions | Clobbered on update (2.8); cannot reach the two `disable-model-invocation` skills (2.2) |
| Slash command only | Manual — does not meet the stated goal |
| Hook that mandates skill invocation | User chose nudge over mandate; a mandate fires on false positives like "refactor this bash script" and burns tokens |

---

## 4. Architecture

Five artifacts. All routing config is **global** — nothing design-routing-related lives in the foundry repo except one override row and this spec.

```
~/.agents/skills/design-router/SKILL.md      # the router (source of truth)
~/.claude/skills/design-router               # symlink → above, matches existing convention
~/.claude/hooks/design-nudge.sh              # UserPromptSubmit keyword nudge
~/.claude/settings.json                      # + UserPromptSubmit hook registration
~/.claude/commands/design.md                 # manual escape hatch
~/.claude/CLAUDE.md                          # ~6-line pointer
foundry/AGENTS.md                            # repo-specific overrides only
```

### 4.1 The router skill

**Contract:** the router dispatches and never advises. Its body contains zero design content — no font bans, no easing tables, no color rules. Those live in the skills it routes to. If the router starts accumulating design opinions it has failed; that content belongs in a routed skill.

Target size ≈70 lines.

**Dispatch mechanism.** When the router fires, it resolves the request shape against the table and then calls `Skill(<target>)` itself, rather than emitting a recommendation for the outer agent to act on. One hop, no ambiguity about who invokes.

This is an assumption for the two `disable-model-invocation` skills. That flag documented-ly blocks *autonomous description-matching* invocation (`writing-great-skills/GLOSSARY.md:33`); whether an explicit `Skill` call originating inside another skill's body reaches such a target was **not** tested during the audit. Probe 9 exists to test exactly this. If it fails, the fallback is stated in §7.

**Description** (third person, trigger-condition-led, no workflow summary — per `writing-skills/SKILL.md:99-102`, which documents that a description summarizing workflow causes agents to follow the description instead of reading the body):

> Use when a request concerns how something looks, feels, or moves — designing, redesigning, restyling, polishing, critiquing, or auditing a UI; making a page feel premium, less generic, bolder, or quieter; layout, spacing, typography, color, theming, or design tokens; adding, fixing, or reviewing animation, motion, transitions, gestures, springs, or drag; naming a motion effect; picking a frontend library; or refactoring code whose purpose is presentation (CSS, styles, components, markup). Also use when unsure whether a design skill applies.

**Routing table:**

| Request shape | Route to | Notes |
|---|---|---|
| New visual surface (page, landing, component) | `impeccable:impeccable` (new-work / craft) | needs `/impeccable init` in the project first |
| Redesign existing, "looks generic", "AI slop" | `redesign-existing-projects` | framework-agnostic; has don't-break-functionality rules |
| UX critique, a11y audit, visual hierarchy | `impeccable:impeccable` (critique / audit) | |
| "What could be animated here", "feel more alive" | `find-animation-opportunities` | read-only; caps at 5–7 suggestions, requires a rejected-candidates section |
| "Improve the animations", motion roadmap | `improve-animations` | read-only; writes plans to `plans/`, never touches source |
| Review a motion diff | `review-animations` | **router invokes explicitly** — cannot auto-fire |
| "What's it called when…" | `animation-vocabulary` | naming only; hands off for implementation |
| Gestures, springs, sheets, drag, momentum, iOS feel | `apple-design` | framework-agnostic physics |
| Component polish, "does this feel right" | `emil-design-eng` | non-motion UI craft |
| Library pick (toasts, charts, cmdk, virtualization) | `pick-ui-library` | **router invokes explicitly** — cannot auto-fire |
| Module / API shape, seams, testability | `codebase-design`, `design-an-interface` | **not visual** — "interface" here means module API surface |

**Refactor split.** `refactor` is not a design verb on its own and is the most likely source of false routing:

- Refactor touching styling, layout, component structure, markup (`.css`, `.tsx`, `.astro`, `.svelte`, style objects) → design lane
- Refactor of logic, data, build, or config → `codebase-design` / `code-simplifier`, and the router stops there

**Stack gate for the taste skills.** Per the 2026-07-26 decision, `design-taste-frontend` and `high-end-visual-design` stay in the auto-fire pool for future React work. They are gated, not demoted:

- **Eligible** when the `package.json` contains React (or Next) *and* Tailwind. The router must *read* the file, not assume: nearest-first in a monorepo, absent file counts as a failed gate, and Tailwind counts as either `tailwindcss` or `@tailwindcss/vite` plus an `@import "tailwindcss"`.
- **Gate passes** → on table rows 1 and 2 only, `design-taste-frontend` *replaces* that row's primary target. `high-end-visual-design` is the shorter alternative, taken only for an explicitly premium-agency brief. No other row is affected — the gate never redirects a motion, naming, or library-pick route.
- **Gate fails** → both are struck from candidacy and the matched row's primary target stands unchanged.
- The `and` is load-bearing: foundry has React as a narrowly scoped dependency (one `client:visible` figure) but no Tailwind, so the gate correctly excludes it. React alone is not the signal; the Tailwind utility-class idiom is what these two rulebooks actually assume.

The gate must **select**, not merely filter. A first implementation made it removal-only, which left both skills absent from every table row and therefore unreachable by auto-routing — demoted rather than gated, the opposite of the 2026-07-26 decision. Rows 1 and 2 name the gate explicitly so that cannot recur.

**Mutually exclusive sets.** Never load two members of a set in one request:

1. `impeccable:impeccable` ⊗ `design-taste-frontend` ⊗ `high-end-visual-design` — three full rulebooks with contradicting bans. Pick exactly one.
2. `superpowers:brainstorming` ⊗ `impeccable:impeccable` — brainstorming owns "what should we build" and terminates at `writing-plans`; impeccable owns "make this look right" and runs its own gated pipeline. Two incompatible terminal states.
3. `emil-design-eng` ⊗ `review-animations` — near-duplicate content, same mandatory Before/After/Why table. Motion diff → `review-animations`; everything else → `emil-design-eng`.

**Composable, not competing:** `full-output-enforcement` is domain-agnostic (bans placeholders and elision in generated output) and has no content overlap with any design skill. It layers onto any route.

**Precedence with caveman mode.** `full-output-enforcement` governs completeness of code and file deliverables; the caveman UserPromptSubmit style governs conversational prose. Caveman already exempts code blocks, so the collision is limited to prose deliverables — where full-output-enforcement wins.

### 4.2 The nudge hook

`~/.claude/hooks/design-nudge.sh`, registered as `UserPromptSubmit` in `~/.claude/settings.json` (free slot per 2.7).

Behavior:

1. Read hook JSON from stdin, extract `.prompt`
2. Case-insensitive, word-boundary match against the design keyword set
3. On match, emit `hookSpecificOutput.additionalContext` with a single line
4. On no match, exit 0 silently
5. Exit 0 unconditionally — the hook must never block a turn

Injected text:

> Design/UI-shaped request detected. Consult the `design-router` skill before choosing an approach — it resolves which design skills apply, which cannot auto-fire, and which are mutually exclusive.

Keyword set (starting point, widened by the acceptance gate if it under-fires):

`design`, `redesign`, `restyle`, `styling`, `ui`, `ux`, `visual`, `look`, `looks`, `feel`, `feels`, `polish`, `premium`, `generic`, `slop`, `layout`, `spacing`, `typography`, `font`, `color`, `colour`, `theme`, `token`, `animate`, `animation`, `motion`, `transition`, `gesture`, `spring`, `drag`, `swipe`, `hover`, `scroll`, `component`, `hero`, `landing page`, `responsive`, `mobile`, `a11y`, `accessib`, `contrast`, `refactor`

`refactor`, `component`, and `look` are deliberately broad. Cost on a false positive is ~15 tokens of injected text plus the router's own refactor split, which routes non-visual work straight back out. That is cheaper than a missed trigger.

Nudge, not mandate, per the 2026-07-26 decision. The agent still decides.

### 4.3 The `/design` command

`~/.claude/commands/design.md`. Loads the router, prints the routing table, accepts an optional route argument (`/design animate`, `/design critique`). Purpose is covering hook false negatives and letting the user force a specific route. Not the primary path.

### 4.4 CLAUDE.md addition

Roughly six lines under a `# Design work` heading. Contents:

- Point at `design-router` as the first stop for anything visual or motion-related
- State the refactor split in one sentence
- State that `impeccable` and the taste rulebooks are mutually exclusive
- Note that `review-animations` and `pick-ui-library` require explicit invocation

It does **not** restate the routing table. The router is the single source of truth; a duplicated table in CLAUDE.md would drift.

### 4.5 foundry/AGENTS.md overrides

A short subsection appended to **Design → build model routing** (not a new Project-decisions row — this is routing guidance, not a locked project decision):

- UI here uses House DS `--ds-*` custom properties with inline styles — no Tailwind, no CSS modules, no hardcoded color values
- `design-taste-frontend` and `high-end-visual-design` are **not eligible** in this repo (React/Tailwind-locked, contradicts the dependency-free stack lock)
- Sanctioned set here: `impeccable:impeccable`, `redesign-existing-projects`, `apple-design`, and the three motion skills
- Existing model-tier routing (Fable designs, Sonnet builds) is unchanged and still applies on top

---

## 5. Explicitly out of scope

- **No edits to upstream skill files.** No `description:` rewrites in `~/.agents/skills/*`, no frontmatter changes, no forking. Per 2.8 those are clobbered on update, and the router makes them unnecessary.
- **No mandate hook.** Nudge only, per decision.
- **No consolidation of the overlapping taste skills.** They stay installed and eligible under the stack gate.
- **No changes to impeccable's hooks.** Kept as-is, per decision. Recorded cost, so the §8 follow-up has something concrete to re-evaluate: the PostToolUse matcher is `Edit|Write|MultiEdit` with no path filter, so the detector runs after *every* edit in a project that has impeccable installed — backend files, config, and markdown included, not only UI source.

---

## 6. Acceptance gate

Config that reasons correctly but never fires is the expected failure mode here, not the unlikely one. The gate is empirical.

Run each probe in a **fresh session** (skill listing and injected context are per-session). Record which skills actually announce themselves.

| # | Probe prompt | Expected route |
|---|---|---|
| 1 | "make the hero feel more premium" | router → `impeccable:impeccable` or `redesign-existing-projects` |
| 2 | "refactor works.ts" | **no design skill** — logic refactor |
| 3 | "refactor the harness page CSS" | design lane |
| 4 | "review this diff" | no design skill unless the diff contains motion |
| 5 | "add a hover animation to the project cards" | `find-animation-opportunities` |
| 6 | "the modal transition feels janky" | `apple-design` or `emil-design-eng` |
| 7 | "what's it called when the sheet bounces at the top" | `animation-vocabulary` |
| 8 | "redesign the projects page" | `redesign-existing-projects` |
| 9 | "what should I use for toasts" | `pick-ui-library` — proves the explicit-invoke path works |
| 10 | "let's build a new case-study page" | `superpowers:brainstorming`, **not** `impeccable` — proves precedence set 2 |

**Pass threshold: 8 of 10 overall, *and* probes 2, 9, and 10 must each pass individually.** Those three are diagnostic — 2 proves no over-firing, 9 proves the router reaches a non-auto-firing skill, 10 proves the brainstorming/impeccable precedence holds. A run that scores 8/10 by failing exactly those three is a failure, not a pass.

**Failure handling:** under-firing is fixed by widening the hook keyword set, not by enlarging the router body. Over-firing (probe 2 fails) is fixed by tightening the refactor split in the router, not by removing keywords from the hook.

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| Router competes with impeccable's own strong description and loses | Acceptable — impeccable firing directly on pure visual work is a correct outcome. The router matters most for motion, library picks, and the code-vs-visual split, where impeccable is the wrong answer. |
| Router accumulates design content over time and becomes a 13th rulebook | Stated contract in 4.1: dispatch only, zero design content. Enforced at review. |
| Hook keyword set drifts out of sync with the routing table | Both live in files edited together; the acceptance gate is the check. |
| `impeccable` routes fail silently in a project without `/impeccable init` | Router's impeccable rows carry the init precondition. |
| A `Skill` call from the router cannot reach a `disable-model-invocation` target (4.1) | Probe 9 tests it. On failure, the router instead instructs the user to run `/design pick-ui-library` (or `/design review-animations`) — one manual step, routing table unchanged. |
| Upstream skill update changes a description and shifts trigger behavior | Re-run the acceptance gate after any design-skill update. |

---

## 8. Follow-ups

- Re-run the 10-probe gate after any design-skill or impeccable version bump
- If `emil-design-eng` and `review-animations` prove genuinely interchangeable in practice, consider dropping one from the routing table (do not edit either file)
- Revisit the impeccable hook decision if per-edit detector cost becomes noticeable in long UI sessions
