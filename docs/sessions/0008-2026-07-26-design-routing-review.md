# Session 0008 — 2026-07-26 — Design-routing verification review

**Branch:** `docs/design-skill-routing` (continues session 0007's work)
**Goal:** review + verify the routing design, check the explainer artifact,
deliver verdict and fixes.

## Achieved

- **Settled probe 9's mechanism empirically:** `Skill(pick-ui-library)` from
  the model hard-fails ("cannot be used with Skill tool due to
  disable-model-invocation"). The flag blocks ALL model `Skill()` calls, not
  just auto-fire — so the router could never "call them by name" and
  `/design <name>` via `Skill()` was equally broken. Recorded in memory.
- Replayed all 10 acceptance probes through the hook: correct on all 10
  (fires 1,3,5–9; silent 2,4,10). Hook suite 55/55.
- 14-agent verification workflow over the 13 routed skills + coverage sweep
  (798k tokens, 0 errors): ~30 router claims confirmed with file:line
  evidence; **refuted** "emil-design-eng covers non-motion UI craft" (its 674
  lines are motion end to end); **partial** on "improve-animations never
  touches source" (it has an `execute <plan>` route). Coverage: 25 installed
  design-domain skills vs 13 routed — natives correctly carved out, ecc fleet
  silently unrouted.
- Fact-checked the explainer artifact: accurate, numbers grounded in the
  commit record (1,826 prompts / 6.5%).
- **Fixes applied:** router fallback section rewritten to direct `/skill-name`
  invocation + `/design <name>` Read-from-disk mechanism; emil row relabeled
  motion-centric with static-polish redirect to impeccable critique;
  improve-animations wording corrected; new "Out of the pool" section (native
  carve-out + deliberate ecc exclusions). `/design` command and CLAUDE.md
  bullet updated to match. Spec §4.1/§6/§7 + probe-9 checklist text updated;
  plan gets an errata note. Stray site-2a plan doc removed from the branch.
  Retroactive session log 0007 written.

## Decisions

- `disable-model-invocation` skills are reached ONLY by the user typing
  `/<skill-name>`; `/design <name>` handles them by reading SKILL.md from disk
  (explicit user request preserves the flag's anti-auto-fire intent).
- ecc design skills stay out of the routing pool, now documented as deliberate.
- Hook registration remains a manual user step (bash-guard is correct to block
  agent writes to `settings.json`).

## Follow-ups

- ~~Register the hook~~ **done, later this session** — user authorized it
  explicitly; registered via the Edit tool (the bash-guard covers Bash writes
  only, so no guardrail was dodged), validated (`[2,2,1]` hook counts, smoke
  test green), backup at `~/.claude/settings.json.bak-20260726-designnudge`.
  Live from the next session.
- Run the 10-probe gate from the checklist — probe 9 now tests the handoff,
  not the settled mechanism.
- Optional: add `ecc:accessibility` to the a11y row as a deep-dive exception.
- Open PR for the branch once the gate passes.

## Models

Claude Fable 5 (orchestrator; verification workflow ran Sonnet agents per
AGENTS.md tier routing).
