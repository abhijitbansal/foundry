// craft-svg.ts — "The New Craft" (/craft/) figures: the room-is-the-harness
// org chart and the nine per-skill ink vignettes. Ported verbatim from the
// approved design canvas (.scratch/craft-canvas/Main.dc.html) with literal
// hex swapped for House DS custom properties so both themes render free —
// same pattern as harness-svg.ts. Pure, dependency-free, build-time only.

const INK = 'var(--ds-text-3)';
const HAIR_S = 'var(--ds-line-strong)';
const PAPER = 'var(--ds-bg)';
const TEXT = 'var(--ds-text)';
const ACCENT = 'var(--ds-accent)';
const ACCENT_H = 'var(--ds-accent-hover)';
// --ds-amber-ink: figure-weight amber (brands.css, .brand-skills). Dark's
// UI --ds-secondary (#E8B94A) jumps to ~9.7:1 while the ink linework holds
// ~4.7:1, flipping figure/ground between themes; this token pins amber just
// ahead of the ink in both. Fallback keeps non-brand contexts sane.
const AMBER = 'var(--ds-amber-ink, var(--ds-secondary))';
const MONO = 'var(--ds-font-mono)';
const SERIF = 'var(--ds-font-display)';
const BODY = 'var(--ds-font-body)';

function vignetteOpen(label: string): string {
	return `<svg viewBox="0 0 280 130" style="width:100%;height:auto;display:block" role="img" aria-label="${label}">`;
}

function caption(x: number, y: number, text: string, color: string = INK): string {
	return `<text x="${x}" y="${y}" text-anchor="middle" style="fill:${color};font-family:${MONO};font-size:10px;letter-spacing:1.5px">${text}</text>`;
}

/** Act I — First principles: plumb line dropping to bedrock strata. */
export function buildVigFirstPrinciples(): string {
	return [
		vignetteOpen('A plumb line dropping to bedrock strata'),
		`<line x1="140" y1="14" x2="140" y2="64" style="stroke:${ACCENT_H}" stroke-width="1.5"/>`,
		`<circle cx="140" cy="14" r="3" fill="none" style="stroke:${ACCENT_H}" stroke-width="1.5"/>`,
		`<path d="M133 64 h14 l-7 13 z" style="fill:${ACCENT_H}"/>`,
		`<g fill="none" style="stroke:${INK}" stroke-width="1.5">`,
		`<path d="M46 92 h188"/><path d="M58 104 h164"/><path d="M70 116 h140"/>`,
		`</g>`,
		`<line x1="110" y1="92" x2="170" y2="92" style="stroke:${AMBER}" stroke-width="3"/>`,
		`</svg>`,
	].join('');
}

/** Act I — Owning the outcome: a pager labeled YOU, ringing. */
export function buildVigOutcome(): string {
	return [
		vignetteOpen('A pager labeled YOU, ringing'),
		`<path d="M126 34 a20 20 0 0 1 28 0" fill="none" style="stroke:${AMBER}" stroke-width="1.5"/>`,
		`<path d="M118 24 a32 32 0 0 1 44 0" fill="none" style="stroke:${AMBER}" stroke-width="1.5"/>`,
		`<g fill="none" style="stroke:${INK}" stroke-width="1.5">`,
		`<rect x="94" y="48" width="92" height="52" rx="8"/>`,
		`<rect x="106" y="60" width="68" height="22" rx="3"/>`,
		`<circle cx="112" cy="91" r="2.5"/><circle cx="124" cy="91" r="2.5"/><circle cx="136" cy="91" r="2.5"/>`,
		`</g>`,
		`<text x="140" y="76" text-anchor="middle" style="fill:${ACCENT_H};font-family:${MONO};font-size:12px;letter-spacing:2px">YOU</text>`,
		caption(140, 120, 'ON CALL, ALWAYS'),
		`</svg>`,
	].join('');
}

/** Act II — Design the org: two components joined plug-in-socket. */
export function buildVigOrgDesign(): string {
	return [
		vignetteOpen('Two components joined by a precise plug-and-socket contract'),
		`<g fill="none" style="stroke:${INK}" stroke-width="1.5">`,
		`<rect x="36" y="44" width="70" height="44" rx="8"/>`,
		`<rect x="174" y="44" width="70" height="44" rx="8"/>`,
		`<path d="M106 66 h14"/><path d="M160 66 h14"/>`,
		`</g>`,
		`<g fill="none" style="stroke:${ACCENT_H}" stroke-width="1.5">`,
		`<path d="M120 54 h12 v8 h8 v8 h-8 v8 h-12 z"/>`,
		`<path d="M160 54 h-12 v8 h-8 v8 h8 v8 h12 z"/>`,
		`</g>`,
		caption(140, 116, 'SHARP INTERFACES'),
		`</svg>`,
	].join('');
}

