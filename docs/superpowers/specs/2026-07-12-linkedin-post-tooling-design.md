# LinkedIn post tooling — design

**Date:** 2026-07-12
**Status:** approved, implemented same session

## Problem

Recurring need: write a LinkedIn post about a Foundry-tracked project (this site now, Paperix this week, others later) that's humble and factual — no hype, no growth-hacker structure, no overclaiming a solo project's scope. Doing this from scratch each time risks drifting into generic startup-LinkedIn voice. Need repeatable tooling, scoped to this repo (foundry is the personal-brand hub per its own README), that guides the user through it rather than requiring a fully-formed brief up front.

## Decisions (from user Q&A)

- **Content source:** hybrid — auto-scan repo signals (git log, `docs/sessions/`, `PROJECTS.md`) by default, accept pasted bullets to skip scanning, ask only for gaps neither source fills (personal motivation, CTA intent).
- **Voice guardrails:** four categories — hype words, growth-hacker structure, overclaiming scope, emoji/formatting excess. Anchored in the site's own existing copy (forge/smithy metaphor, factual-claim-first register), not abstract adjectives.
- **Scope:** foundry-repo-only. Posts about other projects (Paperix, Cubby, ...) are still authored from here.
- **Draft variants:** 2-3 angles (craft/process, outcome/what-it-does, personal-motivation).
- **Storage:** committed under `docs/linkedin/`, not gitignored — durable history / content calendar.
- **Orchestration:** full Workflow — 3 parallel ghostwriter drafts (one per angle) → pipelined critique (2 independent critics per draft, adversarial default-to-reject) → single synthesis barrier that sees all drafts+critiques together and produces the final post. All stages run planner-tier (Opus, high effort) per this repo's own routing rule that adversarial review/judging is design-tier work, not routine implementation.

## Components

1. `.claude/commands/linkedin-post.md` — interactive gather stage (subject, source material, human-only gaps) in the main thread, then invokes the Workflow above, then presents + saves.
2. `.claude/agents/ghostwriter.md` — dedicated drafting/synthesis subagent (Opus). Reads `docs/linkedin/voice-guide.md` before writing, self-checks its own draft against it before returning.
3. `docs/linkedin/voice-guide.md` — the durable tone contract both drafting and critique passes are pointed at.

## Error handling

- Ambiguous subject or source → command asks, never guesses.
- All three drafts flagged hard by critics → synthesis still returns a usable post, but says so plainly in its rationale rather than silently picking the least-bad draft.
- Workflow stage flakes (e.g. structured-output retry-cap) → command falls back to drafting inline rather than looping retries; a usable draft matters more than the orchestration succeeding.
- No auto-posting anywhere, ever — output is always copy-paste text for the user.

## Verification

No unit tests (prompt/markdown tooling, not logic-bearing code). Verified via a real dry run: generating the actual foundry-site announcement post this session.
