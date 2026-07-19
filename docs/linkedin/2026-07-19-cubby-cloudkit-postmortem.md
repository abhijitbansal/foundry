---
date: 2026-07-19
target: Cubby (SwiftData + CloudKit production postmortem article)
angle: targeting-lead + mystery hook, user-edited final
status: scheduled
scheduled_time: 2026-07-19 12:15
---

If you're building private, on-device sync on Apple platforms, it'll save you some of that pain.

Every record type in Cubby's CloudKit schema had a field I never wrote — not in my code, not in git history, and a unit test proved my model didn't define it either.

Turned out to be Apple's own, buried in the CoreData binary. That's the opener of a write-up on shipping SwiftData + CloudKit to production — two real incidents, a binary-forensics dead end, and the release gate that stops it happening again.

All of this possible only because of fable 5, opus and sonnet didnt succeed, took few hours of debugging but got there.

Always privacy-first, on-device, no accounts

Feedback and war stories welcome: https://gotcubby.com/swiftdata-cloudkit-production.html

#fable5

## Rejected versions

- **craft/process (Workflow draft)** — led fully with the CD_moveReceipt binary-forensics detective story. Accurate and unhyped but both critics rejected it as detail-as-flex: the volume/specificity of the debugging narrative was itself doing the bragging.
- **outcome/what-it-does (Workflow draft)** — opened with "Apple documents the pieces, never the whole" and teased "the two ways it fails silently" without naming them. Flagged for a curiosity-gap/aphoristic-hook structure (category 2) and folded into the synthesis after trimming.
- **personal-motivation (Workflow draft)** — same two incidents, framed as "why I wrote this up." Needs-edit for detail volume on the Dev-vs-Prod-diff mechanism; contributed the plain first-person opener to the synthesized draft.
- **synthesis (Workflow output, first user-reviewed draft)** — blend of outcome + motivation, fully plain, no hook. User's response: "bored," wanted the tease back.
- **inline variant A/B (post-workflow, tease restored)** — two hand-drafted options reintroducing the CD_moveReceipt mystery as a genuine hook (not a manufactured curiosity-gap) at ~70–90 words each, per advisor guidance that the article's own real mystery is intriguing on its own terms, unlike a withheld-count tease. User picked variant B's payoff style, asked for a targeting line ("if you're building private sync on Apple, read this") and a privacy-conviction line.
- **merged draft (pre-final)** — combined tease + targeting + conviction lines. User then reordered (targeting line moved to open), added the Fable 5 / Opus / Sonnet model-attribution line (grounded in session 0053's actual model routing — Sonnet's research was inconclusive, Fable's binary-forensics call was decisive) and the `#fable5` tag as the final posted version.
