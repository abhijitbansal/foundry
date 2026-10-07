# Drawing Set Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-theme and re-lay-out abhijitbansal.com as Direction A, "Drawing Set". Every page becomes a sheet in one set of construction drawings. The isometric yard replaces the Three.js orb as the home hero, and the yard re-themes through tokens only.

**Architecture:** One new theme layer (`src/styles/drawing-set.css`) loads last. It redefines every `--ds-*`/`--fy-*` token and restyles the vendored DS classes, so the whole site re-skins with no markup edits (Phase 1). Then the shared chrome (sheet-index nav, title-block footer, `SheetHead`) replaces the repeated hero formula (Phase 2). Then the home page is rebuilt around the yard (Phase 3). The rest of the telemetry moves to its own `/telemetry/` sheet (Phase 4). Phase 5 is cleanup and docs. The yard SVG generator (`src/lib/works-svg.ts`, `src/lib/works.ts`) is **not edited**: it reads 23 CSS variables and nothing else.

**Tech Stack:** Astro 7 (static), TypeScript, vitest + jsdom, plain CSS custom properties. Google Fonts: Archivo (variable `wdth` 62–125, `wght` 100–900, with italics) and IBM Plex Mono. No new dependencies. `three` and `@types/three` are **removed**.

**Spec:** `.scratch/redesign/proposal.md` (gitignored, local) and the approved canvas https://claude.ai/artifact/8urhubUay8km8MbHDWYkvM. Committed reference copies of the approved artboards, with the yard stripped, live in `docs/plans/2026-10-06-drawing-set/`. `A-Home.reference.html` is the home layout, `A-Night.reference.html` the dark theme, `A-Mobile.reference.html` the 390px layout, and `Tokens.reference.html` the palette and type. They are Claude Design `.dc.html` sources: read them for layout, spacing and copy, not as code to paste.

**Branch:** `feat/drawing-set-redesign` (already created). One branch, many atomic commits, one PR at the end (AGENTS.md).

**Routing (plan-time, per AGENTS.md):**

| Role | Model | Effort |
|---|---|---|
| Default executor (every task unless tagged) | Sonnet 5.5 | high |
| Per-task reviewer | Opus 5.5 | medium |
| Browser acceptance at each phase gate | orchestrator (this session) | — |
| Task 10 (dead-CSS sweep) | Sonnet 5.5 | medium |

Executors may commit, path-scoped, using the message given in each task. Executors may **not** push, open PRs, or edit AGENTS.md except in Task 10. Reviewers report only and never write session logs or project docs.

## Global Constraints

