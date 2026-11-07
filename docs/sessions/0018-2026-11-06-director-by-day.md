# Session 0018 — Lead the site with the day job (2026-11-06)

Branch: `feat/director-by-day`

## Achieved

- **Home hero now opens** "Director of software engineering by day. Hobbyist by night." The lead, a new first General Note, a footer line on every page, the default meta description and the link preview subtitle all say the same thing.
- **Headline size follows its column** (`src/components/HeroYard.astro`). Measured in Chrome at 320, 340, 360, 390, 768, 1024, 1280, 1440 and 1728px: the text stays inside its column at all of them, and it is four lines at 1280-1728px. It was five or six lines at 1280-1400px before the size rule.
- **Review found one bug, fixed:** "engineering" crossed the sheet frame at 320px, because the word has no break point and the 40px floor held. The floor is now `min(40px, 15cqi)`.
- **Checks:** `npm test` 166 of 166 and `npm run build` pass. The `plans` egg overlay renders with the new headline (checked in Chrome before the floor change; the floor does not apply at that width).

## Decisions

- Title only, no employer and no scale figures (owner's call). Recorded in AGENTS.md, with the rule that copy makes no factual claim about when the work happens.
- The owner first approved "the evenings" and "on my own time", then chose softer wording after review: "the hobby" and "separate from the day job".
- `/craft/` stays unchanged: manager is a comparison there, not biography.
- The preview image changes its subtitle only. It keeps the old dark styling.
- `scripts/og-image/generate.mjs` also rewrites the favicons. They came out different, so they were restored and are not in this branch.

## Follow-ups

- Owner: after merge, re-scrape the home URL in LinkedIn Post Inspector. The image URL is unchanged, so LinkedIn may show the old card.
- Open from review, not fixed: the touchmark seal overlaps the footer role line below about 560px once the anvil egg is solved. `.ds-display-xl`'s size ramp is now repeated in `HeroYard.astro`.
- The preview image still uses the retired palette, as it did before this branch.

## Resume pointer

PR open; owner merges. The manual checklist is in `.scratch/feat-director-by-day-test-checklist.html`.

## Models

- Orchestrator: Opus 5.5.
- Review: `ecc:code-reviewer`, Opus at medium effort, report only.
