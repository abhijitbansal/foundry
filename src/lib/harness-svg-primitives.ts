// harness-svg-primitives.ts — paint primitives + geometry pieces for
// "The Harness" figures, ported from
// design_handoff_harness/src/harness-hall.jsx as plain SVG-string builders
// (no React), mirroring the works.ts + works-svg.ts split. Build-time only:
// no window/document access. React-only `key` props from the source are
// dropped throughout — they have no effect on the rendered markup.

export type Point = [number, number];
export type Proj = (x: number, y: number, z?: number) => Point;

export const C = {
	ink: 'var(--ds-text-2)',
	inkStrong: 'var(--ds-text)',
	inkSoft: 'var(--ds-text-3)',
	inkFaint: 'var(--ds-text-faint)',
	// capSoft/capFaint: text-only readability lift for small SVG captions.
	// inkSoft/inkFaint measure ~2:1-4.3:1 against --ds-surface at these
	// sizes (fails WCAG AA); blending toward --ds-text raises contrast in
	// both themes since --ds-text is each theme's high-contrast extreme.
	// Kept separate from inkSoft/inkFaint (not a remap) because those two
	// also paint decorative strokes (smoke, leader lines, hairline ticks)
	// that should stay faint.
	capSoft: 'color-mix(in srgb, var(--ds-text) 45%, var(--ds-text-3) 55%)',
	capFaint: 'color-mix(in srgb, var(--ds-text) 35%, var(--ds-text-faint) 65%)',
	hair: 'var(--ds-line)',
	hairS: 'var(--ds-line-strong)',
	paper: 'var(--ds-surface)',
	paper2: 'var(--ds-surface-2)',
	plate: 'color-mix(in srgb, var(--ds-surface-2) 62%, var(--ds-surface))',
	plateEdge: 'color-mix(in srgb, var(--ds-text) 10%, var(--ds-surface-2))',
	shade: 'color-mix(in srgb, var(--ds-text) 13%, var(--ds-surface-2))',
	winOff: 'color-mix(in srgb, var(--ds-text) 24%, var(--ds-surface-2))',
	accent: 'var(--ds-accent)',
	accentH: 'var(--ds-accent-hover)',
	accentSoft: 'color-mix(in srgb, var(--ds-accent) 14%, transparent)',
	gold: 'var(--ds-secondary)',
	danger: 'var(--ds-danger)',
	warn: 'var(--ds-warning)',
	good: 'var(--ds-success)',
	mono: 'var(--ds-font-mono)',
	serif: 'var(--ds-font-display)',
};

export const HAIR = 0.7;
export const LINE = 1.05;

// A flat +1 here broke Tracker's fixed-width boxes (trackerPlate cards,
// ledger row label/status columns) — text ran past box edges and
// collided with adjacent columns, confirmed by screenshot. Geometry is
// collision-tuned per this file's own header comment; a blanket size
// bump isn't safe across all five figures. Back to 0 — see harness-svg.ts
// buildTracker() if this gets revisited: those specific boxes would need
// widening first, deliberately, before any font bump could be safe there.
export const TEXT_BUMP = 0;

export function makeProj(S: number, ox: number, oy: number): Proj {
	const cx = Math.cos(Math.PI / 6) * S;
	const cy = Math.sin(Math.PI / 6) * S;
	return (x, y, z = 0) => [ox + (x - y) * cx, oy + (x + y) * cy - z * S];
}

// n/pl match harness-hall.jsx's own precision (.toFixed(1)) — the source
// geometry was collision-tuned against that rounding; do not switch to
// works-svg.ts's .toFixed(2).
function n(v: number): string {
	return v.toFixed(1);
}

export function pl(points: Point[]): string {
	return points.map((p) => `${n(p[0])},${n(p[1])}`).join(' ');
}