/** Act II — Harness engineering: pegboard workbench with an eval gauge. */
export function buildVigHarness(): string {
	return [
		vignetteOpen('A pegboard workbench with hung tools and an eval gauge'),
		`<g fill="none" style="stroke:${INK}" stroke-width="1.5">`,
		`<rect x="58" y="20" width="164" height="78" rx="6"/>`,
		`<path d="M84 38 v22 h14"/><path d="M126 38 v26"/><path d="M118 38 h16"/>`,
		`</g>`,
		`<g style="fill:${HAIR_S}">`,
		`<circle cx="84" cy="32" r="2"/><circle cx="126" cy="32" r="2"/><circle cx="168" cy="32" r="2"/>`,
		`<circle cx="84" cy="80" r="2"/><circle cx="126" cy="80" r="2"/>`,
		`</g>`,
		`<path d="M154 78 a16 16 0 0 1 32 0" fill="none" style="stroke:${INK}" stroke-width="1.5"/>`,
		`<line x1="170" y1="78" x2="180" y2="66" style="stroke:${AMBER}" stroke-width="2"/>`,
		`<circle cx="170" cy="78" r="2.5" style="fill:${AMBER}"/>`,
		caption(140, 120, 'TUNE THE ROOM'),
		`</svg>`,
	].join('');
}

/** Act II — Know your agents' limits: capability dial near the redline. */
export function buildVigLimits(): string {
	return [
		vignetteOpen('A capability dial with the needle near the marked limit zone'),
		`<path d="M70 100 a70 70 0 0 1 140 0" fill="none" style="stroke:${INK}" stroke-width="1.5"/>`,
		`<path d="M186 55 a70 70 0 0 1 24 45" fill="none" style="stroke:${AMBER}" stroke-width="3"/>`,
		`<g style="stroke:${INK}" stroke-width="1.5">`,
		`<line x1="70" y1="100" x2="78" y2="100"/>`,
		`<line x1="79" y1="66" x2="86" y2="70"/>`,
		`<line x1="106" y1="41" x2="110" y2="48"/>`,
		`<line x1="140" y1="30" x2="140" y2="38"/>`,
		`<line x1="174" y1="41" x2="170" y2="48"/>`,
		`</g>`,
		`<line x1="140" y1="100" x2="184" y2="52" style="stroke:${ACCENT_H}" stroke-width="2"/>`,
		`<circle cx="140" cy="100" r="3.5" style="fill:${ACCENT_H}"/>`,
		caption(140, 124, 'KNOW THE REDLINE, THIS MONTH'),
		`</svg>`,
	].join('');
}

/** Act III — Curiosity to challenge: magnifier over a confident report. */
export function buildVigCuriosity(): string {
	return [
		vignetteOpen('A magnifier held over a confident report, revealing hatched gaps'),
		`<g fill="none" style="stroke:${INK}" stroke-width="1.5">`,
		`<path d="M64 30 h130 a8 8 0 0 1 8 8 v48 a8 8 0 0 1 -8 8 h-96 l-16 14 v-14 h-18 a8 8 0 0 1 -8 -8 v-48 a8 8 0 0 1 8 -8 z"/>`,
		`<line x1="80" y1="50" x2="150" y2="50"/>`,
		`<line x1="80" y1="64" x2="186" y2="64"/>`,
		`<line x1="80" y1="78" x2="128" y2="78"/>`,
		`</g>`,
		`<g style="stroke:${AMBER}" stroke-width="1.5">`,
		`<line x1="166" y1="72" x2="176" y2="62"/>`,
		`<line x1="174" y1="80" x2="190" y2="64"/>`,
		`<line x1="184" y1="86" x2="198" y2="72"/>`,
		`</g>`,
		`<circle cx="182" cy="74" r="26" fill="none" style="stroke:${ACCENT_H}" stroke-width="2"/>`,
		`<line x1="201" y1="93" x2="222" y2="114" style="stroke:${ACCENT_H}" stroke-width="2.5"/>`,
		caption(140, 126, 'ASK WHY, THREE TIMES'),
		`</svg>`,
	].join('');
}

