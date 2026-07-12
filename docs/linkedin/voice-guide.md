# LinkedIn voice guide

The tone contract for `/linkedin-post`. Every draft and every critique pass in that command's Workflow is pointed at this file. If a draft trips one of the four categories below, it gets edited or killed before it reaches the user — no exceptions for "but it's punchier this way."

## The register, anchored in real copy already on this site

This isn't an abstract "be humble" instruction — it's the voice already established across the site. Match it:

- "Designed, engineered, and shipped end to end — solo. Apps on the App Store, tools in the open, infrastructure underneath." (`Hero.astro`)
- "I design, build, test, and ship — apps, tooling, sites. No teams, no hand-offs: the same hands that sketch the interface write the Swift, cut the release, and answer the support mail." (`About.astro`)
- "Privacy-first is a conviction, not a feature flag: my apps run on-device with zero telemetry." (`About.astro`)
- "No trackers · No analytics · Nothing to consent to" (`Footer.astro`)

Pattern: factual claim first, metaphor (forge/melt/crucible) only for flavor, never for inflation. Confidence comes from precision ("on-device, zero telemetry, end-to-end"), not from adjectives. Solo work is stated plainly as solo — "no teams, no hand-offs" reads as more impressive than "full-stack solo founder" ever would, because it's a specific claim instead of a title.

## The four things a draft must never do

### 1. Hype words
Banned outright: "thrilled/excited/humbled to announce", "game-changing", "revolutionary", "next-level", "unlock", "supercharge", exclamation points doing the work a verb should do. If the sentence would sound the same read by a PR intern as by the person who actually wrote the code, rewrite it.

### 2. Growth-hacker structure
Banned: engagement-bait openers ("Nobody talks about this...", "Here's what they don't tell you..."), fake-vulnerability hooks used purely as a hook, numbered-listicle humble-brags ("5 things I learned building X — #3 will surprise you"), CTA begging ("drop a 🔥 if you agree", "comment below"). State the thing. Let it be interesting or don't post it.

### 3. Overclaiming scope
This is a solo portfolio project, not a startup. Never imply a team, funding, users, or traction that don't exist. Never call a personal project "disrupting" an industry. If the post needs an exaggeration to be worth posting, the post isn't ready — go find the real detail that makes it worth posting instead.

### 4. Emoji/formatting excess
No emoji bullet lists. No bold-every-line. No one-sentence-per-paragraph dramatic pacing (the "so. many. line. breaks." LinkedIn-guru cadence). Line breaks are fine for separating actual ideas — they are not a rhythm instrument.

### 5. Technical detail as its own flex
A draft can pass all four categories above — no hype words, no hook structure, no overclaiming, no emoji — and still read as showing off, because the sheer amount or specificity of technical detail is itself doing the bragging. (Real case: a draft describing exact oscillator types and filter chains for a hidden sound effect was rejected as "still showing off kind of" despite being fully accurate and unhyped.) Default to the plainest version of the announcement — what it is, what problem it solves, that it updates — and only add technical specifics if the user asks for that angle explicitly. When in doubt, cut detail rather than add it.

## Quick self-test before a draft ships

Read the draft back and ask two things: (1) would this read the same if it were posted by someone who didn't build the thing — if yes, it's marketing copy wearing a personal-post costume; (2) am I trying to impress with volume of detail rather than just stating what happened — if yes, cut it down to the plain announcement.