function esc(t: string): string {
	return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

interface PoOpts {
	p: string;
	f?: string;
	s?: string;
	w?: number;
	o?: number;
	dash?: string;
	cls?: string;
}

export function Po(opts: PoOpts): string {
	const { p, f = 'none', s = C.ink, w = HAIR, o, dash, cls } = opts;
	const style = `fill:${f};stroke:${s}${o !== undefined ? `;opacity:${o}` : ''}`;
	return `<polygon points="${p}"${cls ? ` class="${cls}"` : ''} style="${style}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''} stroke-linejoin="round"/>`;
}

interface PaOpts {
	d: string;
	f?: string;
	s?: string;
	w?: number;
	o?: number;
	dash?: string;
	cls?: string;
	cap?: string;
	marker?: string;
}

export function Pa(opts: PaOpts): string {
	const { d, f = 'none', s = C.ink, w = HAIR, o, dash, cls, cap = 'round', marker } = opts;
	const style = `fill:${f};stroke:${s}${o !== undefined ? `;opacity:${o}` : ''}`;
	return `<path d="${d}"${cls ? ` class="${cls}"` : ''} style="${style}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''} stroke-linecap="${cap}" stroke-linejoin="round"${marker ? ` marker-end="${marker}"` : ''}/>`;
}

interface LnOpts {
	a: Point;
	b: Point;
	s?: string;
	w?: number;
	o?: number;
	dash?: string;
	cls?: string;
	marker?: string;
}

export function Ln(opts: LnOpts): string {
	const { a, b, s = C.ink, w = HAIR, o, dash, cls, marker } = opts;
	const style = `stroke:${s}${o !== undefined ? `;opacity:${o}` : ''}`;
	return `<line x1="${n(a[0])}" y1="${n(a[1])}" x2="${n(b[0])}" y2="${n(b[1])}"${cls ? ` class="${cls}"` : ''} style="${style}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''} stroke-linecap="round"${marker ? ` marker-end="${marker}"` : ''}/>`;
}

interface CiOpts {
	c: Point;
	r: number;
	f?: string;
	s?: string;
	w?: number;
	o?: number;
	cls?: string;
}

export function Ci(opts: CiOpts): string {
	const { c, r, f = 'none', s = C.ink, w = HAIR, o, cls } = opts;
	const style = `fill:${f};stroke:${s}${o !== undefined ? `;opacity:${o}` : ''}`;
	return `<circle cx="${n(c[0])}" cy="${n(c[1])}" r="${n(r)}"${cls ? ` class="${cls}"` : ''} style="${style}" stroke-width="${w}"/>`;
}

interface TxOpts {
	x: number;
	y: number;
	t: string;
	size?: number;
	fill?: string;
	w?: number;
	ls?: string;
	anchor?: 'start' | 'middle' | 'end';
	font?: string;
	o?: number;
	upper?: boolean;
}

export function Tx(opts: TxOpts): string {
	const { x, y, t, size = 9, fill = C.capSoft, w = 500, ls = '0.09em', anchor = 'start', font = C.mono, o, upper = true } = opts;
	const style = `fill:${fill}${o !== undefined ? `;opacity:${o}` : ''};font-family:${font};font-size:${size + TEXT_BUMP}px;font-weight:${w};letter-spacing:${ls};text-transform:${upper ? 'uppercase' : 'none'}`;
	return `<text x="${n(x)}" y="${n(y)}" text-anchor="${anchor}" style="${style}">${esc(t)}</text>`;
}

export function g(children: string[], attrs?: Record<string, string>): string {
	const attrStr = attrs
		? Object.entries(attrs)
				.map(([k, v]) => ` ${k}="${v}"`)
				.join('')
		: '';
	return `<g${attrStr}>${children.join('')}</g>`;
}

export function hatchDefs(id: string): string {
	return (
		`<defs>` +
		`<pattern id="${id}" width="5" height="5" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">` +
		`<line x1="0" y1="0" x2="0" y2="5" style="stroke:var(--ds-text)" stroke-width="0.55" opacity="0.16"/>` +
		`</pattern>` +
		`<marker id="${id}-arr" viewBox="0 0 8 8" refX="6.5" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">` +
		`<path d="M0.5,0.8 L7,4 L0.5,7.2" fill="none" style="stroke:context-stroke" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>` +
		`</marker>` +
		`</defs>`
	);
}

interface GroundOpts {
	noGrid?: boolean;
}

export function ground(P: Proj, x: number, y: number, w: number, d: number, opts: GroundOpts = {}): string[] {
	const els: string[] = [];
	const t = 0.14;
	els.push(Po({ p: pl([P(x, y, 0), P(x + w, y, 0), P(x + w, y + d, 0), P(x, y + d, 0)]), f: C.plate, s: C.hairS }));
	els.push(Po({ p: pl([P(x, y + d, 0), P(x + w, y + d, 0), P(x + w, y + d, -t), P(x, y + d, -t)]), f: C.plateEdge, s: C.hairS }));
	els.push(Po({ p: pl([P(x + w, y, 0), P(x + w, y + d, 0), P(x + w, y + d, -t), P(x + w, y, -t)]), f: C.paper2, s: C.hairS }));
	if (!opts.noGrid) {
		for (let i = 2; i < w; i += 2) els.push(Ln({ a: P(x + i, y, 0), b: P(x + i, y + d, 0), s: C.hair, w: 0.45, o: 0.6 }));
		for (let j = 2; j < d; j += 2) els.push(Ln({ a: P(x, y + j, 0), b: P(x + w, y + j, 0), s: C.hair, w: 0.45, o: 0.6 }));
	}
	return els;
}

export function shadowOf(P: Proj, x: number, y: number, w: number, d: number, h: number): string {
	const k = Math.min(0.5, 0.14 + h * 0.055);
	return Po({
		p: pl([P(x + w, y, 0), P(x + w, y + d, 0), P(x + w + h * k, y + d + h * k * 0.4, 0), P(x + w + h * k, y + h * k * 0.4, 0)]),
		f: 'var(--ds-text)',
		s: 'none',
		o: 0.055,
	});
}

export function box(P: Proj, x: number, y: number, w: number, d: number, h: number, z0 = 0, hatchId?: string | null, topFill?: string): string[] {
	const els: string[] = [];
	const fy: Point[] = [P(x, y + d, z0), P(x + w, y + d, z0), P(x + w, y + d, z0 + h), P(x, y + d, z0 + h)];
	els.push(Po({ p: pl(fy), f: C.shade, s: C.ink }));
	if (hatchId) els.push(Po({ p: pl(fy), f: `url(#${hatchId})`, s: 'none' }));
	els.push(Po({ p: pl([P(x + w, y, z0), P(x + w, y + d, z0), P(x + w, y + d, z0 + h), P(x + w, y, z0 + h)]), f: C.paper2, s: C.ink }));
	els.push(Po({ p: pl([P(x, y, z0 + h), P(x + w, y, z0 + h), P(x + w, y + d, z0 + h), P(x, y + d, z0 + h)]), f: topFill || C.paper, s: C.ink }));
	return els;
}

export function windowsSE(P: Proj, x: number, y: number, w: number, d: number, h: number, z0: number, cols: number, rows: number, litSet?: Set<number>): string[] {
	const els: string[] = [];
	const my = 0.24;
	const gz = (h - 0.5) / rows;
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			const yy = y + my + (c * (d - my * 2)) / cols;
			const hh = z0 + 0.34 + r * gz;
			const wW = (d - my * 2) / cols - 0.14;
			const wH = Math.min(0.44, gz - 0.16);
			const lit = litSet != null && litSet.has(r * cols + c);
			els.push(
				Po({
					p: pl([P(x + w, yy, hh), P(x + w, yy + wW, hh), P(x + w, yy + wW, hh + wH), P(x + w, yy, hh + wH)]),
					f: lit ? C.gold : C.winOff,
					s: C.ink,
					w: 0.5,
					o: lit ? 0.92 : 0.75,
					cls: lit ? 'fyh-glow' : undefined,
				}),
			);
		}
	}
	return els;
}

