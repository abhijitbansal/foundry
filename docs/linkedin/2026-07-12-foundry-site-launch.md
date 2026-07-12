---
date: 2026-07-12
target: foundry (this site)
angle: craft/process
status: draft
---

There are three hidden marks in my portfolio site now — an anvil in the footer you strike, a set of working drawings you can pull over the page, a night whistle at the end of the shift. The detail I'm happiest with: not one of them ships an audio file.

The site's whole pitch is no trackers, no analytics, nothing loaded that you didn't ask for. So when I wanted the anvil to ring as you strike it, an MP3 felt like cheating. Every sound is synthesized live in the browser with WebAudio instead.

The hammer blow is three sine partials over a filtered burst of noise. The whistle — hold the commit yard until the shift ends — is a triangle oscillator with a vibrato LFO and a delay line for the echo. Tuned by ear, frequency by frequency.

prefers-reduced-motion drops the sparks and keeps the sound.

abhijitbansal.com

## Alternates considered

- **outcome/what-it-does** — led with the site regenerating itself from real commit activity (isometric commit-city) and weekly session-log digests instead of a static project list. Solid and fully verified against the repo, but the opener used a banned "isn't X, it's Y" reveal-hook cadence and over-repeated "actual/real" for emphasis instead of precision.
- **personal-motivation** — led with most of the proudest work living in private repos (doc-scan, folix, floorprint), and Foundry existing to be the one link that finally shows all of it. Honest and on-voice, but restates the About page rather than adding new ground.
