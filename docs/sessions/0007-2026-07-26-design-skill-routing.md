# Session 0007 — 2026-07-26 — Design-skill auto-routing

**Branch:** `docs/design-skill-routing` · **Commits:** `45e2829..260ae35` (10)
**Written retrospectively** by session 0008's review pass — the build session
itself violated the log mandate; reconstructed from spec, plan, SDD ledger,
commit messages, and the published explainer artifact.

## Achieved

- Spec + plan for global design-skill routing (`docs/superpowers/specs/`,
  `docs/superpowers/plans/`, both dated 2026-07-26).
- Built, via subagent-driven development (7 tasks): `design-nudge.sh`
  UserPromptSubmit hook + 55-assertion test suite, `design-router` skill
  (`~/.agents/skills/` + symlink), `/design` command, CLAUDE.md pointer,
  foundry AGENTS.md overrides, 10-probe acceptance checklist in `.scratch/`.
- Measured the hook against real prompt corpora: first keyword set fired on
  ~45–60% of historical prompts; recalibrated (400-char window, prefix/word/
  phrase classes) to 6.5% over 1,826 prompts, then repaired recall damage
  (12/12 recall, 7/7 precision on adversarial set). Suite 51 → 55 assertions.
- Review-cycle fixes: stack gate made selective (was removal-only, leaving the
  taste skills unreachable — `5856e08`), motion-build route added + probe 5
  corrected + `/impeccable:impeccable init` invocation fixed + CLAUDE.md
  verbs softened (`260ae35`).

## Decisions

- Router skill + nudge hook, not description rewrites (upstream skills are
  symlinked, clobbered on update) and not a mandate hook.
- Taste skills gated behind React AND Tailwind in `package.json`, not demoted.
- impeccable's always-on PostToolUse/Stop hooks kept.
- All routing config global; foundry gets only an AGENTS.md override section.

## Known issues at session end (found by 0008)

- Hook **not registered** — Task 2 blocked by the bash-guard on
  `settings.json` writes; needs the user. Backup at
  `~/.claude/settings.json.bak-20260726-013549`.
- `27aad12` accidentally committed the unrelated 442-line
  `docs/plans/2026-07-11-foundry-site-2a-implementation.md`.
- No session log (this file is the retrofit).

## Resume pointer

Spec §6 acceptance gate (10 probes, fresh sessions) not yet run — blocked on
hook registration. Checklist: `.scratch/design-skill-routing-test-checklist.html`.

## Models

Claude Opus 5 (orchestrator + subagents), session `session_01Md5Fd9uaVMmcyo6WvnG2Pb`.
