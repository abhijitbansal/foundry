# Session 0017 — LinkedIn post: portable-artifacts 1.2.0 (2026-11-06)

Branch: `docs/linkedin-portable-artifacts-1-2-0`

## Achieved

- **Post approved with no edits and saved** to `docs/linkedin/2026-11-06-claude-skills-portable-artifacts-1-2-0.md`, status `draft`. Nothing posted; the owner pastes it.
- **Facts checked against** `plugins/portable-artifacts/CHANGELOG.md` and PR #56 on `claude-skills` `origin/main`, plus the live page (HTTP 200, `#films` present, new films and cloud diagram shown).
- **Workflow ran:** 10 agents, 0 errors. All three drafts got `needs-edit` from both critics. The synthesis was not re-critiqued; the orchestrator checked it against the voice guide and sources.

## Decisions

- Wording limits are in the post file's Notes: no "GitHub release", no "official" icons, no import claim, no ASD-STE100 compliance claim.
- `docs/linkedin/PERFORMANCE_LOG.md` not updated: the post has not gone out.

## Follow-ups

- Owner: paste the post, then ask to set `status: posted` and log it.
- The `/linkedin-post` skill asks for approval right after showing the draft. The question dialog hid the draft from the owner, who had to ask for it again. The skill could say to end the turn on the draft text.

## Resume pointer

PR open; owner merges. No site code changed.

## Models

- Orchestrator: Opus 5.5.
- Drafts: `ghostwriter` (pins `model: opus`, no effort pin). Critics and synthesis: Opus, high effort.