- **Colours live only in `src/styles/drawing-set.css`.** No hex literal may appear in any `.astro`, `.ts` or `.tsx` under `src/`. The sole exception is `eggs.ts` console `%c` styles, which cannot read CSS vars.
- **Day sheet:** bg `#EDECE6`, surface `#F4F3EE`, surface-2 `#E3E2DA`, line `#CFCEC5`, line-strong `#8E908C`, text `#17191A`, text-2 `#3F4446`, text-3 `#5F6466`, text-faint `#9A9D9B`, redline `#B5341A` (darkened from the canvas's `#C23B1E`, which is only 4.10:1 on surface-2).
- **Night sheet:** bg `#121415`, surface `#161819`, surface-2 `#1C1F20`, line `#2A2D2E`, line-strong `#4A4E4F`, text `#E8E7E0`, text-2 `#B9BBB6`, text-3 `#8D908C`, text-faint `#5A5D5B`, redline `#F0643F`.
- **Colour-family rule (replaces PR #25's cyan/ember rule):** interaction is **ink** (`--ds-accent` = `--ds-text`) at rest and on hover. Hover thickens the underline and never changes hue. **Redline** (`--ds-secondary` = `--fy-ember`) means revisions, heat and lit windows only. It is never used for a link, focus ring or toggle.
- **Type:** Archivo for display and prose. Headings use `font-stretch` 112–125% at weight 700–800; prose uses normal width at 400–500. IBM Plex Mono is for numbers, sheet codes and labels. **No uppercase tracked eyebrows.** Labels are sentence case, mono, with `letter-spacing: 0`.
- **No tinted-word headlines.** No `<em style="color:…">` inside an `h1` or `h2`.
- **Corners are square.** Every `--ds-radius-*` is `0`.
- **Copy:** remove forge puns from captions and headings ("Forged here", "The forge runs hot", "the crucible remembers", "straight into the melt", "Forged in the Foundry"). Easter-egg copy is exempt. "Foundry" stays as the project name.
- **Theme default:** a stored choice wins; otherwise follow `prefers-color-scheme`. The toggle labels are "Night sheet" / "Day sheet": the label names the sheet you switch **to**.
- **All three easter eggs keep working**, with their ids, timings and sounds unchanged (`design_handoff_eggs/PROMPT.md`).
- **Verification commands:** `npm test` (vitest), `npm run build` (prebuild is offline-safe), and `npx npm@10 ci` whenever `package.json` or `package-lock.json` changes. Run them bare; don't pipe them through `head`/`tail` (global rule).

## Review Focus

1. **Forced theme versus OS theme.** A visitor with OS-light who forced dark, or OS-dark who forced light, must see every element in the chosen sheet. `brands.css` and the old `global.css` blocks carry `.brand-*` and `html:root[...]` selectors that can outrank a naive override. Pinned by Task 1's specificity selectors and Task 1's retired-palette test.
2. **Retired palette leaking through a forgotten inline style.** Many components carry inline `color:var(--ds-accent-hover)` and hand-written `color-mix(... var(--ds-accent) ...)`. After Phase 1 these must resolve to ink, not cyan. The literal-hex sweep test (`tests/unit/palette.test.ts`, Task 1) pins it.
3. **A repo in the stats archive but not in `projects.ts`, or the reverse.** The schedule must render a row with `—` for the building number and 0 storeys, never crash or drop the row. Pinned in Task 6.
4. **No weekly digests yet** (fresh clone or empty `data/weekly/`). The revisions block must not render an empty table or throw. Pinned in Task 6 (empty array) and Task 7 (component guard).
5. **Phone width (390px).** The schedule rows must stack (no clipped columns), the nav must collapse behind the burger, and the yard must keep its fullscreen button. Verified in the browser at each phase gate. The schedule's stacking is pinned by its scoped CSS in Task 8.

---

## Phase 1 — Theme layer (site-wide re-skin, no markup)

### Task 1: Token layer, fonts, contrast test, retire superseded overrides

**Files:**
- Create: `src/styles/drawing-set.css`
- Create: `tests/unit/drawing-set-tokens.test.ts`
- Create: `tests/unit/palette.test.ts`
- Modify: `src/layouts/BaseLayout.astro`: the font `<link>` and a new import after `global.css`
- Modify: `src/styles/global.css`: delete the blocks listed in Step 6

**Interfaces:**
- Produces: the token values every later task consumes, via `var(--ds-*)` / `var(--fy-ember)`. The marker comments `/* @palette day */`, `/* @palette night */` and `/* @end */` are a contract with the test; keep them.

- [ ] **Step 1: Write the failing contrast test**

`tests/unit/drawing-set-tokens.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(resolve(__dirname, '../../src/styles/drawing-set.css'), 'utf8');

function palette(name: 'day' | 'night'): Record<string, string> {
	const start = css.indexOf(`/* @palette ${name} */`);
	const end = css.indexOf('/* @end */', start);
	if (start < 0 || end < 0) throw new Error(`palette ${name} markers missing`);
	const block = css.slice(start, end);
	const out: Record<string, string> = {};
	for (const m of block.matchAll(/(--[a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})\s*;/g)) out[m[1]] = m[2].toUpperCase();
	return out;
}

function luminance(hex: string): number {
	const [r, g, b] = [1, 3, 5]
		.map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
		.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

describe.each(['day', 'night'] as const)('drawing-set %s palette', (name) => {
	const p = palette(name);
	const grounds = ['--ds-bg', '--ds-surface', '--ds-surface-2'];
	const inks = ['--ds-text', '--ds-text-2', '--ds-text-3', '--ds-secondary'];

	it('defines every token the site and the yard SVG read', () => {
		for (const t of [...grounds, ...inks, '--ds-line', '--ds-line-strong', '--ds-text-faint', '--ds-accent', '--ds-on-accent', '--fy-ember']) {
			expect(p[t], t).toMatch(/^#[0-9A-F]{6}$/);
		}
	});

	it.each(inks)('%s clears WCAG AA (4.5:1) on every ground', (ink) => {
		for (const g of grounds) expect(contrast(p[ink], p[g]), `${ink} on ${g}`).toBeGreaterThanOrEqual(4.5);
	});

	it('interaction is ink: accent equals text, and on-accent reads on it', () => {
		expect(p['--ds-accent']).toBe(p['--ds-text']);
		expect(contrast(p['--ds-on-accent'], p['--ds-accent'])).toBeGreaterThanOrEqual(4.5);
	});

	it('redline is the one hue: ember equals secondary', () => {
		expect(p['--fy-ember']).toBe(p['--ds-secondary']);
	});
});
```

- [ ] **Step 2: Write the failing retired-palette test**

`tests/unit/palette.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Hex literals of the retired cyan/ember palette (PR #25 and earlier). The
// vendored token files under src/styles/tokens/ are exempt: they're
// generated upstream and overridden by drawing-set.css, never edited here.
const RETIRED = ['#0E8FB0', '#34D3EE', '#0B7894', '#5ADCF1', '#236F86', '#175260', '#62C4D8', '#7FD0E0', '#AE4318', '#E8663A', '#B07A18', '#E8B94A', '#D9A93F'];

function walk(dir: string): string[] {
	return readdirSync(dir).flatMap((f) => {
		const p = join(dir, f);
		if (statSync(p).isDirectory()) return p.endsWith(join('styles', 'tokens')) ? [] : walk(p);
		return /\.(astro|ts|tsx|css)$/.test(p) ? [p] : [];
	});
}

// Skipped until Task 10's sweep clears the last retired literals — un-skip in Task 10.
describe.skip('retired palette', () => {
	const files = walk(resolve(__dirname, '../../src'));

	it.each(RETIRED)('%s appears nowhere in src/ outside the vendored tokens', (hex) => {
		const hits = files.filter((f) => readFileSync(f, 'utf8').toUpperCase().includes(hex));
		expect(hits).toEqual([]);
	});
});
```

- [ ] **Step 3: Run both tests to verify they fail**

Run: `npx vitest run tests/unit/drawing-set-tokens.test.ts tests/unit/palette.test.ts`
Expected: the token test FAILS with `ENOENT ... drawing-set.css`; the palette test reports skipped (written `describe.skip` on purpose — Task 10 un-skips it after the sweep). Sanity-check it once by deleting `.skip`: it must list hits in `global.css`, `eggs.ts`, `Footer.astro`. Restore `.skip`.

- [ ] **Step 4: Create the token layer**

`src/styles/drawing-set.css`:

```css
/* drawing-set.css — Direction A "Drawing Set" theme layer.
   docs/plans/2026-10-06-drawing-set.md. Loaded LAST (BaseLayout.astro), so
   it outranks foundation.css / brands.css / components.css (vendored,
   never edited) and global.css. Selectors are html:root[data-theme=…]
   (0,2,1) so they tie-or-beat every surviving brands.css/global.css rule
   and win on source order. theme.ts always sets data-theme before first
   paint; the bare :root block is the no-JS fallback.

   Colour-family rule: interaction is INK (--ds-accent = --ds-text, hover
   thickens the underline, never changes hue). REDLINE (--ds-secondary =
   --fy-ember) is revisions, heat and lit windows only — never a link,
   focus ring or toggle. */

/* ---- theme-independent: type, radii, motion ---- */
:root {
  --ds-font-display: "Archivo", "Helvetica Neue", Arial, sans-serif;
  --ds-font-body: "Archivo", "Helvetica Neue", Arial, sans-serif;
  --ds-font-mono: "IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --ds-radius-xs: 0;
  --ds-radius-sm: 0;
  --ds-radius-md: 0;
  --ds-radius-lg: 0;
  --ds-radius-xl: 0;
  --ds-radius-icon: 0;
  --ds-radius-pill: 0;
  --ds-ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --fy-sheet-rule: 2px;
  --fy-night-bg: #0D1013; /* egg 3 veil target — Night Shift ground */
}

/* ---- Day sheet (light) ---- */
:root,
html:root[data-theme="light"],
html:root[data-theme="light"] body.ds-root,
html:root[data-theme="light"] .brand-skills,
html:root[data-theme="light"] .brand-paperix,
html:root[data-theme="light"] .brand-floorprint,
html:root[data-theme="light"] .brand-cartoon {
  /* @palette day */
  --ds-bg: #EDECE6;
  --ds-surface: #F4F3EE;
  --ds-surface-2: #E3E2DA;
  --ds-line: #CFCEC5;
  --ds-line-strong: #8E908C;
  --ds-text: #17191A;
  --ds-text-2: #3F4446;
  --ds-text-3: #5F6466;
  --ds-text-faint: #9A9D9B;
  --ds-accent: #17191A;
  --ds-accent-hover: #17191A;
  --ds-on-accent: #EDECE6;
  --ds-secondary: #B5341A;
  --fy-ember: #B5341A;
  /* @end */
  --ds-accent-soft: rgba(23, 25, 26, 0.08);
  --ds-tertiary: var(--ds-text-3);
  --fy-ember-soft: rgba(181, 52, 26, 0.10);
  --ds-shadow-card: none;
  --ds-shadow-pop: none;
  color-scheme: light;
}

/* ---- Night sheet (dark) ---- */
html:root[data-theme="dark"],
html:root[data-theme="dark"] body.ds-root,
html:root[data-theme="dark"] .brand-skills,
html:root[data-theme="dark"] .brand-paperix,
html:root[data-theme="dark"] .brand-floorprint,
html:root[data-theme="dark"] .brand-cartoon {
  /* @palette night */
  --ds-bg: #121415;
  --ds-surface: #161819;
  --ds-surface-2: #1C1F20;
  --ds-line: #2A2D2E;
  --ds-line-strong: #4A4E4F;
  --ds-text: #E8E7E0;
  --ds-text-2: #B9BBB6;
  --ds-text-3: #8D908C;
  --ds-text-faint: #5A5D5B;
  --ds-accent: #E8E7E0;
  --ds-accent-hover: #E8E7E0;
  --ds-on-accent: #121415;
  --ds-secondary: #F0643F;
  --fy-ember: #F0643F;
  /* @end */
  --ds-accent-soft: rgba(232, 231, 224, 0.10);
  --ds-tertiary: var(--ds-text-3);
  --fy-ember-soft: rgba(240, 100, 63, 0.14);
  --ds-shadow-card: none;
  --ds-shadow-pop: none;
  color-scheme: dark;
}

/* no-JS + OS dark: mirror the night sheet onto the bare :root fallback */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --ds-bg: #121415;
    --ds-surface: #161819;
    --ds-surface-2: #1C1F20;
    --ds-line: #2A2D2E;
    --ds-line-strong: #4A4E4F;
    --ds-text: #E8E7E0;
    --ds-text-2: #B9BBB6;
    --ds-text-3: #8D908C;
    --ds-text-faint: #5A5D5B;
    --ds-accent: #E8E7E0;
    --ds-accent-hover: #E8E7E0;
    --ds-accent-soft: rgba(232, 231, 224, 0.10);
    --ds-on-accent: #121415;
    --ds-secondary: #F0643F;
    --fy-ember: #F0643F;
    color-scheme: dark;
  }
}

/* ---- base ---- */
body.ds-root {
  background: var(--ds-bg);
  color: var(--ds-text);
  font-family: var(--ds-font-body);
  font-size: 17px;
  line-height: 1.5;
}
a {
  color: var(--ds-text);
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}
a:hover {
  color: var(--ds-text);
  text-decoration-thickness: 2.5px;
}
::selection {
  background: color-mix(in srgb, var(--ds-secondary) 24%, transparent);
}
:focus-visible {
  outline: 2px solid var(--ds-text);
  outline-offset: 3px;
}
```

- [ ] **Step 5: Wire fonts and the import**

In `src/layouts/BaseLayout.astro`, replace the Google Fonts `<link rel="stylesheet" …>` `href` with:

```
https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,100..900;1,62..125,100..900&family=IBM+Plex+Mono:wght@400;500;600&display=swap
```

Add the import after the `global.css` import line:

```ts
import '../styles/drawing-set.css';
```

- [ ] **Step 6: Delete the superseded `global.css` blocks**

Find each block by its comment header and delete the comment plus every rule it introduces, up to the next comment header:

1. `/* SUR-4: paper-tooth grain …` covers the three `body.ds-root` `background-image` rules. The sheet is clean film; there is no grain.
2. `/* Light theme only: swap the resting/hover pair. …` covers the `[data-theme="light"] a` and `a:hover` rules. Also delete the plain `a { color: var(--ds-accent); }` and `a:hover { … }` rules just above that comment, plus the `::selection` and `:focus-visible` rules just below it. `drawing-set.css` now owns all four.
3. `/* SUR-1 …` (`--ds-shadow-card` overrides) covers the `html:root`, `html:root[data-theme="dark"]` and `@media` shadow blocks.
4. `/* Light-theme .ds-btn legibility fix …` and `/* PAL-2 judge-found fix …`.
5. `/* PAL-2: desaturate both accents …` through the end of `/* Accent-tint surface tiers (PAL-6) …`. That covers PAL-2, the dark twin, PAL-3's `body.ds-root` accent blocks, BRA-1's `--fy-ember`, and PAL-6's `--fy-tint-*`.
   **Before deleting PAL-6:** run `grep -rn "fy-tint" src`. Any consumer must be rewritten to `color-mix(in srgb, var(--ds-text) 6%, var(--ds-surface))` for tint-1, 14% for tint-2 and 28% for tint-3. `--fy-tint-warn-1` becomes `var(--ds-surface-2)`. Do that in the same commit.

- [ ] **Step 7: Run the token test and the full suite**

Run: `npx vitest run tests/unit/drawing-set-tokens.test.ts`
Expected: PASS (2 palettes × 4 test groups).
Run: `npm test`
Expected: the palette test is skipped. `telemetry.test.ts` heat-ramp and model-mix tests still PASS (Task 3 changes those). Every other test PASSes.
Run: `npm run build`
Expected: exit 0.

- [ ] **Step 8: Commit**

```bash
git add src/styles/drawing-set.css src/styles/global.css src/layouts/BaseLayout.astro tests/unit/drawing-set-tokens.test.ts tests/unit/palette.test.ts
git commit -m "feat(theme): drawing-set token layer — film/ink/redline palettes, Archivo + Plex Mono" -- src/styles/drawing-set.css src/styles/global.css src/layouts/BaseLayout.astro tests/unit/drawing-set-tokens.test.ts tests/unit/palette.test.ts
```

### Task 2: Restyle the vendored DS classes in the theme layer

**Files:**
- Modify: `src/styles/drawing-set.css` (append)
- Modify: `src/styles/global.css`, only where a rule below is outranked (see Step 2)

**Interfaces:**
- Consumes: the Task 1 tokens.
- Produces: the visual language every later task's markup relies on. `.ds-btn` is the ink button. `.ds-btn-quiet` is a **text link**, not an outline button. `.ds-kicker` is the sheet-code label. `.ds-pill` is a square status mark. `.ds-rule` is a 2px ink rule.

- [ ] **Step 1: Append the class layer**

Append to `src/styles/drawing-set.css`:

```css
/* ===== DS class restyle — kills the eyebrow / pill / ghost-button / rounded-card idioms site-wide ===== */
.ds-display-xl { font-family: var(--ds-font-display); font-weight: 750; font-stretch: 118%; font-size: clamp(40px, 5.2vw, 74px); line-height: 1; letter-spacing: -0.018em; }
.ds-display-lg { font-family: var(--ds-font-display); font-weight: 800; font-stretch: 125%; font-size: clamp(32px, 3.6vw, 52px); line-height: 1; letter-spacing: -0.012em; }
.ds-display-md { font-family: var(--ds-font-display); font-weight: 750; font-stretch: 118%; font-size: clamp(20px, 2vw, 24px); line-height: 1.15; letter-spacing: -0.005em; }
.ds-title { font-weight: 700; font-stretch: 112%; }
.ds-heading { font-weight: 700; font-stretch: 112%; }
.ds-lead { font-size: 19px; line-height: 1.5; color: var(--ds-text-2); }

.ds-kicker {
  font-family: var(--ds-font-mono);
  font-weight: 400;
  font-size: 13.5px;
  line-height: 1.3;
  letter-spacing: 0;
  text-transform: none;
  color: var(--ds-text-3);
}
.ds-micro {
  font-family: var(--ds-font-mono);
  font-weight: 400;
  font-size: 12.5px;
  line-height: 1.4;
  letter-spacing: 0;
  text-transform: none;
}

.ds-rule { height: var(--fy-sheet-rule); background: var(--ds-text); margin: 14px 0 0; }
.ds-rule::before { display: none; }

.ds-btn {
  font-family: var(--ds-font-body);
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 0;
  min-height: 48px;
  padding: 0 22px;
  border: 0;
  border-radius: 0;
  background: var(--ds-text);
  color: var(--ds-bg);
}
.ds-btn:hover { background: color-mix(in srgb, var(--ds-text) 84%, var(--ds-bg)); color: var(--ds-bg); transform: none; }
.ds-btn:active { transform: translateY(1px); }
.ds-btn:focus-visible { box-shadow: none; outline: 2px solid var(--ds-text); outline-offset: 3px; }

.ds-btn-quiet {
  font-family: var(--ds-font-body);
  font-weight: 500;
  font-size: 16px;
  min-height: 44px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: none;
  color: var(--ds-text);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}
.ds-btn-quiet:hover { color: var(--ds-text); text-decoration-thickness: 2.5px; }
.ds-btn-quiet:focus-visible { box-shadow: none; outline: 2px solid var(--ds-text); outline-offset: 3px; }

.ds-pill {
  padding: 0;
  border: 0;
  border-radius: 0;
  background: none;
  font-family: var(--ds-font-mono);
  font-weight: 400;
  font-size: 12.5px;
  letter-spacing: 0;
  text-transform: none;
  color: var(--ds-text-2);
}
.ds-pill::before { width: 8px; height: 8px; border-radius: 0; background: currentColor; }

.ds-chip {
  font-weight: 400;
  font-size: 12.5px;
  letter-spacing: 0;
  text-transform: none;
  border-radius: 0;
  border-color: var(--ds-line-strong);
  background: transparent;
  color: var(--ds-text-2);
}

.ds-card,
.fy-plate,
.fy-well {
  border-radius: 0;
  box-shadow: none;
  background: transparent;
  border: 1px solid var(--ds-line-strong);
}
.fy-plate:hover,
.fy-tilt:hover { border-color: var(--ds-text); box-shadow: none; transform: none; }

.ds-callout {
  border-left: 0;
  border-top: var(--fy-sheet-rule) solid var(--ds-text);
  border-radius: 0;
  background: transparent;
  padding: 14px 0 0;
}

.ds-link,
.fy-link-underline { color: var(--ds-text); border-bottom: 0; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }
.ds-link:hover,
.fy-link-underline:hover { text-decoration-thickness: 2.5px; }

.fy-link-t2:hover,
.fy-link-t3:hover { color: var(--ds-text); }
```

- [ ] **Step 2: Fix any rule that outranks this layer**

Run: `grep -nE "\.(fy-plate|fy-well|ds-btn|ds-pill|ds-chip|ds-kicker|fy-tilt)[^{]*\{" src/styles/global.css`

For every hit whose selector is more specific than the matching rule above (for example `html:root[data-theme="dark"] .fy-plate`), delete the hit's declarations that conflict (`box-shadow`, `background`, `border-*`, `border-radius`, `transform`). Leave its other declarations. Those delete-only edits go in this commit.

- [ ] **Step 3: Build and check in the browser (orchestrator gate)**

Run: `npm run build && npx astro preview --port 4321` (background).
The orchestrator screenshots `/`, `/updates/`, `/harness/`, `/craft/` and `/404` in both themes at 1440px and 390px. For each screenshot it confirms four things:
- (a) There are no rounded corners.
- (b) There is no cyan or ember: links are ink and lit windows are redline.
- (c) There are no uppercase tracked labels.
- (d) Text stays legible on every card.
Use `getComputedStyle` on one `.ds-kicker`, one `.ds-btn`, one `a` and one `.fy-plate` per page to confirm the resolved values (memory: verify CSS in the browser, don't reason about the cascade).

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(theme): restyle DS classes — ink buttons, text-link quiet buttons, square marks, sentence-case labels" -- src/styles/drawing-set.css src/styles/global.css
```

### Task 3: Data ramps, yard night egg palette, theme default

**Files:**
- Modify: `src/lib/telemetry.ts:35-48` (`heatBucketColor`), `src/lib/telemetry.ts:109-116` (`MODEL_MIX_COLORS`)
- Modify: `tests/unit/telemetry.test.ts:53-57` and `:178-183`
- Modify: `src/lib/theme.ts`, `tests/unit/theme.test.ts`
- Modify: `src/styles/global.css`: cut the `/* Egg 3 — the yard card's night palette …` block (`.fy-yard-night` + `.fy-yard-night svg.fyw-svg`)
- Modify: `src/styles/drawing-set.css`: paste the retuned egg 3 block

**Interfaces:**
- Produces: `heatBucketColor(bucket)` strings (graphite density, redline peak). `MODEL_MIX_COLORS` (graphite steps plus one redline). `noFlashInlineScript()` now follows the system when nothing is stored, and `readTheme()` defaults to `'light'`.

- [ ] **Step 1: Update the failing tests first**

In `tests/unit/telemetry.test.ts`, replace the five ramp expectations with:

```ts
		['quiet', 'var(--ds-surface-2)'],
		['low', 'color-mix(in srgb, var(--ds-text) 22%, var(--ds-surface-2))'],
		['mid', 'color-mix(in srgb, var(--ds-text) 50%, var(--ds-surface-2))'],
		['high', 'var(--ds-text)'],
		['peak', 'var(--ds-secondary)'],
```

and the model-mix colour list with:

```ts
			'var(--ds-text)',
			'var(--ds-secondary)',
			'var(--ds-text-2)',
			'var(--ds-text-3)',
			'var(--ds-line-strong)',
			'var(--ds-text-faint)',
```

Rewrite `tests/unit/theme.test.ts`'s second and third cases:

```ts
  it('readTheme defaults to light when data-theme is absent or unrecognized', () => {
    expect(readTheme()).toBe('light');

    document.documentElement.setAttribute('data-theme', 'something-else');
    expect(readTheme()).toBe('light');

    document.documentElement.setAttribute('data-theme', 'dark');
    expect(readTheme()).toBe('dark');
  });

  it('noFlashInlineScript: a stored choice wins, otherwise the OS preference decides', () => {
    const run = (stored: string | null, osDark: boolean) => {
      document.documentElement.removeAttribute('data-theme');
      localStorage.clear();
      if (stored) localStorage.setItem(THEME_KEY, stored);
      window.matchMedia = ((q: string) => ({ matches: osDark && q.includes('dark') })) as unknown as typeof window.matchMedia;
      new Function(noFlashInlineScript())();
      return document.documentElement.getAttribute('data-theme');
    };
    expect(run(null, true)).toBe('dark');
    expect(run(null, false)).toBe('light');
    expect(run('light', true)).toBe('light');
    expect(run('dark', false)).toBe('dark');
    expect(run('garbage', true)).toBe('dark');
  });
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/unit/telemetry.test.ts tests/unit/theme.test.ts`
Expected: FAIL on the ramp, model-mix and both theme cases.

- [ ] **Step 3: Implement**

`src/lib/telemetry.ts` `heatBucketColor`:

```ts
export function heatBucketColor(bucket: HeatBucket): string {
	switch (bucket) {
		case 'quiet':
			return 'var(--ds-surface-2)';
		case 'low':
			return 'color-mix(in srgb, var(--ds-text) 22%, var(--ds-surface-2))';
		case 'mid':
			return 'color-mix(in srgb, var(--ds-text) 50%, var(--ds-surface-2))';
		case 'high':
			return 'var(--ds-text)';
		case 'peak':
			return 'var(--ds-secondary)';
	}
}
```

`MODEL_MIX_COLORS`:

```ts
// Graphite steps by lightness, one redline — segments stay distinguishable
// without hue (drawing-set rule: redline is the only colour).
const MODEL_MIX_COLORS = [
	'var(--ds-text)',
	'var(--ds-secondary)',
	'var(--ds-text-2)',
	'var(--ds-text-3)',
	'var(--ds-line-strong)',
	'var(--ds-text-faint)',
];
```

`src/lib/theme.ts`:

```ts
export const THEME_KEY = 'fy-theme';
export type Theme = 'light' | 'dark';

// A stored choice wins; otherwise the OS preference decides.
export function noFlashInlineScript(): string {
  return `
    var t = null;
    try { t = localStorage.getItem('${THEME_KEY}'); } catch (e) {}
    if (t !== 'light' && t !== 'dark') {
      t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', t);
  `;
}

export function readTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}
```

Keep `setTheme` and `toggleTheme` unchanged.

Egg 3: cut the `.fy-yard-night` and `.fy-yard-night svg.fyw-svg` rules out of `global.css`. Append this to `drawing-set.css`. It is the Night Shift palette from the rejected Direction B, reused as the egg's surprise:

```css
/* Egg 3 — the night whistle flips the yard card to the Night Shift palette
   (sodium on blue-black), independent of the visitor's sheet. !important
   beats works-svg.ts's own data-theme-conditional --fyw-* block. */
.fy-yard-night {
  background: var(--fy-night-bg) !important;
  border-color: #232A31 !important;
  --ds-surface: var(--fy-night-bg);
  --ds-surface-2: #151A1F;
  --ds-line: #232A31;
  --ds-line-strong: #3A434C;
  --ds-text: #ECE8DF;
  --ds-text-2: #B4B6B4;
  --ds-text-3: #8A8F93;
  --ds-text-faint: #4C5258;
  --ds-accent: #F2A541;
  --ds-accent-hover: #F2A541;
  --ds-accent-soft: rgba(242, 165, 65, 0.14);
  --ds-secondary: #F2A541;
  transition: background 0.9s var(--ds-ease-standard), border-color 0.9s var(--ds-ease-standard);
}
.fy-yard-night svg.fyw-svg {
  --fyw-window-lit: #F2A541 !important;
  --fyw-clerestory: #F2A541 !important;
  --fyw-hot-fill: #F2A541 !important;
  --fyw-annex-glass: color-mix(in srgb, #F2A541 32%, #151A1F) !important;
  --fyw-halo-op: 0.16 !important;
  --fyw-hot-glow-op: 0.2 !important;
  --fyw-furnace-glow-op: 0.34 !important;
  --fyw-furnace-glow-r: 16px !important;
}
```

In `src/components/Telemetry.astro`'s egg script, change the veil gradient literal `'linear-gradient(180deg,#111722,#16130F 70%)'` to `'linear-gradient(180deg,var(--ds-bg),var(--fy-night-bg) 70%)'` (token defined in Task 1). Task 7 moves this script.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS (the palette test is still skipped).

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(theme): graphite heat ramp with redline peak, graphite model mix, system theme default, night-shift yard egg" -- src/lib/telemetry.ts src/lib/theme.ts tests/unit/telemetry.test.ts tests/unit/theme.test.ts src/styles/global.css src/styles/drawing-set.css src/components/Telemetry.astro
```

**Phase 1 gate (orchestrator):** browser pass as in Task 2 Step 3, plus the yard egg: hold the yard 0.9s and confirm the sodium night shift. Then dispatch an Opus reviewer on `git diff main...HEAD`, using the report-everything sentence.

---

## Phase 2 — Shared chrome

### Task 4: Sheet-index nav, title-block footer, egg console copy

**Files:**
- Modify (rewrite markup + script): `src/components/Nav.astro`
- Delete: `src/lib/header.ts` (the solid sticky header needs no scroll-fade)
- Modify: `src/components/Footer.astro`, markup only. Its `<script>` stays byte-for-byte.
- Modify: `src/lib/eggs.ts:195-205` (`printConsoleHint`)
- Modify: `src/styles/global.css`: delete the `/* #fy-nav — acceptance-pass fix …` block (`.fy-burger` + the `@media (max-width: 900px)` nav rules); Nav now owns them in scoped CSS
- Create: `src/lib/sheet.ts`, `tests/unit/sheet.test.ts`

**Interfaces:**
- Produces: `formatSheetDate(d: Date): string` returning `"06.10.2026"` (UTC, `dd.mm.yyyy`). Also `SHEETS` (exported from `src/lib/sheet.ts`): `{ code: string; label: string; path: string }[]`, the single source for nav codes. `SheetHead` (Task 5) and `HeroYard` (Task 7) read it.
- Keeps these ids, which existing CSS and scripts depend on: `#fy-nav`, `#fy-nav-burger`, `#fy-theme-btn`, `#fy-anvil`, `#fy-anvil-mark`, `#fy-anvil-sparks`, `#fy-seal`, `#fy-footer-copy1`, `#fy-footer-copy2`.

- [ ] **Step 1: Write the failing test**

`tests/unit/sheet.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { formatSheetDate, SHEETS } from '../../src/lib/sheet';

describe('sheet.ts', () => {
	it('formats a build date as a drawing-sheet date, dd.mm.yyyy in UTC', () => {
		expect(formatSheetDate(new Date(Date.UTC(2026, 9, 6, 23, 59)))).toBe('06.10.2026');
		expect(formatSheetDate(new Date(Date.UTC(2027, 0, 1)))).toBe('01.01.2027');
	});

	it('numbers every sheet uniquely, in index order', () => {
		const codes = SHEETS.map((s) => s.code);
		expect(new Set(codes).size).toBe(codes.length);
		expect(codes).toEqual(['A-01', 'A-02', 'A-03', 'B-01', 'C-01', 'C-02']);
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/sheet.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/lib/sheet.ts`**

```ts
// sheet.ts — the drawing-set's sheet index. One source for the nav, every
// page's SheetHead code, and the footer title block.

export interface Sheet {
	code: string;
	label: string;
	path: string; // relative to BASE_URL; '' is the home page
}

export const SHEETS: Sheet[] = [
	{ code: 'A-01', label: 'Yard', path: '' },
	{ code: 'A-02', label: 'Works', path: '#schedule' },
	{ code: 'A-03', label: 'Revisions', path: 'updates/' },
	{ code: 'B-01', label: 'Telemetry', path: 'telemetry/' },
	{ code: 'C-01', label: 'Harness', path: 'harness/' },
	{ code: 'C-02', label: 'Craft', path: 'craft/' },
];

export function sheet(code: string): Sheet {
	const s = SHEETS.find((x) => x.code === code);
	if (!s) throw new Error(`unknown sheet ${code}`);
	return s;
}

export function formatSheetDate(d: Date): string {
	const dd = String(d.getUTCDate()).padStart(2, '0');
	const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
	return `${dd}.${mm}.${d.getUTCFullYear()}`;
}
```

- [ ] **Step 4: Rewrite `src/components/Nav.astro`**

```astro
---
// Nav.astro — the sheet header: name, sheet index, theme toggle. Sticky
// and solid (no scroll-fade), 2px ink rule under it. Ids #fy-nav,
// #fy-nav-burger, #fy-theme-btn are load-bearing (script below).
import { SHEETS } from '../lib/sheet';

const base = import.meta.env.BASE_URL;
const here = Astro.url.pathname;
const links = SHEETS.filter((s) => s.path !== '').map((s) => ({
	...s,
	href: `${base}${s.path}`,
	current: !s.path.startsWith('#') && here.startsWith(`${base}${s.path}`),
}));
---

<header data-screen-label="Nav" class="brand-skills fy-sheet-header">
	<div class="fy-sheet-header__row">
		<a class="fy-sheet-header__name" href={`${base}#top`}>Abhijit Bansal</a>
		<nav id="fy-nav" aria-label="Sheets">
			{links.map((l) => (
				<a href={l.href} aria-current={l.current ? 'page' : undefined}><span class="fy-sheet-code">{l.code.replace('-0', '')}</span> {l.label}</a>
			))}
			<a href="https://github.com/abhijitbansal" target="_blank" rel="noopener">GitHub ↗</a>
			<button id="fy-theme-btn" type="button">Night sheet</button>
		</nav>
		<button id="fy-nav-burger" type="button" aria-label="Sheet index" aria-expanded="false" aria-controls="fy-nav" class="fy-burger">Sheets</button>
	</div>
</header>

<style>
	.fy-sheet-header {
		position: sticky;
		top: 0;
		z-index: 50;
		background: var(--ds-bg);
		border-bottom: var(--fy-sheet-rule) solid var(--ds-text);
	}
	.fy-sheet-header__row {
		max-width: 1360px;
		margin: 0 auto;
		padding: 0 clamp(16px, 3vw, 40px);
		min-height: 56px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px 32px;
		box-sizing: border-box;
	}
	.fy-sheet-header__name {
		font-weight: 800;
		font-stretch: 125%;
		font-size: 17px;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		text-decoration: none;
	}
	#fy-nav {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 6px 22px;
		font: 400 13.5px/1.3 var(--ds-font-mono);
	}
	#fy-nav a { text-decoration: none; padding: 6px 0; }
	#fy-nav a:hover,
	#fy-nav a[aria-current='page'] { text-decoration: underline; text-decoration-thickness: 2.5px; text-underline-offset: 5px; }
	.fy-sheet-code { color: var(--ds-text-3); }
	#fy-theme-btn {
		font: inherit;
		color: var(--ds-text);
		background: transparent;
		border: 1px solid var(--ds-text);
		padding: 0 12px;
		min-height: 36px;
		cursor: pointer;
	}
	.fy-burger {
		display: none;
		font: 400 13px var(--ds-font-mono);
		color: var(--ds-text);
		background: transparent;
		border: 1px solid var(--ds-text);
		min-height: 44px;
		padding: 0 14px;
		cursor: pointer;
	}
	@media (max-width: 900px) {
		.fy-burger { display: inline-flex; align-items: center; }
		#fy-nav {
			position: absolute;
			top: 100%;
			left: 0;
			right: 0;
			flex-direction: column;
			align-items: stretch;
			gap: 0;
			background: var(--ds-bg);
			border-bottom: var(--fy-sheet-rule) solid var(--ds-text);
			padding: 8px clamp(16px, 3vw, 40px) 16px;
			display: none;
		}
		#fy-nav[data-open='true'] { display: flex; }
		#fy-nav a,
		#fy-nav button { min-height: 44px; display: flex; align-items: center; }
		#fy-theme-btn { align-self: flex-start; margin-top: 8px; }
	}
</style>

<script>
	import { readTheme, toggleTheme } from '../lib/theme';

	const label = () => (readTheme() === 'dark' ? 'Day sheet' : 'Night sheet');
	const btn = document.getElementById('fy-theme-btn');
	if (btn) {
		btn.textContent = label();
		btn.addEventListener('click', () => {
			toggleTheme();
			btn.textContent = label();
		});
	}

	const burger = document.getElementById('fy-nav-burger');
	const navEl = document.getElementById('fy-nav');
	if (burger && navEl) {
		const setOpen = (open: boolean) => {
			navEl.setAttribute('data-open', String(open));
			burger.setAttribute('aria-expanded', String(open));
		};
		burger.addEventListener('click', () => setOpen(navEl.getAttribute('data-open') !== 'true'));
		navEl.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
	}
</script>
```

Then delete `src/lib/header.ts`, and confirm with `grep -rn "header'" src`, which must print nothing.

**Fixed-header padding:** the old header was `position:fixed`, so pages pad their tops by `clamp(120px,12vw,160px)` and use `scroll-margin-top:72px`. With a sticky header those paddings are too big. Task 5 resets them per page through `SheetHead`. Leave them alone in this task.

- [ ] **Step 5: Rework `src/components/Footer.astro` markup into a title block**

Keep the frontmatter comment block, the `<script>` (unchanged) and every id. Replace the outer `<footer>…</footer>` markup with the structure below. The anvil `<button id="fy-anvil">` subtree moves **verbatim** into the first cell, and `#fy-seal`'s `<div>` moves **verbatim** to the end of the inner wrapper. Copy for `#fy-footer-copy1`: `© 2026 Abhijit Bansal`. Copy for `#fy-footer-copy2`: `No trackers · No analytics · Nothing to consent to`. The script's `applyCopy()` rewrites both when stamped, so update its two unstamped strings to match: `'© 2026 Abhijit Bansal'` and the unchanged trackers line. Its stamped strings stay.

```astro
<footer data-screen-label="Footer" class="brand-skills fy-title-block">
	<div class="fy-title-block__grid">
		<div class="fy-title-block__cell fy-title-block__cell--name">
			<span style="display:inline-flex;align-items:center;gap:11px">
				<!-- #fy-anvil button subtree, verbatim -->
				<span class="fy-title-block__name">Abhijit Bansal</span>
			</span>
			<span class="ds-micro" id="fy-footer-copy1" style="color:var(--ds-text-3)">© 2026 Abhijit Bansal</span>
		</div>
		<div class="fy-title-block__cell" style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">
			<a href="https://github.com/abhijitbansal" target="_blank" rel="noopener">GitHub</a>
			<a href="https://www.linkedin.com/in/abhijit-bansal/" target="_blank" rel="noopener">LinkedIn</a>
			<a href="mailto:contact@abhijitbansal.com">contact@abhijitbansal.com</a>
		</div>
		<div class="fy-title-block__cell">
			<span class="ds-micro" id="fy-footer-copy2" style="color:var(--ds-text-2)">No trackers · No analytics · Nothing to consent to</span>
		</div>
		<!-- #fy-seal div, verbatim -->
	</div>
</footer>

<style>
	.fy-title-block { border-top: var(--fy-sheet-rule) solid var(--ds-text); margin-top: clamp(64px, 8vw, 112px); }
	.fy-title-block__grid {
		position: relative;
		max-width: 1360px;
		margin: 0 auto;
		padding: 0 clamp(16px, 3vw, 40px);
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
		box-sizing: border-box;
	}
	.fy-title-block__cell { padding: 18px 16px; border-right: 1px solid var(--ds-line-strong); display: flex; flex-direction: column; gap: 4px; justify-content: center; font-size: 14.5px; }
	.fy-title-block__cell:first-child { padding-left: 0; }
	.fy-title-block__cell:last-of-type { border-right: 0; }
	.fy-title-block__name { font-weight: 800; font-stretch: 125%; text-transform: uppercase; letter-spacing: 0.02em; }
	@media (max-width: 640px) {
		.fy-title-block__cell { border-right: 0; border-bottom: 1px solid var(--ds-line-strong); padding-left: 0; }
	}
</style>
```

In the anvil subtree, change the tab's inline background gradient from `var(--ds-accent)` to `var(--ds-text)`. It is ink, so the tab matches the sheet rule. Sparks keep their two colours. Replace the literal `'#D9A93F'` in `burst()` with `'var(--ds-secondary)'`, and the `.fy-anvil-flick` span's inline `background:#D9A93F` with `background:var(--ds-secondary)`. Redline sparks still count as heat. The seal SVG's `font-family:var(--ds-font-display)` now renders Archivo, which is acceptable.

- [ ] **Step 6: Update the console hint**

`src/lib/eggs.ts` `printConsoleHint`, which keeps its signature:

```ts
	console.log(
		'%c⚒ THE FOUNDRY %c— three marks are hidden on these sheets.%c\n\n   I.   the smith strikes thrice, where the sheet is signed\n   II.  the working drawings are filed under P·L·A·N·S\n   III. hold the yard until the whistle blows\n',
		'font-family:monospace;font-weight:700;color:#B5341A',
		'font-family:monospace;color:#5F6466',
		'font-family:monospace;color:#F2A541',
	);
```

- [ ] **Step 7: Run tests and build**

Run: `npm test` (expect PASS), then `npm run build` (expect exit 0).

- [ ] **Step 8: Commit**

```bash
git commit -m "feat(chrome): sheet-index nav and title-block footer; drop header scroll-fade" -- src/components/Nav.astro src/components/Footer.astro src/lib/header.ts src/lib/eggs.ts src/lib/sheet.ts tests/unit/sheet.test.ts src/styles/global.css
```

### Task 5: `SheetHead` and adoption on every non-home page

**Files:**
- Create: `src/components/SheetHead.astro`
- Modify: `src/pages/updates.astro` (head block, lines ~48-58)
- Modify: `src/components/harness/HarnessHero.astro` (kicker/h1/lead/CTA block)
- Modify: `src/components/craft/CraftHero.astro` (kicker/h1/lead block)
- Modify: `src/pages/404.astro`

**Interfaces:**
- Consumes: `sheet(code)` from `src/lib/sheet.ts`.
- Produces: `<SheetHead code="A-03" title="…" lead="…" headingLevel={1}>`, with an optional `actions` named slot and an optional `aside` named slot. It renders the 2px ink rule beneath itself.

- [ ] **Step 1: Create `src/components/SheetHead.astro`**

```astro
---
// SheetHead.astro — every page's opening: sheet code, heading, lead,
// optional actions/aside. Replaces the old eyebrow → tinted-word headline
// → filled+ghost button formula (audit, docs/plans/2026-10-06-drawing-set.md).
import { sheet } from '../lib/sheet';

interface Props {
	code: string;
	title: string;
	lead?: string;
	headingLevel?: 1 | 2;
	id?: string;
}

const { code, title, lead, headingLevel = 1, id } = Astro.props;
const s = sheet(code);
const Heading = headingLevel === 1 ? 'h1' : 'h2';
---

<div class="fy-sheet-head" id={id}>
	<div class="fy-sheet-head__main">
		<p class="ds-kicker" style="margin:0">Sheet {s.code} — {s.label.toLowerCase()}</p>
		<Heading class={headingLevel === 1 ? 'ds-display-xl' : 'ds-display-lg'} style="margin:0;text-wrap:balance;max-width:15em">{title}</Heading>
		{lead && <p class="ds-lead" style="margin:0;max-width:34em;text-wrap:pretty">{lead}</p>}
		{Astro.slots.has('actions') && <div class="fy-sheet-head__actions"><slot name="actions" /></div>}
	</div>
	{Astro.slots.has('aside') && <aside class="fy-sheet-head__aside"><slot name="aside" /></aside>}
</div>

<style>
	.fy-sheet-head {
		display: flex;
		flex-wrap: wrap;
		gap: 32px 56px;
		align-items: flex-end;
		padding: clamp(40px, 6vw, 88px) 0 18px;
		border-bottom: var(--fy-sheet-rule) solid var(--ds-text);
	}
	.fy-sheet-head__main { flex: 999 1 600px; min-width: 0; display: flex; flex-direction: column; gap: 20px; }
	.fy-sheet-head__aside { flex: 1 1 300px; min-width: 0; }
	.fy-sheet-head__actions { display: flex; flex-wrap: wrap; gap: 14px 28px; align-items: center; margin-top: 4px; }
</style>
```

- [ ] **Step 2: Adopt it on `/updates/`**

In `src/pages/updates.astro`, change the container's top padding from `clamp(120px,12vw,160px)` to `0`. Replace the `<div data-reveal class="fy-sheet-edge fy-sheet-edge--inset" …>…</div>` head block with:

```astro
<SheetHead code="A-03" title="Revisions, week by week." lead="One completed week per revision: lines of code, activity by hour and day, model mix, and PR and release activity. Generated locally every Monday morning." />
```

Import `SheetHead` at the top. The week chip nav stays as it is (Task 2 squared it).

- [ ] **Step 3: Adopt on `/harness/`**

In `HarnessHero.astro`, change the section padding to `0 0 clamp(64px,9vw,110px)` and delete the radial-gradient background `<div>`. Replace the inner `<div style="display:flex;flex-wrap:wrap;gap:32px 48px;…">…</div>` that holds the kicker, h1, lead, CTAs and score card with:

```astro
<SheetHead code="C-01" title="The harness that runs this foundry." lead="The model does the reasoning. Everything else — hooks, guards, routing rules, recorders — decides what it may do, how work gets dispatched, and what survives the session. Drawn below as the machine hall it behaves like.">
	<Fragment slot="actions">
		<a class="ds-btn" href="#harness-routing">Walk the line ↓</a>
		<a class="ds-btn-quiet" href="mailto:contact@abhijitbansal.com?subject=Harness%20feedback">Help me get better</a>
	</Fragment>
	<div slot="aside" style="display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--ds-line-strong);padding-top:12px">
		<span class="ds-micro" style="color:var(--ds-text-3)">Audited by its own machinery</span>
		<span style="font:500 40px/1 var(--ds-font-mono);font-variant-numeric:tabular-nums">79<span style="color:var(--ds-text-3);font-size:0.5em"> / 100</span> <span class="ds-micro" style="color:var(--ds-secondary)">↑ from 73</span></span>
		<span class="ds-caption" style="color:var(--ds-text-2);max-width:28ch">Independent adversarial re-score, not self-asserted. Honest gaps below — <a href="#harness-score">see what's still weak</a>.</span>
	</div>
</SheetHead>
```

Keep the `<figure class="harness-figure" …>` that follows. Its figcaption `<span style="color:var(--ds-accent-hover)">` labels now render ink, which is correct.

- [ ] **Step 4: Adopt on `/craft/`**

In `CraftHero.astro`, replace the kicker/h1/lead with `SheetHead code="C-02"`. Use the h1 text as plain words with the tinted `<span>`/`<em>` removed ("Code is the smallest part now."), and keep the existing lead text verbatim. Keep the act-jump buttons (`I · Direct ↓` etc.) in the `actions` slot as `ds-btn-quiet` links. Keep the "Field notes by" aside in the `aside` slot. Remove any top padding that exists only to clear the old fixed header.

- [ ] **Step 5: Adopt on `/404`**

Replace the 404 hero copy block with `<SheetHead code="A-01" title="No sheet at this address." lead="The drawing you asked for isn't in the set." >`. Its `actions` slot holds `<a class="ds-btn" href={import.meta.env.BASE_URL}>Back to the yard</a>`. Change `min-height:calc(100vh - 64px)` to `min-height:calc(100dvh - 58px)`.

- [ ] **Step 6: Verify no tinted-word headings remain**

Run: `grep -rnE "<h[12][^>]*>[^<]*<(em|span) style=\"color" src`
Expected: no output.
Run: `npm test && npm run build`. Expected: PASS and exit 0.

- [ ] **Step 7: Commit**

```bash
git commit -m "feat(chrome): SheetHead replaces the eyebrow/tinted-word hero on updates, harness, craft, 404" -- src/components/SheetHead.astro src/pages/updates.astro src/components/harness/HarnessHero.astro src/components/craft/CraftHero.astro src/pages/404.astro
```

**Phase 2 gate (orchestrator):** browser pass on all four pages, both themes, 1440 and 390. Check that the burger opens and closes, the theme label flips, and three anvil strikes stamp the seal. Then run the Opus reviewer on the phase diff.

---

## Phase 3 — Home sheet

### Task 6: Data join and libs: schedule, revisions, yard data

**Files:**
- Modify: `src/data/projects.types.ts` (add `repo`)
- Modify: `src/data/projects.ts` (add `repo` to every project; add Foundry)
- Modify: `tests/unit/projects.test.ts` ("exactly ten" → eleven; the group split)
- Create: `src/lib/schedule.ts`, `tests/unit/schedule.test.ts`
- Create: `src/lib/revisions.ts`, `tests/unit/revisions.test.ts`
- Create: `src/lib/yard-data.ts`. This is a thin composition of `data/stats.json` and the latest week, so it gets no unit test.

**Interfaces:**
- `Project.repo: string` is the stats slug: `cubby`, `doc-scan` (Paperix), `floorprint`, `purix`, `folix`, `cartoon`, `claude-skills`, `sift`, `memekit`, `design-system`, `foundry`.
- `scheduleRows(projects: Project[], ledger: LedgerEntry[]): ScheduleRow[]`
- `projectLinks(p: Project): ScheduleLink[]`
- `revisionRows(weeksDesc: WeeklyDigest[], limit?: number): RevisionRow[]`
- `loadWorksRepos(): WorksRepo[]`

```ts
export interface ScheduleLink { label: string; href: string }
export interface ScheduleRow {
	no: string;           // '01'…'11' from the ledger rank; '—' when the repo is not on the yard
	name: string;
	use: string;
	stack: string;
	storeys: number;      // 0 when the repo is not on the yard
	status: ProjectStatus;
	links: ScheduleLink[];
	isPrivate: boolean;
}
export interface RevisionRow {
	rev: string;          // 'W40'
	week: string;         // formatWeekRange(...)
	lines: number;
	sessions: number;
	lead: string | null;  // busiest repo slug
	isLatest: boolean;
}
```

- [ ] **Step 1: Write the failing tests**

`tests/unit/schedule.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { projectLinks, scheduleRows } from '../../src/lib/schedule';
import type { Project } from '../../src/data/projects.types';
import type { LedgerEntry } from '../../src/lib/works.types';

const p = (over: Partial<Project>): Project => ({ name: 'X', repo: 'x', status: 'active', blurb: 'b', tech: 't', private: false, repoUrl: 'https://github.com/a/x', ...over });
const L = (rank: number, repo: string, storeys: number): LedgerEntry => ({ rank, repo, storeys, sessions: 1, lines: 1, tokens: 0 });

describe('scheduleRows', () => {
	it('numbers each row by its yard rank and carries its storeys', () => {
		const rows = scheduleRows([p({ name: 'Cubby', repo: 'cubby' }), p({ name: 'Paperix', repo: 'doc-scan' })], [L(1, 'cubby', 8), L(4, 'doc-scan', 3)]);
		expect(rows.map((r) => [r.name, r.no, r.storeys])).toEqual([['Cubby', '01', 8], ['Paperix', '04', 3]]);
	});

	it('keeps a project whose repo is not on the yard, numbered — with 0 storeys', () => {
		const [row] = scheduleRows([p({ name: 'New', repo: 'brand-new' })], [L(1, 'cubby', 8)]);
		expect(row).toMatchObject({ name: 'New', no: '—', storeys: 0 });
	});

	it('marks private builds and gives them no links', () => {
		const [row] = scheduleRows([p({ private: true, repoUrl: undefined })], []);
		expect(row.isPrivate).toBe(true);
		expect(row.links).toEqual([]);
	});
});

describe('projectLinks', () => {
	it('site first (its label without the arrow), then source, then the extra link', () => {
		expect(projectLinks(p({ siteUrl: 'https://gotcubby.com', siteLabel: 'gotcubby.com ↗', repoUrl: 'https://github.com/a/c', extraLink: { url: 'https://d', label: 'digest ↗' } }))).toEqual([
			{ label: 'gotcubby.com', href: 'https://gotcubby.com' },
			{ label: 'Source', href: 'https://github.com/a/c' },
			{ label: 'digest', href: 'https://d' },
		]);
	});

	it('falls back to the host when a site has no label', () => {
		expect(projectLinks(p({ siteUrl: 'https://www.example.com/x', repoUrl: undefined }))).toEqual([{ label: 'example.com', href: 'https://www.example.com/x' }]);
	});
});
```

`tests/unit/revisions.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { revisionRows } from '../../src/lib/revisions';
import type { WeeklyDigest } from '../../src/lib/weekly.types';

const week = (id: string, start: string, end: string, repos: [string, number, number][]): WeeklyDigest =>
	({ week_id: id, week_start: start, week_end: end, generated_at: '', heatmap: {} as never, releases: {}, highlights: null, repos: repos.map(([repo, sessions, lines_added]) => ({ repo, sessions, lines_added, lines_removed: 0, top_tool: '', top_model: '' })) }) as WeeklyDigest;

describe('revisionRows', () => {
	const weeks = [
		week('2026-W40', '2026-09-28', '2026-10-04', [['cubby', 142, 12706], ['doc-scan', 37, 4302]]),
		week('2026-W39', '2026-09-21', '2026-09-27', [['doc-scan', 32, 1446]]),
	];

	it('summarises each week newest first, with its lead repo', () => {
		expect(revisionRows(weeks)).toEqual([
			{ rev: 'W40', week: 'Sep 28 – Oct 4, 2026', lines: 17008, sessions: 179, lead: 'cubby', isLatest: true },
			{ rev: 'W39', week: 'Sep 21 – Sep 27, 2026', lines: 1446, sessions: 32, lead: 'doc-scan', isLatest: false },
		]);
	});

	it('honours the limit', () => {
		expect(revisionRows(weeks, 1)).toHaveLength(1);
	});

	it('returns nothing (not a throw) when there are no digests yet', () => {
		expect(revisionRows([])).toEqual([]);
	});

	it('reports no lead for a week with no repo activity', () => {
		expect(revisionRows([week('2026-W41', '2026-10-05', '2026-10-11', [])])[0].lead).toBeNull();
	});
});
```

Check `formatWeekRange`'s exact output against `src/lib/weekly.ts:15-21` before you run. It prints `"Sep 28 – Oct 4, 2026"` and repeats the month (`"Sep 21 – Sep 27, 2026"`). If it differs, fix the **test's expected strings** to match the function. Don't touch the function.

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/unit/schedule.test.ts tests/unit/revisions.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

`src/data/projects.types.ts`: add `repo: string;` under `name`, with the comment `// slug in data/stats.json — joins the project to its yard building`.

`src/data/projects.ts`: add `repo` to each entry, using the slugs listed under Interfaces. Append to `foundationProjects`:

```ts
	{
		name: 'Foundry',
		repo: 'foundry',
		status: 'active',
		blurb: 'This site. Static Astro pages; the yard, the schedule and the meter readings are drawn at build time from the repos themselves.',
		tech: 'Astro · TypeScript · SVG',
		siteUrl: 'https://abhijitbansal.com/',
		siteLabel: 'abhijitbansal.com',
		repoUrl: 'https://github.com/abhijitbansal/foundry',
		private: false,
	},
```

Confirm `repoUrl` resolves with `gh repo view abhijitbansal/foundry --json visibility`. If it is private, drop `repoUrl`, keep `siteUrl`, and leave `private: false`, since the site itself is public.

`tests/unit/projects.test.ts`: update "exactly ten" to eleven (rename the test to `has exactly eleven projects across the three groups`) and update the foundation group count to 2.

`src/lib/schedule.ts`:

```ts
// schedule.ts — joins projects.ts to the yard ledger for the home page's
// "Schedule of buildings". Bldg number = ledger rank, the same number the
// yard's nameplates print.
import type { Project, ProjectStatus } from '../data/projects.types';
import type { LedgerEntry } from './works.types';

export interface ScheduleLink { label: string; href: string }
export interface ScheduleRow {
	no: string;
	name: string;
	use: string;
	stack: string;
	storeys: number;
	status: ProjectStatus;
	links: ScheduleLink[];
	isPrivate: boolean;
}

const NOT_ON_YARD = '—';
const stripArrow = (s: string) => s.replace(/\s*↗\s*$/, '');

export function projectLinks(p: Project): ScheduleLink[] {
	const links: ScheduleLink[] = [];
	if (p.siteUrl) links.push({ label: stripArrow(p.siteLabel ?? new URL(p.siteUrl).hostname.replace(/^www\./, '')), href: p.siteUrl });
	if (p.repoUrl) links.push({ label: 'Source', href: p.repoUrl });
	if (p.extraLink) links.push({ label: stripArrow(p.extraLink.label), href: p.extraLink.url });
	return links;
}

export function scheduleRows(projects: Project[], ledger: LedgerEntry[]): ScheduleRow[] {
	const byRepo = new Map(ledger.map((e) => [e.repo, e]));
	return projects.map((p) => {
		const e = byRepo.get(p.repo);
		return {
			no: e ? String(e.rank).padStart(2, '0') : NOT_ON_YARD,
			name: p.name,
			use: p.blurb,
			stack: p.tech,
			storeys: e?.storeys ?? 0,
			status: p.status,
			links: projectLinks(p),
			isPrivate: p.private,
		};
	});
}
```

`src/lib/revisions.ts`:

```ts
// revisions.ts — the home sheet's revision block: one row per completed
// week, newest first, from data/weekly/*.json.
import type { WeeklyDigest } from './weekly.types';
import { busiestRepo, formatWeekRange, totalWeeklyLines, totalWeeklySessions } from './weekly';

export interface RevisionRow {
	rev: string;
	week: string;
	lines: number;
	sessions: number;
	lead: string | null;
	isLatest: boolean;
}

export function revisionRows(weeksDesc: WeeklyDigest[], limit = 4): RevisionRow[] {
	return weeksDesc.slice(0, limit).map((w, i) => ({
		rev: w.week_id.split('-')[1] ?? w.week_id,
		week: formatWeekRange(w.week_start, w.week_end),
		lines: totalWeeklyLines(w.repos),
		sessions: totalWeeklySessions(w.repos),
		lead: busiestRepo(w.repos)?.repo ?? null,
		isLatest: i === 0,
	}));
}
```

If `busiestRepo` ranks by something other than lines, keep using it: "lead" means whatever `/updates/` already calls busiest. Adjust the first test's expected `lead` only if the function disagrees.

`src/lib/yard-data.ts`. The body is the `statsRepos` / `activeThisWeek` / `worksRepos` block lifted from `Telemetry.astro:47-64`:

```ts
// yard-data.ts — the one place that turns data/stats.json + the latest
// weekly digest into the WorksRepo[] the yard, the schedule and the
// telemetry sheet all draw from.
import statsJson from '../../data/stats.json';
import type { WorksRepo } from './works.types';
import { getAllWeeksDesc } from './weekly';

interface StatsRepoRow {
	repo: string;
	sessions: number;
	lines_added: number;
	out_tokens: number;
}

export function loadWorksRepos(): WorksRepo[] {
	const latestWeek = getAllWeeksDesc()[0];
	const activeThisWeek = new Set(latestWeek ? latestWeek.repos.map((r) => r.repo) : []);
	return (statsJson.repos as unknown as StatsRepoRow[]).map((r) => ({
		repo: r.repo,
		lines: r.lines_added,
		sessions: r.sessions,
		tokens: r.out_tokens,
		active: activeThisWeek.has(r.repo),
	}));
}
```

Then change `Telemetry.astro` to import `loadWorksRepos` and delete its local copy (it still renders the yard until Task 7). Keep `statsRepos.length` working: replace its two uses with `worksRepos.length`.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(data): join projects to yard buildings; schedule, revision and yard-data libs" -- src/data/projects.types.ts src/data/projects.ts src/lib/schedule.ts src/lib/revisions.ts src/lib/yard-data.ts src/components/Telemetry.astro tests/unit/projects.test.ts tests/unit/schedule.test.ts tests/unit/revisions.test.ts
```

### Task 7: `HeroYard`: the yard becomes the hero; remove Three.js

**Files:**
- Create: `src/components/HeroYard.astro`
- Delete: `src/components/Hero.astro`, `src/lib/three/init.ts`, `src/lib/three/scene.ts`
- Modify: `package.json` (remove `three`, `@types/three`), then `npm install` to refresh `package-lock.json`
- Modify: `src/components/Telemetry.astro`: remove the `#fy-yard-card` `<article>` and its egg `<script>` (both move here)
- Modify: `src/pages/index.astro`: `Hero` → `HeroYard`

**Interfaces:**
- Consumes: `loadWorksRepos()`, `buildLedger()`, `revisionRows()`, `getAllWeeksDesc()`, `formatSheetDate()`, `formatCompact()`, `formatDateRange()`, plus `WorksCity`.
- Keeps these ids. Egg 2: `#top` (the section), `#fy-pill`, `#fy-pill-hold`, `#fy-pill-hold-bar`, `#fy-dwg-title-block`, `#fy-dwg-close`, `#fy-callout-a` through `#fy-callout-d`, and the `.fy-dwg-piece`, `.fy-dwg-badge` and `.fy-dwg-outline` classes. Egg 3: `#fy-yard-card`, `#fy-yard-wrap`, `#fy-yard-veil`, `#fy-yard-hold-caption`, `#fy-yard-hold-text`, `#fy-yard-hold-bar`, `#fy-yard-title`, `#fy-yard-meta`, `#fy-yard-legend-day`, `#fy-yard-legend-night`, and the `.fy-hover-hint` and `.fy-yard-meta-tail` spans.

- [ ] **Step 1: Write `src/components/HeroYard.astro`**

Lay it out to match `docs/plans/2026-10-06-drawing-set/A-Home.reference.html`, from `<section aria-labelledby="hero-h" …>` down to the title-block row. Mapping:

| Reference element | Implementation |
|---|---|
| A–F grid-reference ruler | static `aria-hidden` row of 6 cells |
| `Sheet A-01 — the yard` + h1 + lead + actions | literal markup. h1 = `id="fy-callout-a" class="ds-display-xl fy-dwg-outline"`; lead `id="fy-callout-c"`; actions wrapper `id="fy-callout-d"`. Copy is verbatim from the reference. |
| Revisions aside | `revisionRows(getAllWeeksDesc(), 4)`; render the block **only if** rows exist (Review Focus 4). Rev triangle colour: `var(--ds-secondary)` for `isLatest`, else `var(--ds-text-3)`. Each row is a `role="listitem"` with an `aria-label` like `Revision W40, Sep 28 – Oct 4, 2026: 17,008 lines, 179 sessions, led by cubby`. Use a list, not a `<table>`. |
| yard `<figure>` | `<figure id="fy-yard-card">` with no surface or border of its own; the sheet frame is the border. Inside it, in this order: a header row with `#fy-yard-title` ("The works — one building per repo") and the meta spans copied verbatim from `Telemetry.astro:152-156`; then `#fy-yard-wrap` with `<WorksCity variant="yard" repos={worksRepos} />`, the hold caption and the veil, copied verbatim from `Telemetry.astro:158-167`. |
| Notes | `<div id="fy-yard-legend-day" style="display:flex;flex-direction:column;gap:10px">` holding an `<h2>`-styled "Notes" and the `<ol>` with the six legend lines from `Telemetry.astro:169-179`, reworded as sentences (see the reference). Then `<p id="fy-yard-legend-night" style="display:none">` with the night copy, verbatim from `Telemetry.astro:182`. |
| Title block | Grid cells: Project "The Foundry"; Sheet "A-01"; Drawn "A. Bansal"; Period `formatDateRange(meta.date_min, meta.date_max)`; Rev = latest `rev` in `var(--ds-secondary)` (or `—` if none); Date. **The Date cell is egg 2's hold target**: `<span id="fy-pill" class="fy-hold-target" title="the drawings are kept close at hand">{formatSheetDate(new Date())}<span id="fy-pill-hold" …><span id="fy-pill-hold-bar" …></span></span><span id="fy-callout-b" class="fy-dwg-piece fy-dwg-badge" aria-hidden="true" style="top:-8px;left:-8px">B</span></span>`. Copy the hold-bar spans' inline styles from `Hero.astro`, swapping `var(--ds-accent)` → `var(--ds-text)` and `var(--ds-accent-soft)` stays. |

Egg 2 overlay: move the `<div aria-hidden class="fy-dwg-piece" …>` grid-and-corners overlay and the `#fy-dwg-title-block` from `Hero.astro` **verbatim**. Then change four things:

1. The overlay grid colours become `color-mix(in srgb, var(--ds-secondary) 7%, transparent)`. Redline is the colour of revision marks.
2. The corner crosshair strokes become `var(--ds-secondary)`.
3. The title block's spec lines become `A — h1 · Archivo 750, wdth 118`, `B — date stamp · build-time`, `C — lead · 34em, text-wrap: pretty` and `D — ink button + text link`.
4. The `"≤ 680 — CONTENT COL"` dimension line is deleted.

Move the `<style>` block from `Hero.astro` verbatim, changing `.fy-dwg-badge` `border-radius: 50%` to `0`. Move `Hero.astro`'s `<script>` minus `initHeroScene` (delete that import and call). Then append the egg 3 script from `Telemetry.astro:324-399` verbatim, as a second `<script>`.

The section root: `<section id="top" data-screen-label="Hero — the yard" class="fy-sheet-frame">`, wrapped by `<div style="max-width:1360px;margin:0 auto;padding:40px clamp(16px,3vw,40px) 0">`. Add the scoped style `.fy-sheet-frame { position:relative; border: var(--fy-sheet-rule) solid var(--ds-text); }`. The overlay needs `position:relative` on `#top`, which this provides.

Responsive: the headline and revisions row is `display:flex;flex-wrap:wrap`, with the main block at `flex:999 1 600px` and the aside at `flex:1 1 340px`. The notes and title-block row works the same way: the notes take `flex:999 1 520px` and the title block `flex:1 1 420px`, and below 640px the title block drops its left border.

- [ ] **Step 2: Remove Three.js**

```bash
git rm src/components/Hero.astro src/lib/three/init.ts src/lib/three/scene.ts
npm uninstall three @types/three
```

Run: `grep -rnE "lib/three|__foundryScene|initHeroScene|fy-canvas-mount|fy-poster-rings|fy-hero-scrim" src`
Expected: hits only in `src/styles/global.css` (Task 10 sweeps those). Fix any other hit now.

- [ ] **Step 3: Trim `Telemetry.astro`**

Delete the `#fy-yard-card` `<article>` and the `<script>` at the bottom. Delete the now-unused imports (`WorksCity`, `buildLedger`, `getAllWeeksDesc`, `loadWorksRepos`) and locals (`worksLedger`, `worksTallest`, `worksVacant`, `worksCaption`), **except** where Task 9 needs them. Task 9 rebuilds this file into the telemetry page, so leaving a few unused locals now is fine as long as `npm run build` passes.

- [ ] **Step 4: Wire the home page**

`src/pages/index.astro`: replace `import Hero from '../components/Hero.astro'` with `import HeroYard from '../components/HeroYard.astro'` and `<Hero />` with `<HeroYard />`.

- [ ] **Step 5: Verify**

Run: `npm test` (expect PASS) and `npm run build` (expect exit 0).
Run: `npx npm@10 ci` (expect exit 0: the lock file is consistent under CI's npm).
Run: `grep -c "three" package.json` (expect `0`).

- [ ] **Step 6: Commit**

```bash
git add -A src/components/HeroYard.astro src/components/Hero.astro src/lib/three package.json package-lock.json src/components/Telemetry.astro src/pages/index.astro
git commit -m "feat(home): the yard is the hero — revisions, notes, title block; remove the Three.js scene" -- src/components/HeroYard.astro src/components/Hero.astro src/lib/three package.json package-lock.json src/components/Telemetry.astro src/pages/index.astro
```

### Task 8: Schedule, General notes, Meter readings; reassemble home

**Files:**
- Create: `src/components/Schedule.astro`, `src/components/GeneralNotes.astro`, `src/components/MeterReadings.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/components/HarnessPromo.astro`
- Delete when unreferenced (`grep` first): `src/components/WorkSection.astro`, `WorkGroup.astro`, `ProjectCard.astro`, `ProjectLinks.astro`, `Expertise.astro`, `About.astro`

**Interfaces:**
- Consumes: `scheduleRows()`, `appsProjects` / `aiToolingProjects` / `foundationProjects`, `buildLedger(loadWorksRepos())`, `SheetHead`, and `formatCompact` plus the stats totals.

- [ ] **Step 1: `Schedule.astro`**

```astro
---
// Schedule.astro — Sheet A-02, "Schedule of buildings". Rows are numbered
// by yard rank (schedule.ts), so a reader can find each project on the yard.
import SheetHead from './SheetHead.astro';
import { aiToolingProjects, appsProjects, foundationProjects } from '../data/projects';
import { buildLedger } from '../lib/works';
import { loadWorksRepos } from '../lib/yard-data';
import { scheduleRows } from '../lib/schedule';

const ledger = buildLedger(loadWorksRepos());
const groups = [
	{ title: 'Apps — iOS, macOS and browser', rows: scheduleRows(appsProjects, ledger) },
	{ title: 'Agent tooling', rows: scheduleRows(aiToolingProjects, ledger) },
	{ title: 'Foundation', rows: scheduleRows(foundationProjects, ledger) },
];
const total = groups.reduce((n, g) => n + g.rows.length, 0);
---

<section id="schedule" data-screen-label="Schedule" class="fy-page">
	<SheetHead code="A-02" title="Schedule of buildings" headingLevel={2} lead={`${total} projects, numbered as on the yard. Private builds are described here; public ones link to source.`} />
	<div class="fy-sched__head" aria-hidden="true"><span>Bldg</span><span>Name</span><span>Use</span><span>Built with</span><span>Storeys</span><span>Drawings</span></div>
	{groups.map((g) => (
		<div class="fy-sched__group">
			<h3 class="fy-sched__group-title">{g.title}</h3>
			<ul class="fy-sched__rows">
				{g.rows.map((r) => (
					<li class="fy-sched__row">
						<span class="fy-sched__no">{r.no}</span>
						<div class="fy-sched__name">
							<span class="fy-sched__title">{r.name}</span>
							<span class="fy-sched__status" data-status={r.status}>■ {r.status === 'recently-active' ? 'Recently active' : r.status === 'heating-up' ? 'Heating up' : 'Active'}</span>
						</div>
						<p class="fy-sched__use">{r.use}</p>
						<span class="fy-sched__stack">{r.stack}</span>
						<span class="fy-sched__storeys" role="img" aria-label={`${r.storeys} ${r.storeys === 1 ? 'storey' : 'storeys'}`}>
							{Array.from({ length: r.storeys }, () => <i />)}<b>{r.storeys}</b>
						</span>
						<div class="fy-sched__links">
							{r.links.map((l) => <a href={l.href} target="_blank" rel="noopener">{l.label}</a>)}
							{r.isPrivate && <span class="fy-sched__private">Private build</span>}
						</div>
					</li>
				))}
			</ul>
		</div>
	))}
	<p class="fy-sched__footnote">On the drawing board: a personal financial adviser, and more personal infrastructure. The theme holds — build my own tools instead of renting mediocre ones.</p>
</section>

<style>
	.fy-page { max-width: 1360px; margin: 0 auto; padding: clamp(64px, 8vw, 112px) clamp(16px, 3vw, 40px) 0; box-sizing: border-box; scroll-margin-top: 58px; }
	.fy-sched__head,
	.fy-sched__row { display: grid; grid-template-columns: 56px 180px minmax(0, 1fr) 210px 120px 150px; gap: 24px; align-items: start; }
	.fy-sched__head { padding: 12px 0; font: 400 12px var(--ds-font-mono); color: var(--ds-text-3); }
	.fy-sched__group { padding-top: 22px; }
	.fy-sched__group-title { margin: 0; padding-bottom: 8px; font-size: 14px; font-weight: 700; font-stretch: 112%; border-bottom: 1px solid var(--ds-text); }
	.fy-sched__rows { margin: 0; padding: 0; list-style: none; }
	.fy-sched__row { padding: 16px 0; border-bottom: 1px solid var(--ds-line); }
	.fy-sched__no,
	.fy-sched__stack,
	.fy-sched__storeys b { font: 400 13px var(--ds-font-mono); color: var(--ds-text-3); padding-top: 3px; }
	.fy-sched__stack { color: var(--ds-text-2); }
	.fy-sched__name { display: flex; flex-direction: column; gap: 4px; }
	.fy-sched__title { font-weight: 750; font-stretch: 118%; font-size: 19px; line-height: 1.2; }
	.fy-sched__status { font: 400 12px var(--ds-font-mono); color: var(--ds-text); }
	.fy-sched__status[data-status='recently-active'] { color: var(--ds-text-3); }
	.fy-sched__status[data-status='heating-up'] { color: var(--ds-secondary); }
	.fy-sched__use { margin: 0; color: var(--ds-text-2); font-size: 15px; line-height: 1.45; max-width: 34em; }
	.fy-sched__storeys { display: flex; gap: 3px; align-items: flex-end; padding-top: 3px; }
	.fy-sched__storeys i { display: block; width: 7px; height: 14px; background: var(--ds-text); }
	.fy-sched__storeys b { margin-left: 8px; padding: 0; font-weight: 400; color: var(--ds-text); }
	.fy-sched__links { display: flex; flex-direction: column; gap: 4px; font-size: 14.5px; }
	.fy-sched__private { color: var(--ds-text-3); }
	.fy-sched__footnote { margin: 20px 0 0; color: var(--ds-text-2); max-width: 46em; }
	@media (max-width: 1000px) {
		.fy-sched__head { display: none; }
		.fy-sched__row { grid-template-columns: 40px minmax(0, 1fr); gap: 6px 12px; }
		.fy-sched__row > :not(.fy-sched__no) { grid-column: 2; }
		.fy-sched__name { flex-direction: row; flex-wrap: wrap; justify-content: space-between; align-items: baseline; }
		.fy-sched__links { flex-direction: row; gap: 16px; }
	}
</style>
```

- [ ] **Step 2: `GeneralNotes.astro`**

```astro
---
// GeneralNotes.astro — Sheet A-04 (rendered on A-01's page). Replaces the
// three equal Expertise columns and the About block with one numbered list.
const NOTES = [
	['iOS and Apple platforms.', 'Swift 6, SwiftUI, SwiftData, Vision, RoomPlan, on-device ML. Zero-backend architecture — apps that never phone home.'],
	['Agent tooling.', 'Claude Code skills and plugins, MCP servers, token optimization, multi-agent orchestration. Tools that make agents cheaper and more exact.'],
	['The whole product.', 'Rust CLIs, design systems, App Store releases. Shipped solo — the same hands sketch the interface, write the Swift, cut the release and answer the support mail.'],
	['Privacy is the default, not a setting.', 'Apps run on-device with zero telemetry. This site has no trackers either.'],
];
---

<section id="notes" data-screen-label="General notes" class="fy-notes">
	<div class="fy-notes__head">
		<p class="ds-kicker" style="margin:0">Sheet A-04</p>
		<h2 class="ds-display-lg" style="margin:0">General notes</h2>
	</div>
	<ol class="fy-notes__list">
		{NOTES.map(([lead, body], i) => (
			<li><span class="fy-notes__n">{i + 1}.</span><p><strong>{lead}</strong> <span>{body}</span></p></li>
		))}
	</ol>
</section>

<style>
	.fy-notes { max-width: 1360px; margin: 0 auto; padding: clamp(64px, 8vw, 112px) clamp(16px, 3vw, 40px) 0; box-sizing: border-box; display: flex; flex-wrap: wrap; gap: 32px 64px; }
	.fy-notes__head { flex: 1 1 280px; display: flex; flex-direction: column; gap: 8px; }
	.fy-notes__list { flex: 999 1 640px; min-width: 0; margin: 0; padding: 0; list-style: none; border-top: var(--fy-sheet-rule) solid var(--ds-text); }
	.fy-notes__list li { display: grid; grid-template-columns: 48px minmax(0, 1fr); gap: 16px; padding: 20px 0; border-bottom: 1px solid var(--ds-line); }
	.fy-notes__n { font-family: var(--ds-font-mono); color: var(--ds-text-3); }
	.fy-notes__list p { margin: 0; max-width: 40em; }
	.fy-notes__list strong { font-weight: 700; }
	.fy-notes__list span { color: var(--ds-text-2); }
</style>
```

Add `{ code: 'A-04', label: 'Notes', path: '#notes' }` to `SHEETS` **after** `A-03`, and update `tests/unit/sheet.test.ts`'s expected codes to `['A-01','A-02','A-03','A-04','B-01','C-01','C-02']`. Nav shows it automatically, so drop it from the nav by filtering on `s.code !== 'A-04'` in `Nav.astro`: the notes are part of the home sheet, not a destination.

- [ ] **Step 3: `MeterReadings.astro`**

Lay it out from the reference's `#meters` section. Build-time values come from `data/stats.json` through the same helpers `Telemetry.astro` uses: `formatCompact(totals.lines_added)`, `totals.sessions`, `totals.user_msgs`, `totals.out_tokens`, `totals.cache_read_tokens`, `formatCompact(meta.files_found)`, `formatDateRange(meta.date_min, meta.date_max)`, and `peakDayInRange(dailySessions, TELEMETRY_START_ISO, meta.date_max)`. Render a `SheetHead code="B-01" headingLevel={2} title="Meter readings" lead={`Everything above is built with Claude Code. Parsed locally from ${files} session logs, ${range}.`}`.

Below it goes a 4-cell grid, `repeat(auto-fit, minmax(min(100%, 230px), 1fr))`, with 1px `--ds-line` dividers between cells. Each number is `font: 500 clamp(34px,3.4vw,46px) var(--ds-font-mono); font-variant-numeric: tabular-nums`. Plain labels: "lines added, every repo", "sessions · N prompts", "tokens written", "tokens read from cache". Then a ramp row: five swatches from `heatBucketColor` (`quiet` … `peak`), then the sentence `Heatmaps ramp by graphite density; redline marks the peak — {peak.label}, {peak.value} sessions in one day.`, then `<a href={`${base}telemetry/`}>Full telemetry sheet →</a>`. If `peakDayInRange` returns undefined, drop the peak clause.

- [ ] **Step 4: Reassemble `index.astro` and restyle `HarnessPromo`**

```astro
<main class="brand-skills">
	<HeroYard />
	<Schedule />
	<GeneralNotes />
	<MeterReadings />
	<HarnessPromo />
</main>
```

Remove the `Expertise`, `WorkSection`, `Telemetry` and `About` imports. `HarnessPromo.astro`: replace the `ds-card fy-tilt` anchor with a plain bordered row. Markup: `<a href=… class="fy-promo">` holding `<span class="ds-kicker">Sheet C-01</span>`, `<span>How this site gets built — hooks, routing, and an honest audit of the harness behind it.</span>` and `<span aria-hidden="true">→</span>`. Scoped style: `.fy-promo { display:flex; flex-wrap:wrap; gap:8px 24px; align-items:baseline; padding:18px 0; border-top:1px solid var(--ds-text); border-bottom:1px solid var(--ds-text); text-decoration:none; } .fy-promo:hover span:nth-child(2) { text-decoration: underline; text-decoration-thickness: 2.5px; }`. The wrapper keeps `max-width:1360px` and adds `padding-top: clamp(64px,8vw,112px)`.

- [ ] **Step 5: Delete the replaced components**

```bash
for f in WorkSection WorkGroup ProjectCard ProjectLinks Expertise About; do grep -rln "$f.astro" src || git rm "src/components/$f.astro"; done
```

Expected: all six removed, apart from `Telemetry.astro`, which Task 9 owns. If any `grep` prints a referencing file, fix that file first.

- [ ] **Step 6: Verify**

Run: `npm test` (expect PASS) and `npm run build` (expect exit 0).
Run: `grep -rnE "Forged here|forge runs hot|crucible remembers|into the melt|Forged in the Foundry" src`
Expected: hits only in `src/components/Telemetry.astro`, which Task 9 rewrites.

- [ ] **Step 7: Commit**

```bash
git add -A src/components src/pages/index.astro src/lib/sheet.ts tests/unit/sheet.test.ts
git commit -m "feat(home): schedule of buildings, general notes, meter readings; retire card/column components" -- src/components src/pages/index.astro src/lib/sheet.ts tests/unit/sheet.test.ts
```

**Phase 3 gate (orchestrator):** browser pass on `/` in both themes at 1440, 1024 and 390, compared side by side with the canvas artboards. Exercise all three eggs on `/`:
- type `plans` and check the overlay;
- long-press the date stamp for 1.1s;
- strike the anvil three times;
- hold the yard for 0.9s.

Check the yard fullscreen dialog in both themes (dialog background = `--ds-surface`). Then run the Opus reviewer on the phase diff.

---

## Phase 4 — Telemetry sheet

### Task 9: `/telemetry/` page (Sheet B-01)

**Files:**
- Create: `src/pages/telemetry.astro`
- Modify (rewrite as the page body): `src/components/Telemetry.astro`

**Interfaces:**
- Consumes: everything `Telemetry.astro` already computes, plus `buildLedger(loadWorksRepos())` for the ledger grid that left the home page.

- [ ] **Step 1: Write the page**

`src/pages/telemetry.astro` follows `updates.astro`'s skeleton: `BaseLayout` (title `Telemetry — Abhijit Bansal — Foundry`, description `How this site and its siblings get built: sessions, lines, tokens, models and tools, parsed locally from Claude Code transcripts.`, `canonicalPath="/telemetry/"`), then `SkipLink`, `Nav`, `<main class="brand-skills"><Telemetry /></main>` and `Footer`, plus the `initReveals()` script.

- [ ] **Step 2: Rewrite `Telemetry.astro` top to bottom**

1. Open with `<SheetHead code="B-01" title="Meter readings, in full." lead={`Everything on this site is built with Claude Code. Parsed locally from ${filesFound} session logs, ${dateRange}.`} />`. It replaces the kicker/h2/lead/rule.
2. Keep the four stat cells. Swap the `ds-display-lg fy-stat` numbers for the MeterReadings mono style, delete the pun captions (`output, straight into the melt`, `the crucible remembers`), and make the labels plain: "lines added", "sessions", "tokens written", "tokens read from cache".
3. Add **Yard ledger**: an `<h2 class="ds-display-md">Yard ledger</h2>` followed by the ledger grid. It is `Telemetry.astro`'s old `worksLedger.map(...)` block, verbatim except for the inline `color:var(--ds-accent-hover)` → `color:var(--ds-text-3)` on the rank. Keep the `worksCaption` paragraph, and the per-repo-floors sentence as a caption.
4. Keep the heatmap, top-tools and model-mix articles. They pick up the Task 2/3 styling. Change the `"Since May 1"` and `"Top tools"` / `"Model mix"` labels' inline `color:var(--ds-accent-hover)` to `color:var(--ds-text)` with `font-weight:500`. Tool bars: change `background:var(--ds-accent)` to `var(--ds-text)`, and `border-radius` to `0`. Model-mix bar: change `border-radius:var(--ds-radius-pill)` (already 0 via tokens) and the legend dots' `border-radius:50%` to `0`.
5. Keep the chips row, the memekit terminal (`color:var(--ds-accent-hover)` → `var(--ds-secondary)` on the `0 regrets` line: redline is a revision mark) and the source caption.
6. Remove `scroll-margin-top:72px` and the old `clamp(72px,10vw,150px)` top padding.

- [ ] **Step 3: Verify**

Run: `npm run build` (expect exit 0), then `ls dist/telemetry/index.html` (expect the file to exist).
Run: `grep -rnE "Forged here|forge runs hot|crucible remembers|into the melt|Forged in the Foundry" src`
Expected: no output.
Run: `npm test` (expect PASS).

- [ ] **Step 4: Commit**

```bash
git add src/pages/telemetry.astro src/components/Telemetry.astro
git commit -m "feat(telemetry): Sheet B-01 — full telemetry and the yard ledger on their own page" -- src/pages/telemetry.astro src/components/Telemetry.astro
```

**Phase 4 gate (orchestrator):** browser pass on `/telemetry/` in both themes at 1440 and 390. The nav B1 link must mark the current page. Check that the heatmap scrolls inside its box at 390.

---

## Phase 5 — Cleanup, docs, ship

### Task 10: Dead-CSS sweep, un-skip the palette test, docs (Sonnet 5.5 · medium)

**Files:**
- Modify: `src/styles/global.css`
- Modify: `tests/unit/palette.test.ts` (remove `.skip`)
- Modify: `AGENTS.md`, `README.md` (if it describes the look or the hero)

- [ ] **Step 1: List dead selectors**

```bash
grep -oE "(#fy-[a-z0-9-]+|\.fy-[a-z0-9-]+)" src/styles/global.css | sort -u | while read s; do n="${s:1}"; grep -rqE "(id|class)=[\"'{][^\"']*\b$n\b|classList[^;]*'$n'|\b$n\b" src --include=*.astro --include=*.ts --include=*.tsx || echo "DEAD $s"; done
```

For every `DEAD` selector, delete its rule. If the rule's comment header introduces only dead rules, delete the header too. Known-dead after Tasks 1–9: `#fy-poster-rings`, `.fy-hero-scrim`, `#fy-canvas-mount`, `.fy-cue-anim`, `.fy-bench*`, `.fy-cards*`, `.fy-sheet-num`, `.fy-sheet-sep`, `.fy-sheet-name`, `.fy-sheet-edge*`, `.fy-yard-bleed`, `#fy-headerbg`, `.fy-mono-cased`, and the TYP-2/TYP-8 rules keyed to `#fy-callout-a` / `#fy-callout-c` sizes. The egg ids are still live, but the size overrides are dead.

**Do not delete** the following:
- anything under `/* ===== Easter eggs`, except the night palette (moved in Task 3);
- the harness `fyh-*` / fullscreen blocks;
- the `/craft/` essay blocks;
- MOT reduced-motion blocks that still match live selectors.

- [ ] **Step 2: Un-skip and run the palette test**

Remove `.skip` from `tests/unit/palette.test.ts`.
Run: `npx vitest run tests/unit/palette.test.ts`
Expected: PASS. If a file still holds a retired hex, replace it with the matching token (`var(--ds-text)` for an interaction colour, `var(--ds-secondary)` for a heat or revision colour) and re-run.

- [ ] **Step 3: Update AGENTS.md**

1. Project decisions table, **Stack** row: replace `3D via Three.js (\`src/lib/three\`)` with `No 3D runtime: the Three.js hero scene was retired in the Drawing Set redesign (2026-10-06); the isometric yard SVG is the hero.`
2. Add a new section `## Drawing Set theme (2026-10-06)` stating:
   - the colour-family rule (ink = interaction at rest and on hover; redline = revisions/heat/lit windows only, never a link, focus or toggle);
   - all colour lives in `src/styles/drawing-set.css`, enforced by `tests/unit/palette.test.ts` and `tests/unit/drawing-set-tokens.test.ts`;
   - the vendored `src/styles/tokens/*.css` stay unedited;
   - type is Archivo + IBM Plex Mono, with no uppercase tracked eyebrows;
   - every page opens with `SheetHead` and a code from `src/lib/sheet.ts`;
   - the yard re-themes through tokens only — never edit `works-svg.ts` for colour.
3. In "SVG figures & fullscreen/modal overlays", replace the first bullet's brand-scoping hazard with: `drawing-set.css sets every token at html:root[data-theme] and on each .brand-* class, so overlays outside a .brand-* wrapper no longer inherit the Paperix fallback.`

- [ ] **Step 4: Verify and commit**

Run: `npm test` (expect PASS) and `npm run build` (expect exit 0).

```bash
git commit -m "chore(theme): sweep dead pre-redesign CSS, enforce retired-palette test" -- src/styles/global.css tests/unit/palette.test.ts
git commit -m "docs: AGENTS.md — drawing-set colour rule, retired Three.js stack row" -- AGENTS.md README.md
```

### Task 11: Acceptance, checklist, session log, PR (orchestrator)

- [ ] **Step 1: Gates.** Run `npm test`, `npm run build` and `npx npm@10 ci`. All three must exit 0.
- [ ] **Step 2: Browser acceptance.** Check every page (`/`, `/updates/`, `/telemetry/`, `/harness/`, `/craft/`, `/404`) in both themes at 1440, 1024 and 390, with a forced theme opposite the OS theme. Run `getComputedStyle` spot-checks for link colour, button background and `.ds-kicker` text-transform. Exercise all three eggs on `/` and the yard fullscreen dialog. Confirm the harness RoutingCard (React island) renders with ink and redline only.
- [ ] **Step 3: Review.** Run `/code-review` on `main...HEAD`. Fix every CRITICAL and HIGH finding before pushing.
- [ ] **Step 4: Manual-test checklist.** Write `.scratch/feat-drawing-set-redesign-test-checklist.html`, following the global rules: localStorage-persisted checkboxes, progress bar, `<details open>` "What's in this branch". Cover the eggs on a real phone, iOS Safari sticky header, a theme flip mid-scroll, fullscreen yard pinch-zoom, and LinkedIn unfurl of the old OG image. The OG image is still the old theme: list a new one as a follow-up.
- [ ] **Step 5: Session log** `docs/sessions/0014-2026-10-06-drawing-set-redesign.md` plus the README index row, committed as a separate `docs:` commit.
- [ ] **Step 6: Push and open the PR** with `gh pr create`. The body summarises every phase, lists the decisions (colour rule replaced, Three.js retired, system theme default, Foundry added to the schedule) and the follow-ups (OG image), and ends with the attribution lines.
