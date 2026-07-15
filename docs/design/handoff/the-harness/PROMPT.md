# Build prompt — Foundry: The Harness (exploration 05)

Implement the harness showcase section in the Astro portfolio site (this repo).
The approved reference is `src/Foundry 5A - Harness.dc.html` + `src/harness-hall.jsx`
in this folder — treat their copy, data, coordinates, and interaction logic as the
spec. Same design-token system as the earlier Foundry handoff; dark theme.

## Placement — part of the main page

This is a section of the main portfolio page, NOT a standalone route:

- **Skip the reference's fixed header entirely** (it's preview-only; the reference
  gates it behind a `showNav` flag — build as if it's off).
- Keep anchor ids on the six sections: `routing`, `lifecycle`, `tracker`, `paper`,
  `arsenal`, `score` (prefix them, e.g. `harness-routing`, if they collide).
  Wire the main page's existing menu to whichever entry point makes sense.
- Replace the hero's 150px top padding with the page's normal section spacing.
- `scroll-margin-top` on sections should match the main page's real header height.

## Components (Astro island or build-time SVG)

`src/harness-hall.jsx` defines `window.FoundryHarness` with five React components,
all pure SVG, all token-colored, no dependencies beyond global `React`:

- `Hall({motion})` — hero machine hall (intake → guards → routing tower → three
  furnaces → casting → records → lessons-return pipe).
- `Switchyard({scenario})` — routing diagram; `scenario ∈ fix|review|wave|audit|team`.
- `Lifecycle()` — five-station hook conveyor.
- `Tracker()` — two-loop ledger figure.
- `Loop()` — audit loop figure (score section).

Only `Switchyard` re-renders on state; `Hall` takes a boolean to gate ambient
animation classes. All are deterministic — everything except `Switchyard` can be
pre-rendered to static SVG at build time if you prefer zero client JS for them.
**Port coordinates and label positions verbatim** — they are collision-tuned
against long captions; do not re-layout or "clean up" magic numbers.

Global CSS needed: keyframes `fyh-flow`, `fyh-smoke`, `fyh-glow` + their classes,
and the `prefers-reduced-motion` override (copy from the reference `<style>`).

## Page structure & state

Six sections + footer CTA, copy verbatim from the reference. Client state is one
variable: the active scenario (default `wave`). The pill row, mode label, ask
line, and detail lines all derive from the `DEFS` array in the reference's logic
class — copy it as data. Dimension scores for section 06 are the `dims` array.

## Easter egg — the service hatch (three layers)

1. **Source comment.** Near the top of the served HTML, emit the
   `HELLO, AGENT.` comment block verbatim from the reference (the box-drawing
   frame included). It must survive the build — in Astro use
   `<Fragment set:html={...}>` or check that the compiler keeps raw comments;
   verify with `curl | head` on the built output. Purpose: anyone who points an
   agent (or curl) at the page source finds an honest digest of AGENTS.md.
2. **Console.** On load, print the styled `▍ FOUNDRY — SERVICE HATCH` banner and
   define `window.AGENTS = () => {...}` printing the register digest — copy both
   strings and the `%c` styles from the reference `componentDidMount`. Print
   once per page load; guard against double-registration on client-side nav.
3. **The tell.** The faint caption at the end of section 04 ("There's more here
   than the outline…") is the only on-page hint. Keep it faint
   (`--ds-text-faint`).

If the main page already has a console banner (earlier eggs handoff prints the
three-marks riddle), print this one after it — two short blocks are fine; don't
merge them.

## Acceptance

- No fixed header from this section; main page menu deep-links to the anchors.
- Scenario switch works with mouse, touch, and keyboard (they're real buttons).
- `curl` of the built page shows the HELLO, AGENT block; `AGENTS()` works in
  the console; no other console noise or errors.
- `prefers-reduced-motion`: flow/smoke/glow animations off; everything readable.
- All figures inherit tokens — verify they recolor correctly if the accent swaps.
- No new dependencies, no images, no trackers; numbers in copy unchanged.
