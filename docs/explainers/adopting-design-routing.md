# Adopting design-skill routing in another repo (this machine)

The routing system is **global** — any repo on this machine gets it for free.
This guide covers the one repo-side part: telling the router what it resolves
to in *your* repo. Reference: the [spec](../superpowers/specs/2026-07-26-design-skill-routing-design.md)
and the [visual explainer](./design-skill-routing.html); foundry's own
override lives in [`AGENTS.md` → "Which design skill applies here"](../../AGENTS.md).

## Already global — do not copy any of this

| Piece | Where it lives |
|---|---|
| `design-router` skill (routing table, refactor split, stack gate, exclusion sets — the single source of truth) | `~/.agents/skills/design-router/SKILL.md` |
| Nudge hook (registered, fires on every prompt in every repo) | `~/.claude/hooks/design-nudge.sh` + `~/.claude/settings.json` |
| `/design [route]` manual override | `~/.claude/commands/design.md` |
| CLAUDE.md pointer | `~/.claude/CLAUDE.md` → "Design work: route it, don't improvise" |

Never duplicate the routing table into a repo — it drifts. The repo only
records what the router's generic rules *resolve to* locally.

## What your repo adds: one AGENTS.md (or CLAUDE.md) subsection

Answer three questions, then paste the template:

1. **Does the stack gate pass?** Read your `package.json`: React (or Next)
   **and** Tailwind (`tailwindcss`, or `@tailwindcss/vite` + an
   `@import "tailwindcss"`) → gate passes and `design-taste-frontend`
   replaces rows 1–2 of the table. Anything less — including React without
   Tailwind — fails the gate. Say which, explicitly.
2. **What's the repo's styling system?** Name it (design tokens, utility
   classes, inline styles, CSS modules) so a routed skill doesn't fight
   conventions.
3. **Will you use impeccable's script-backed routes?** If yes, run
   `/impeccable:impeccable init` in the repo once (creates
   `.claude/skills/impeccable`). Critique/audit/planning routes need no init.
   (It's `/impeccable:impeccable init` — the plugin ships no `commands/`
   directory, so `/impeccable init` does not exist.)

### Template

```markdown
### Which design skill applies here

Skill routing is global (`design-router`); this is what that router resolves to **in this repo**.

- Styling system: <tokens / Tailwind / CSS modules / inline — name it and its rules>.
- Stack gate: <passes / fails> — package.json has <React+Tailwind / React only / neither>,
  so `design-taste-frontend` / `high-end-visual-design` <are / are not> eligible here.
- Sanctioned set: <the routed skills that make sense in this repo, e.g.
  `impeccable:impeccable`, `redesign-existing-projects`, `apple-design`, the motion trio>.
- impeccable init: <run / not run> — script-backed routes <work / need `/impeccable:impeccable init` first>.
- Skill routing composes with any model-tier routing this file defines; it does not replace it.
```

## Special cases

- **Native (SwiftUI/UIKit) repo:** skip the router entirely — it's out of the
  router's pool by design. Use `swiftui-expert-skill`, `apple-design`, or
  `ecc:liquid-glass-design` directly. Your AGENTS.md subsection can be one
  line saying exactly that.
- **`review-animations` / `pick-ui-library`:** model `Skill()` calls to these
  hard-fail (`disable-model-invocation`, verified 2026-07-26). In any repo,
  they load only when *you* type `/review-animations` / `/pick-ui-library`
  (or `/design <name>`, which reads the skill file from disk).

## Verify it works

Give a fresh session a design-shaped prompt ("redesign the landing page") —
the nudge should appear and the router should pick one skill from your
sanctioned set. For a fuller pass, adapt foundry's 10-probe acceptance
checklist (`.scratch/design-skill-routing-test-checklist.html`, foundry repo).
Re-check after any design-skill or impeccable version bump.