export function smoke(P: Proj, x: number, y: number, z: number, motion: boolean, delay: number): string[] {
	const [sx, sy] = P(x, y, z);
	if (!motion) {
		return [Ci({ c: [sx + 1, sy - 6], r: 3.4, s: C.inkSoft, w: 0.6, o: 0.5 }), Ci({ c: [sx + 3.5, sy - 13], r: 4.6, s: C.inkSoft, w: 0.55, o: 0.35 })];
	}
	return [0, 1, 2].map(
		(i) =>
			`<circle cx="${n(sx + 1 + i * 1.4)}" cy="${n(sy - 4 - i * 2)}" r="${n(3 + i * 1.1)}" class="fyh-smoke" style="fill:none;stroke:${C.inkSoft};animation-delay:${delay + i * 1.6}s" stroke-width="0.6"/>`,
	);
}

interface LeaderOpts {
	anchor?: 'start' | 'end';
}

export function leader(from: Point, to: Point, text: string | string[], opts: LeaderOpts = {}): string {
	const els: string[] = [];
	els.push(Pa({ d: `M${from[0]},${from[1]} L${to[0]},${to[1]}`, s: C.hairS, w: 0.6, dash: '3 3', o: 0.9 }));
	els.push(Ci({ c: from, r: 1.6, f: C.accent, s: 'none', o: 0.9 }));
	const lines = Array.isArray(text) ? text : [text];
	lines.forEach((t, i) => {
		els.push(
			Tx({
				x: to[0] + (opts.anchor === 'end' ? -4 : 4),
				y: to[1] + 3 + i * 12,
				t,
				size: i === 0 ? 9.5 : 8.5,
				fill: i === 0 ? C.inkStrong : C.capSoft,
				w: i === 0 ? 600 : 500,
				anchor: opts.anchor || 'start',
			}),
		);
	});
	return g(els);
}