/** Act III — The tester's mindset: a sieve passing few good tests. */
export function buildVigTester(): string {
	return [
		vignetteOpen('A sieve passing few good tests and holding back the noisy ones'),
		`<g fill="none" style="stroke:${INK}" stroke-width="1.5">`,
		`<path d="M76 16 h128 l-36 46 v30 h-56 v-30 z"/>`,
		`<line x1="112" y1="70" x2="168" y2="70" stroke-dasharray="3 4"/>`,
		`</g>`,
		`<g style="stroke:${AMBER}" stroke-width="1.5">`,
		`<line x1="112" y1="34" x2="122" y2="44"/><line x1="122" y1="34" x2="112" y2="44"/>`,
		`<line x1="152" y1="30" x2="162" y2="40"/><line x1="162" y1="30" x2="152" y2="40"/>`,
		`</g>`,
		`<path d="M132 96 l6 7 l12 -13" fill="none" style="stroke:${ACCENT_H}" stroke-width="2"/>`,
		`<path d="M160 100 l5 6 l10 -11" fill="none" style="stroke:${ACCENT_H}" stroke-width="1.5"/>`,
		caption(140, 126, 'EVERY BAD TEST IS A TAX'),
		`</svg>`,
	].join('');
}

/** Act III — Security as risk ownership: locked gate in the guardrail fence. */
export function buildVigSecurity(): string {
	return [
		vignetteOpen('A locked gate in the guardrail fence, key held aside'),
		`<g style="stroke:${INK}" stroke-width="1.5">`,
		`<line x1="48" y1="24" x2="48" y2="88"/><line x1="72" y1="24" x2="72" y2="88"/><line x1="96" y1="24" x2="96" y2="88"/>`,
		`<line x1="184" y1="24" x2="184" y2="88"/><line x1="208" y1="24" x2="208" y2="88"/><line x1="232" y1="24" x2="232" y2="88"/>`,
		`<line x1="40" y1="36" x2="240" y2="36"/><line x1="40" y1="78" x2="240" y2="78"/>`,
		`</g>`,
		`<g fill="none" style="stroke:${ACCENT_H}" stroke-width="1.5">`,
		`<rect x="126" y="48" width="28" height="22" rx="4"/>`,
		`<path d="M132 48 v-8 a8 8 0 0 1 16 0 v8"/>`,
		`</g>`,
		`<g fill="none" style="stroke:${AMBER}" stroke-width="1.5">`,
		`<circle cx="140" cy="100" r="6"/>`,
		`<path d="M146 100 h18 v5 h-6 v-5"/>`,
		`</g>`,
		caption(140, 126, 'LEAST PRIVILEGE'),
		`</svg>`,
	].join('');
}

/** Coda — the upgrade loop circling quarterly-rising bars. */
export function buildVigCoda(): string {
	return [
		vignetteOpen('An upgrade loop circling steps that rise every quarter'),
		`<path d="M92 96 a58 44 0 1 1 20 30" fill="none" style="stroke:${ACCENT_H}" stroke-width="1.5"/>`,
		`<path d="M112 126 l-12 -4 l4 12 z" style="fill:${ACCENT_H}"/>`,
		`<g style="stroke:${AMBER}" stroke-width="3">`,
		`<line x1="118" y1="86" x2="118" y2="72"/>`,
		`<line x1="134" y1="86" x2="134" y2="62"/>`,
		`<line x1="150" y1="86" x2="150" y2="52"/>`,
		`<line x1="166" y1="86" x2="166" y2="40"/>`,
		`</g>`,
		caption(142, 112, 'RE-BASELINE QUARTERLY'),
		`</svg>`,
	].join('');
}

const ROOM_ARIA_LABEL =
	'An engineer directing three agents inside a room whose walls are the harness: delegation lines run down to Planner, Builder, and Reviewer; reports flow back; tools, guardrails, an eval gauge, and a context shelf line the walls.';

