---
description: Draft a humble, no-hype LinkedIn post about a Foundry-tracked project (this site, Paperix, Cubby, etc.) — gathers context, asks what it can't infer, then runs a draft/critique/synthesize Workflow.
allowed-tools: Bash(git log*), Bash(git branch*), Bash(git diff*), Read, Grep, Glob, Write, AskUserQuestion, Workflow
---

## Context (pre-computed)
- Current branch: !`git rev-parse --abbrev-ref HEAD`
- Recent commits (this repo): !`git log --oneline -15`

## Task

Optional subject/bullets from the user: $ARGUMENTS

You are running the gather → draft/critique/synthesize → present flow for a LinkedIn post. Follow it in order — don't skip to drafting before gathering is actually done.

### 1. Gather

Figure out three things. Only ask the user (one question at a time, `AskUserQuestion`) for what you genuinely can't infer — don't ask about things the repo already tells you.

- **Subject.** Which project is this post about? If `$ARGUMENTS` names one, use it. If it's ambiguous (multiple unrelated things shipped recently, or no argument given), ask.
- **Source material.** If the user pasted bullets in `$ARGUMENTS`, treat those as ground truth and skip scanning. Otherwise scan for it yourself:
  - This repo (foundry): `git log`, `docs/sessions/*.md` (most recent), `PROJECTS.md`'s entry for the subject.
  - Another tracked project (e.g. Paperix, at the `doc-scan` working directory if available): its README, recent commits, and its `PROJECTS.md` entry here as a minimal fallback if the other repo isn't reachable.
  - Never invent a fact that isn't in one of these sources.
- **Gaps only a human can fill** — typically: why this, why now (personal motivation isn't in git history), and whether there's a link/CTA at all (default: no hard CTA, just the description + a link if one exists).

Assemble everything gathered into one plain-text context block (facts, quotes from source files, the subject's what-it-is one-liner from `PROJECTS.md`). This block is what gets handed to the drafting Workflow — it should contain nothing except verified facts and the user's own words.

### 2. Draft, critique, synthesize

Read `docs/linkedin/voice-guide.md` yourself first, so you can sanity-check the final output too — but the actual drafting/critique work happens inside a Workflow so three angles can be tried and adversarially checked before you ever see them.

Call the `Workflow` tool with this exact script (fill in `args.context` with the block you assembled in step 1 — do not alter the script logic itself, only `args`):

```js
export const meta = {
  name: 'linkedin-post-draft',
  description: 'Draft, critique, and synthesize a LinkedIn post from gathered context',
  phases: [
    { title: 'Draft', detail: 'three angle-specific ghostwriter drafts', model: 'opus' },
    { title: 'Critique', detail: 'two independent voice-guide critics per draft', model: 'opus' },
    { title: 'Synthesize', detail: 'pick or blend the strongest draft', model: 'opus' },
  ],
}

const ANGLES = [
  { key: 'craft', brief: 'Angle: craft/process — what was actually built and how; the interesting technical or design choice behind it.' },
  { key: 'outcome', brief: 'Angle: outcome/what-it-does — what it lets you, or a visitor, do now that you couldn\'t before.' },
  { key: 'motivation', brief: 'Angle: personal-motivation — why this, why now, what problem you personally had.' },
]

const DRAFT_SCHEMA = {
  type: 'object',
  properties: {
    angle: { type: 'string' },
    draft: { type: 'string' },
    selfCheckNote: { type: 'string' },
  },
  required: ['angle', 'draft'],
}

const CRITIC_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['clean', 'needs-edit', 'reject'] },
    flags: { type: 'array', items: { type: 'string' } },
    suggestedEdits: { type: 'string' },
  },
  required: ['verdict', 'flags'],
}

const SYNTHESIS_SCHEMA = {
  type: 'object',
  properties: {
    chosenAngle: { type: 'string' },
    finalPost: { type: 'string' },
    rationale: { type: 'string' },
  },
  required: ['chosenAngle', 'finalPost', 'rationale'],
}

phase('Draft')
const context = args.context

const draftAndCritique = await pipeline(
  ANGLES,
  angle => agent(
    `${context}\n\n${angle.brief}\n\nRead docs/linkedin/voice-guide.md first, then write the LinkedIn post draft for this angle.`,
    { label: `draft:${angle.key}`, phase: 'Draft', schema: DRAFT_SCHEMA, agentType: 'ghostwriter' }
  ),
  draft => parallel([1, 2].map(n => () =>
    agent(
      `Read docs/linkedin/voice-guide.md. Critique this LinkedIn post draft against it — default to "reject" on uncertainty, don't give benefit of the doubt on hype/overclaiming.\n\nDraft:\n${draft?.draft ?? ''}`,
      { label: `critic:${n}`, phase: 'Critique', schema: CRITIC_SCHEMA, model: 'opus', effort: 'high' }
    )
  )).then(critiques => ({ draft, critiques: critiques.filter(Boolean) }))
)

phase('Synthesize')
const bundle = draftAndCritique.filter(Boolean)
const synthesisPrompt = `Here are 3 drafted angles for a LinkedIn post with their critiques:\n\n${JSON.stringify(bundle, null, 2)}\n\nRead docs/linkedin/voice-guide.md. Pick the strongest angle (or blend the best lines across them) and produce one final, polished post that passes every voice-guide category. Explain the choice in one sentence.`
const final = await agent(synthesisPrompt, { schema: SYNTHESIS_SCHEMA, model: 'opus', effort: 'high', label: 'synthesis' })

return { drafts: bundle, final }
```

If the Workflow errors out or a stage flakes (e.g. a structured-output retry-cap failure), do not loop on retrying it — fall back to drafting the post yourself inline (still reading the voice guide first), and say plainly that the Workflow didn't complete. Getting the user a usable draft matters more than the orchestration succeeding.

### 3. Present + save

Show the user:
- The final post, exactly as written (so they can copy-paste it).
- The one-sentence rationale for the chosen angle.
- A one-line mention of the two alternates considered (not the full text, just what they were).

Ask if they want to approve as-is, edit, or regenerate with different guidance (if regenerating, re-run step 2 with their feedback appended to `context` — don't redo step 1 unless the gap is about source material itself).

On approval, `Write` the result to `docs/linkedin/YYYY-MM-DD-<target>-<slug>.md` (use today's actual date, the subject as `<target>`, and a short slug) with this frontmatter:

```yaml
---
date: YYYY-MM-DD
target: <project name>
angle: <chosen angle>
status: draft
---
```

followed by the final post text, then a `## Alternates considered` section listing the other two angles' one-line gist (not full drafts — just enough to remember why they lost).

Never post anywhere automatically — this command only ever produces text for the user to paste themselves. When they tell you a post has actually gone live, update that file's `status` to `posted` if asked, but don't do that unprompted.
