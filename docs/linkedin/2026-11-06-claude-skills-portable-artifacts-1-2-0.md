---
date: 2026-11-06
target: claude-skills (portable-artifacts plugin)
angle: outcome/what-it-does
status: draft
---

portable-artifacts 1.2.0 is out. It's a plugin I built in my open-source claude-skills repo. It installs into Claude Code, Codex, GitHub Copilot and Gemini CLI, and makes dashboards, diagrams, explainer pages, 3D scenes and animated videos.

New in this release:

- Hand-drawn videos. An illustrated hand draws the scenes on a white board. Ask for a voiceover, generated on your machine, and the drawing follows the sentences.
- Cloud architecture diagrams with real service logos: 60 for AWS, and only 4 for Google Cloud.
- A Simple English toggle on explainers. It swaps in a plainer version of the text, written to rules based on ideas from ASD-STE100.

If you try it, I'd like to hear how it goes.

https://abhijitbansal.github.io/claude-skills/features/portable-artifacts.html#films

## Notes

- Approved 2026-11-06 with no edits. Not yet posted.
- "is out", not "GitHub release": 1.2.0 is in `plugin.json`, PR #56 is merged and the live page shows the new films and cloud diagram, but the repo has no GitHub Release object.
- "real service logos", not "official": the bundled icons come from a CC0 pack (`@iconify-json/logos`). Vendors' own packs are import-only.
- Vendor-pack import left out: the 1.2.0 changelog says the importer was tested only on fake folders.
- "based on ideas from ASD-STE100": the PR says the output is not a compliant document and the standard's dictionary is not checked.
- Voiceover worded as opt-in: "no music, no drawing sound" describes the sample film, not the feature.

## Alternates considered

- Craft/process: drawing timed to narration, the open icon pack and the second text version behind a toggle. Cut as detail-as-flex.
- Personal-motivation: reused the October opener about wanting artifact-style output in every agent. Cut because the owner gave no new reason for this release.