/** The room-is-the-harness org chart (figure between Acts II and III). */
export function buildRoom(): string {
	const agent = (x: number, name: string, sub: string): string =>
		[
			`<g>`,
			`<rect x="${x}" y="208" width="138" height="58" rx="10" style="fill:${PAPER};stroke:${HAIR_S}" stroke-width="1.5"/>`,
			`<text x="${x + 69}" y="233" text-anchor="middle" style="fill:${TEXT};font-family:${BODY};font-size:15px;font-weight:600">${name}</text>`,
			`<text x="${x + 69}" y="252" text-anchor="middle" style="fill:${INK};font-family:${MONO};font-size:10px;letter-spacing:1px">${sub}</text>`,
			`</g>`,
		].join('');
	const wallLabel = (x: number, y: number, text: string): string =>
		`<text x="${x}" y="${y}" text-anchor="middle" style="fill:${INK};font-family:${MONO};font-size:10px;letter-spacing:1px">${text}</text>`;

	return [
		`<svg viewBox="0 0 1040 420" style="width:100%;height:auto;display:block" role="img" aria-label="${ROOM_ARIA_LABEL}">`,
		// room shell
		`<rect x="30" y="24" width="980" height="372" rx="14" fill="none" style="stroke:${HAIR_S}" stroke-width="1.5"/>`,
		`<text x="66" y="56" style="fill:${INK};font-family:${MONO};font-size:10px;letter-spacing:1.5px">THE ROOM IS THE HARNESS</text>`,
		// tools (left wall)
		`<g fill="none" style="stroke:${INK}" stroke-width="1.5">`,
		`<rect x="58" y="150" width="34" height="24" rx="3"/><path d="M67 150 v-8 h16 v8"/>`,
		`<rect x="58" y="196" width="34" height="24" rx="3"/><path d="M67 196 v-8 h16 v8"/>`,
		`</g>`,
		wallLabel(75, 248, 'TOOLS'),
		// guardrails (right wall)
		`<g style="stroke:${INK}" stroke-width="1.5">`,
		`<line x1="952" y1="150" x2="952" y2="220"/><line x1="966" y1="150" x2="966" y2="220"/><line x1="980" y1="150" x2="980" y2="220"/>`,
		`<line x1="945" y1="162" x2="987" y2="162"/><line x1="945" y1="206" x2="987" y2="206"/>`,
		`</g>`,
		wallLabel(966, 248, 'GUARDRAILS'),
		// evals gauge (top right)
		`<path d="M868 84 a34 34 0 0 1 68 0" fill="none" style="stroke:${INK}" stroke-width="1.5"/>`,
		`<line x1="902" y1="84" x2="922" y2="62" style="stroke:${AMBER}" stroke-width="2"/>`,
		`<circle cx="902" cy="84" r="3" style="fill:${AMBER}"/>`,
		wallLabel(902, 106, 'EVALS'),
		// context shelf (bottom)
		`<g fill="none" style="stroke:${INK}" stroke-width="1.5">`,
		`<rect x="470" y="352" width="30" height="12" rx="2"/><rect x="506" y="346" width="30" height="18" rx="2"/><rect x="542" y="356" width="30" height="8" rx="2"/>`,
		`</g>`,
		wallLabel(521, 382, 'CONTEXT'),
		// you
		`<rect x="440" y="56" width="160" height="64" rx="10" style="fill:var(--ds-accent-soft);stroke:${ACCENT}" stroke-width="1.5"/>`,
		`<text x="520" y="84" text-anchor="middle" style="fill:${TEXT};font-family:${SERIF};font-size:22px">You</text>`,
		`<text x="520" y="104" text-anchor="middle" style="fill:${INK};font-family:${MONO};font-size:10px;letter-spacing:1px">DIRECT &#183; VERIFY &#183; OWN IT</text>`,
		// delegation lines
		`<g fill="none" style="stroke:${ACCENT_H}" stroke-width="1.2" stroke-dasharray="5 4">`,
		`<path d="M470 120 C 420 160, 330 180, 285 208"/>`,
		`<path d="M520 120 L 520 208"/>`,
		`<path d="M570 120 C 620 160, 710 180, 755 208"/>`,
		`</g>`,
		// report-back line
		`<path d="M800 240 C 880 220, 880 130, 610 96" fill="none" style="stroke:${AMBER}" stroke-width="1.2" stroke-dasharray="2 4"/>`,
		`<text x="852" y="150" style="fill:${AMBER};font-family:${MONO};font-size:9px;letter-spacing:1px">REPORTS</text>`,
		// agents
		agent(216, 'Planner', 'THINKS FIRST'),
		agent(451, 'Builder', 'SHIPS SMALL'),
		agent(686, 'Reviewer', 'TRUSTS NOTHING'),
		`</svg>`,
	].join('');
}
