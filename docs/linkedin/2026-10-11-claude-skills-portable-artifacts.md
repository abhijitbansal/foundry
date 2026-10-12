---
date: 2026-10-11
target: claude-skills (portable-artifacts plugin)
angle: outcome/what-it-does
status: posted
---

Claude's artifacts made me want the same kind of output in every coding agent, not just Claude. So I built portable-artifacts: two open-source skills in my claude-skills repo that install into Claude Code, Codex, GitHub Copilot and Gemini CLI.

- make-dashboard turns a prompt and a data file into a single page of charts.
- make-motion turns a prompt into a short animated explainer video, with sound if you ask for it: music from your own file, or a voiceover generated on your machine.

Everything is built locally from open-source parts, and each sample on the page sits next to the prompt that made it.

If you try it, I'd like to hear how it goes.

https://abhijitbansal.github.io/claude-skills/features/portable-artifacts.html#showcase

## Notes

- Posted 2026-10-11 by the user; text above is the approved draft (no edits reported).
- "new" dropped from the brief's "new Claude functionality" (timing claim not verified); "install into" rather than "works in" because every showcase sample was made with Claude Code (Sonnet); no bare "offline, no account" claim since the agent hosts themselves need an account and network.

## Alternates considered

- Craft/process: led with the spec-first design (model writes a small JSON spec, scripts do the rest) — cut as detail-as-flex.
- Personal-motivation: led with hosted-artifact friction — cut as detail-as-flex and for overclaiming against Claude's own feature.
