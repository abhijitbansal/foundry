// works-svg.ts — paint primitives + geometry pieces for "The Works",
// ported from design_handoff_works/works-city.jsx as plain SVG-string
// builders (no React). Theme (light/dark) is resolved entirely by the
// CSS custom properties in FYW_STYLE, scoped to `.fyw-svg` — the same
// dual data-theme/prefers-color-scheme pattern as
// src/styles/tokens/brands.css — so nothing here branches on a "night"
// flag; the identical markup renders correctly in both themes via the
// page's existing var(--ds-*) cascade. Motion (prefers-reduced-motion) is
// resolved the same way: every animation is emitted unconditionally and
// FYW_STYLE's reduced-motion block freezes it to a static frame.
import type { PlateSpec, StripLayoutEntry, WorksRepo, YardLayoutEntry } from './works.types';

export type Proj = (x: number, y: number, z?: number) => [number, number];

const HAIR = 0.7;
const LINE = 1.05;

const C = {
	ink: 'var(--ds-text-2)',
	inkStrong: 'var(--ds-text)',
	inkSoft: 'var(--ds-text-3)',
	inkFaint: 'var(--ds-text-faint)',
	hair: 'var(--ds-line)',
	hairS: 'var(--ds-line-strong)',
	paper: 'var(--ds-surface)',
	paper2: 'var(--ds-surface-2)',
	plate: 'color-mix(in srgb, var(--ds-surface-2) 62%, var(--ds-surface))',
	plateEdge: 'color-mix(in srgb, var(--ds-text) 10%, var(--ds-surface-2))',
	shade: 'color-mix(in srgb, var(--ds-text) 13%, var(--ds-surface-2))',
	glass: 'color-mix(in srgb, var(--ds-text) 20%, var(--ds-surface-2))',
	winOff: 'color-mix(in srgb, var(--ds-text) 24%, var(--ds-surface-2))',
	accent: 'var(--ds-accent)',
	gold: 'var(--ds-secondary)',
	mono: 'var(--ds-font-mono)',
	serif: 'var(--ds-font-display)',
	// theme-swap aliases — light values defined on .fyw-svg, dark overrides
	// under :root[data-theme="dark"]/prefers-color-scheme in FYW_STYLE.
	lit: 'var(--fyw-window-lit)',
	clerestory: 'var(--fyw-clerestory)',
	hot: 'var(--fyw-hot-fill)',
	annexGlass: 'var(--fyw-annex-glass)',
};

/** One shared <style> block: keyframes, reduced-motion freeze, theme-swap
 * custom properties, and the zero-JS mouse-hover dim + accent-highlight
 * interaction (mouse-only — the outer <svg role="img"> collapses building
 * groups out of the accessibility tree, so keyboard focus on them would be
 * an unannounced, purposeless tab stop for AT users; the ledger grid is
 * the real screen-reader-friendly data path, per README). Emitted once per
 * <svg class="fyw-svg">; safe to duplicate across multiple instances on
 * one page (updates.astro renders one strip per week). */
export const FYW_STYLE = `
	@keyframes fywPuff { 0% { transform: translate(0,0) scale(0.55); opacity: 0; } 12% { opacity: 0.55; } 70% { opacity: 0.3; } 100% { transform: translate(-13px,-34px) scale(1.65); opacity: 0; } }
	@keyframes fywFlick { 0%,100% { opacity: var(--fyw-furnace-glow-op, 0.18); } 50% { opacity: calc(var(--fyw-furnace-glow-op, 0.18) + 0.12); } }
	.fyw-flick { animation: fywFlick 4.2s var(--ds-ease-standard, ease) infinite; }
	@media (prefers-reduced-motion: reduce) {
		.fyw-puff, .fyw-flick { animation: none !important; }
		.fyw-puff { opacity: 0 !important; }
		.fyw-puff-first { opacity: 0.55 !important; }
	}
	svg.fyw-svg {
		--fyw-window-lit: var(--ds-accent);
		--fyw-clerestory: color-mix(in srgb, var(--ds-accent) 55%, var(--ds-surface-2));
		--fyw-hot-fill: var(--ds-surface);
		--fyw-annex-glass: color-mix(in srgb, var(--ds-text) 20%, var(--ds-surface-2));
		--fyw-halo-op: 0;
		--fyw-hot-glow-op: 0;
		--fyw-furnace-glow-op: 0.18;
		--fyw-furnace-glow-r: 10px;
	}
	:root[data-theme="dark"] svg.fyw-svg,
	:root:not([data-theme="light"]) svg.fyw-svg {
		--fyw-window-lit: var(--ds-secondary);
		--fyw-clerestory: var(--ds-secondary);
		--fyw-hot-fill: var(--ds-secondary);
		--fyw-annex-glass: color-mix(in srgb, var(--ds-secondary) 32%, var(--ds-surface-2));
		--fyw-halo-op: 0.13;
		--fyw-hot-glow-op: 0.16;
		--fyw-furnace-glow-op: 0.3;
		--fyw-furnace-glow-r: 15px;
	}
	@media (prefers-color-scheme: light) {
		:root:not([data-theme="dark"]) svg.fyw-svg {
			--fyw-window-lit: var(--ds-accent);
			--fyw-clerestory: color-mix(in srgb, var(--ds-accent) 55%, var(--ds-surface-2));
			--fyw-hot-fill: var(--ds-surface);
			--fyw-annex-glass: color-mix(in srgb, var(--ds-text) 20%, var(--ds-surface-2));
			--fyw-halo-op: 0;
			--fyw-hot-glow-op: 0;
			--fyw-furnace-glow-op: 0.18;
			--fyw-furnace-glow-r: 10px;
		}
	}
	.fyw-buildings:hover .fyw-building { opacity: 0.38; transition: opacity 0.25s var(--ds-ease-standard); }
	.fyw-buildings .fyw-building:hover { opacity: 1; }
	.fyw-building:hover .fyw-np-circle { fill: var(--ds-accent-soft); stroke: var(--ds-accent); }
	.fyw-building:hover .fyw-np-text { fill: var(--ds-accent); }
`;

export function makeProj(S: number, ox: number, oy: number): Proj {
	const cx = Math.cos(Math.PI / 6) * S;
	const cy = Math.sin(Math.PI / 6) * S;
	return (x, y, z = 0) => [ox + (x - y) * cx, oy + (x + y) * cy - z * S];
}

function n(v: number): string {
	return v.toFixed(2);
}

function pl(points: [number, number][]): string {
	return points.map((p) => `${n(p[0])},${n(p[1])}`).join(' ');
}

/** Deterministic PRNG seeded by a string (repo name + plane) — same input
 * always produces the same window lit/unlit sequence, so every build
 * renders identically. */
export function seeded(seedStr: string): () => number {
	let s = 7;
	for (let i = 0; i < seedStr.length; i++) s = (s * 31 + seedStr.charCodeAt(i)) >>> 0;
	return () => {
		s = (s * 1103515245 + 12345) >>> 0;
		return (s >>> 8) / 16777216;
	};
}

export function fmtK(v: number): string {
	if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
	if (v >= 1e4) return `${Math.round(v / 1e3)}k`;
	if (v >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
	return String(v);
}

function esc(t: string): string {
	return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function poly(opts: { points: [number, number][]; fill?: string; stroke?: string; width?: number; opacity?: number; dash?: string }): string {
	const { points, fill = 'none', stroke = C.ink, width = HAIR, opacity, dash } = opts;
	const style = `fill:${fill};stroke:${stroke}${opacity !== undefined ? `;opacity:${opacity}` : ''}`;
	return `<polygon points="${pl(points)}" style="${style}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''} stroke-linejoin="round"/>`;
}

function line(opts: { a: [number, number]; b: [number, number]; stroke?: string; width?: number; opacity?: number; dash?: string }): string {
	const { a, b, stroke = C.ink, width = HAIR, opacity, dash } = opts;
	const style = `stroke:${stroke}${opacity !== undefined ? `;opacity:${opacity}` : ''}`;
	return `<line x1="${n(a[0])}" y1="${n(a[1])}" x2="${n(b[0])}" y2="${n(b[1])}" style="${style}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''} stroke-linecap="round"/>`;
}

function text(opts: {
	x: number;
	y: number;
	text: string;
	size?: number;
	fill?: string;
	weight?: number;
	ls?: string;
	anchor?: 'start' | 'middle' | 'end';
	font?: string;
	className?: string;
	maxWidth?: number;
}): string {
	const { x, y, text: t, size = 9, fill = C.inkSoft, weight = 500, ls = '0.08em', anchor = 'start', font = C.mono, className, maxWidth } = opts;
	const style = `fill:${fill};font-family:${font};font-size:${size}px;font-weight:${weight};letter-spacing:${ls}`;
	// Monospace glyph-advance heuristic (0.6em/char) + letter-spacing — SVG has no
	// layout engine to measure real advance at build time, so when the estimate
	// clears maxWidth, clamp with textLength/lengthAdjust rather than risk actual
	// glyph metrics overflowing the drawn box (see titleBlock overflow fix).
	let lengthAttrs = '';
	if (maxWidth !== undefined) {
		const lsEm = parseFloat(ls) || 0;
		const estWidth = t.length * size * (0.6 + lsEm);
		if (estWidth > maxWidth) lengthAttrs = ` textLength="${n(maxWidth)}" lengthAdjust="spacingAndGlyphs"`;
	}
	return `<text${className ? ` class="${className}"` : ''} x="${n(x)}" y="${n(y)}" text-anchor="${anchor}" style="${style}"${lengthAttrs}>${esc(t)}</text>`;
}

function circle(cx: number, cy: number, r: number, opts: { fill?: string; stroke?: string; width?: number; className?: string } = {}): string {
	const { fill = 'none', stroke, width, className } = opts;
	let style = `fill:${fill}`;
	if (stroke) style += `;stroke:${stroke}`;
	return `<circle${className ? ` class="${className}"` : ''} cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" style="${style}"${width !== undefined ? ` stroke-width="${width}"` : ''}/>`;
}

function windowGlow(cx: number, cy: number): string {
	return `<circle class="fyw-window-glow" cx="${n(cx)}" cy="${n(cy)}" r="6.5" style="fill:${C.gold};opacity:var(--fyw-halo-op,0)"/>`;
}

function hotGlow(cx: number, cy: number): string {
	return `<circle class="fyw-hot-glow" cx="${n(cx)}" cy="${n(cy)}" r="9" style="fill:${C.gold};opacity:var(--fyw-hot-glow-op,0)"/>`;
}

function furnaceGlow(cx: number, cy: number): string {
	return `<circle class="fyw-furnace-glow fyw-flick" cx="${n(cx)}" cy="${n(cy)}" style="fill:${C.gold};opacity:var(--fyw-furnace-glow-op,0.18);r:var(--fyw-furnace-glow-r,10px)"/>`;
}

export function buildDefs(hatchId: string, glassId: string): string {
	return `<defs><pattern id="${hatchId}" width="4.5" height="4.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4.5" style="stroke:var(--ds-text-3);opacity:0.35" stroke-width="0.55"/></pattern><pattern id="${glassId}" width="3.4" height="8" patternUnits="userSpaceOnUse"><line x1="1.7" y1="0" x2="1.7" y2="8" style="stroke:var(--ds-text-2);opacity:0.4" stroke-width="0.5"/></pattern></defs>`;
}

export function ground(P: Proj, x: number, y: number, w: number, d: number): string {
	const t = 0.14;
	const els: string[] = [];
	els.push(poly({ points: [P(x, y, 0), P(x + w, y, 0), P(x + w, y + d, 0), P(x, y + d, 0)], fill: C.plate, stroke: C.hairS, width: HAIR }));
	els.push(poly({ points: [P(x, y + d, 0), P(x + w, y + d, 0), P(x + w, y + d, -t), P(x, y + d, -t)], fill: C.plateEdge, stroke: C.hairS, width: HAIR }));
	els.push(poly({ points: [P(x + w, y, 0), P(x + w, y + d, 0), P(x + w, y + d, -t), P(x + w, y, -t)], fill: C.paper2, stroke: C.hairS, width: HAIR }));
	for (let i = 1; i < w; i++) els.push(line({ a: P(x + i, y, 0), b: P(x + i, y + d, 0), stroke: C.hair, width: 0.5, opacity: 0.75 }));
	for (let j = 1; j < d; j++) els.push(line({ a: P(x, y + j, 0), b: P(x + w, y + j, 0), stroke: C.hair, width: 0.5, opacity: 0.75 }));
	return els.join('');
}

function shadowOf(P: Proj, x: number, y: number, w: number, d: number, h: number): string {
	const k = Math.min(0.5, 0.14 + h * 0.055);
	return poly({
		points: [P(x + w, y, 0), P(x + w, y + d, 0), P(x + w + h * k, y + d + h * k * 0.4, 0), P(x + w + h * k, y + h * k * 0.4, 0)],
		fill: 'var(--ds-text)',
		stroke: 'none',
		opacity: 0.055,
	});
}

function boxWalls(P: Proj, x: number, y: number, w: number, d: number, h: number, z0 = 0, hatchId?: string): string {
	const els: string[] = [];
	const fy: [number, number][] = [P(x, y + d, z0), P(x + w, y + d, z0), P(x + w, y + d, z0 + h), P(x, y + d, z0 + h)];
	els.push(poly({ points: fy, fill: C.shade, stroke: C.ink, width: HAIR }));
	if (hatchId) els.push(poly({ points: fy, fill: `url(#${hatchId})`, stroke: 'none' }));
	const fx: [number, number][] = [P(x + w, y, z0), P(x + w, y + d, z0), P(x + w, y + d, z0 + h), P(x + w, y, z0 + h)];
	els.push(poly({ points: fx, fill: C.paper2, stroke: C.ink, width: HAIR }));
	els.push(line({ a: P(x + w, y, z0 + 0.22), b: P(x + w, y + d, z0 + 0.22), stroke: C.hairS, width: 0.5 }));
	els.push(line({ a: P(x, y + d, z0 + 0.22), b: P(x + w, y + d, z0 + 0.22), stroke: C.hairS, width: 0.5, opacity: 0.7 }));
	return els.join('');
}

function flatTop(P: Proj, x: number, y: number, w: number, d: number, z: number): string {
	return (
		poly({ points: [P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z)], fill: C.paper, stroke: C.ink, width: HAIR }) +
		poly({
			points: [P(x + 0.12, y + 0.12, z), P(x + w - 0.12, y + 0.12, z), P(x + w - 0.12, y + d - 0.12, z), P(x + 0.12, y + d - 0.12, z)],
			fill: 'none',
			stroke: C.hair,
			width: 0.5,
		})
	);
}

function gableRoof(P: Proj, x: number, y: number, w: number, d: number, z: number, r: number, axis: 'x' | 'y', hatchId?: string): string {
	const els: string[] = [];
	if (axis === 'y') {
		const xr = x + w / 2;
		els.push(poly({ points: [P(x, y, z), P(x, y + d, z), P(xr, y + d, z + r), P(xr, y, z + r)], fill: C.paper, stroke: C.ink, width: HAIR }));
		els.push(poly({ points: [P(x + w, y, z), P(x + w, y + d, z), P(xr, y + d, z + r), P(xr, y, z + r)], fill: C.paper2, stroke: C.ink, width: HAIR }));
		const tri: [number, number][] = [P(x, y + d, z), P(x + w, y + d, z), P(xr, y + d, z + r)];
		els.push(poly({ points: tri, fill: C.shade, stroke: C.ink, width: HAIR }));
		if (hatchId) els.push(poly({ points: tri, fill: `url(#${hatchId})`, stroke: 'none' }));
		els.push(line({ a: P(xr, y, z + r), b: P(xr, y + d, z + r), stroke: C.inkStrong, width: LINE }));
	} else {
		const yr = y + d / 2;
		els.push(poly({ points: [P(x, y, z), P(x + w, y, z), P(x + w, yr, z + r), P(x, yr, z + r)], fill: C.paper, stroke: C.ink, width: HAIR }));
		els.push(poly({ points: [P(x, y + d, z), P(x + w, y + d, z), P(x + w, yr, z + r), P(x, yr, z + r)], fill: C.paper2, stroke: C.ink, width: HAIR }));
		els.push(poly({ points: [P(x + w, y, z), P(x + w, y + d, z), P(x + w, yr, z + r)], fill: C.paper2, stroke: C.ink, width: HAIR }));
		els.push(line({ a: P(x, yr, z + r), b: P(x + w, yr, z + r), stroke: C.inkStrong, width: LINE }));
	}
	return els.join('');
}

function sawtoothRoof(P: Proj, x: number, y: number, w: number, d: number, z: number, r: number, teeth: number, hatchId?: string, glassId?: string): string {
	const els: string[] = [];
	const tw = w / teeth;
	for (let i = 0; i < teeth; i++) {
		const xa = x + i * tw;
		const xb = xa + tw;
		els.push(poly({ points: [P(xa, y, z), P(xa, y + d, z), P(xb, y + d, z + r), P(xb, y, z + r)], fill: C.paper, stroke: C.ink, width: HAIR }));
		const gl: [number, number][] = [P(xb, y, z), P(xb, y + d, z), P(xb, y + d, z + r), P(xb, y, z + r)];
		els.push(poly({ points: gl, fill: C.annexGlass, stroke: C.ink, width: HAIR }));
		if (glassId) els.push(poly({ points: gl, fill: `url(#${glassId})`, stroke: 'none' }));
		const tri: [number, number][] = [P(xa, y + d, z), P(xb, y + d, z), P(xb, y + d, z + r)];
		els.push(poly({ points: tri, fill: C.shade, stroke: C.ink, width: HAIR }));
		if (hatchId) els.push(poly({ points: tri, fill: `url(#${hatchId})`, stroke: 'none' }));
	}
	return els.join('');
}

function monitorRoof(P: Proj, x: number, y: number, w: number, d: number, z: number, hatchId?: string): string {
	const els: string[] = [flatTop(P, x, y, w, d, z)];
	const mx = x + w * 0.2;
	const my = y + d * 0.24;
	const mw = w * 0.6;
	const md = d * 0.52;
	const mh = 0.34;
	els.push(boxWalls(P, mx, my, mw, md, mh, z));
	const stripY: [number, number][] = [
		P(mx + mw, my + 0.06, z + 0.08),
		P(mx + mw, my + md - 0.06, z + 0.08),
		P(mx + mw, my + md - 0.06, z + mh - 0.07),
		P(mx + mw, my + 0.06, z + mh - 0.07),
	];
	els.push(poly({ points: stripY, fill: C.clerestory, stroke: C.ink, width: 0.5, opacity: 0.95 }));
	els.push(gableRoof(P, mx, my, mw, md, z + mh, 0.22, 'y', hatchId));
	return els.join('');
}

function chimney(P: Proj, x: number, y: number, hs: number, hatchId?: string): string {
	const w = 0.34;
	const els: string[] = [];
	els.push(boxWalls(P, x, y, w, w, hs, 0, hatchId));
	els.push(boxWalls(P, x - 0.05, y - 0.05, w + 0.1, w + 0.1, 0.16, hs));
	els.push(
		poly({
			points: [P(x - 0.05, y - 0.05, hs + 0.16), P(x + w + 0.05, y - 0.05, hs + 0.16), P(x + w + 0.05, y + w + 0.05, hs + 0.16), P(x - 0.05, y + w + 0.05, hs + 0.16)],
			fill: C.paper,
			stroke: C.ink,
			width: HAIR,
		}),
	);
	els.push(
		poly({
			points: [P(x + 0.04, y + 0.04, hs + 0.161), P(x + w - 0.04, y + 0.04, hs + 0.161), P(x + w - 0.04, y + w - 0.04, hs + 0.161), P(x + 0.04, y + w - 0.04, hs + 0.161)],
			fill: 'var(--ds-text)',
			stroke: 'none',
			opacity: 0.55,
		}),
	);
	for (const bz of [0.34, 0.67]) {
		els.push(line({ a: P(x + w, y, hs * bz), b: P(x + w, y + w, hs * bz), stroke: C.hairS, width: 0.5 }));
		els.push(line({ a: P(x, y + w, hs * bz), b: P(x + w, y + w, hs * bz), stroke: C.hairS, width: 0.5 }));
	}
	return els.join('');
}

function smoke(P: Proj, x: number, y: number, z: number, i0: number): string {
	const [sx, sy] = P(x, y, z);
	const puff = (dx: number, dy: number, r: number) => `<circle cx="${n(sx + dx)}" cy="${n(sy + dy)}" r="${n(r)}" style="fill:none;stroke:${C.inkFaint}" stroke-width="0.8"/>`;
	const cluster = (idx: number) => {
		const cls = idx === 0 ? 'fyw-puff fyw-puff-first' : 'fyw-puff';
		const anim = `fywPuff ${8 + idx * 2.6}s ${(i0 + idx) * 2.4}s linear infinite`;
		return `<g class="${cls}" style="transform-origin:${n(sx)}px ${n(sy)}px;animation:${anim};opacity:0">${puff(0, -2, 2.6)}${puff(3.4, -4.4, 1.9)}${puff(-2.6, -5, 1.5)}</g>`;
	};
	return cluster(0) + cluster(1) + cluster(2);
}

function windows(P: Proj, plane: 'x' | 'y', fixed: number, from: number, to: number, zBase: number, storeys: number, litFrac: number, seed: string, glowAcc: string[]): string {
	const els: string[] = [];
	const rnd = seeded(seed);
	const sh = 0.6;
	const ww = 0.26;
	const step = 0.46;
	const m0 = 0.24;
	const len = to - from - m0 * 2;
	const cnt = Math.max(1, Math.floor(len / step));
	for (let s = 0; s < storeys; s++) {
		const z0 = zBase + 0.34 + s * sh;
		const z1 = z0 + 0.28;
		for (let i = 0; i < cnt; i++) {
			const a = from + m0 + i * step + (step - ww) / 2;
			const b = a + ww;
			const q: [number, number][] =
				plane === 'x' ? [P(fixed, a, z0), P(fixed, b, z0), P(fixed, b, z1), P(fixed, a, z1)] : [P(a, fixed, z0), P(b, fixed, z0), P(b, fixed, z1), P(a, fixed, z1)];
			const lit = rnd() < litFrac;
			if (lit) {
				const cx = (q[0][0] + q[2][0]) / 2;
				const cy = (q[0][1] + q[2][1]) / 2;
				glowAcc.push(windowGlow(cx, cy));
			}
			els.push(
				poly({
					points: q,
					fill: lit ? C.lit : C.winOff,
					stroke: lit ? 'none' : 'color-mix(in srgb, var(--ds-text) 30%, transparent)',
					width: 0.4,
					opacity: lit ? 0.95 : 0.9,
				}),
			);
		}
	}
	return els.join('');
}

/** Pennant count for a building's roof ridge — README "min(6, pr_merge_count)". */
export function pennantCount(prs: number): number {
	return Math.min(6, Math.max(0, prs));
}

function pennants(P: Proj, x0: number, y0: number, x1: number, y1: number, z: number, count: number): string {
	const els: string[] = [];
	const cnt = pennantCount(count);
	for (let i = 0; i < cnt; i++) {
		const t = cnt === 1 ? 0.5 : i / (cnt - 1);
		const px = x0 + (x1 - x0) * t;
		const py = y0 + (y1 - y0) * t;
		const base = P(px, py, z);
		const top = P(px, py, z + 0.42);
		els.push(line({ a: base, b: top, stroke: C.ink, width: 0.6 }));
		els.push(poly({ points: [top, [top[0] + 7.5, top[1] + 2.2], [top[0], top[1] + 4.6]], fill: C.accent, stroke: 'none', opacity: 0.95 }));
	}
	return els.join('');
}

export function ingotStack(P: Proj, x: number, y: number, rows: number[], glowTop: boolean): string {
	const els: string[] = [];
	const iw = 0.46;
	const id = 0.24;
	const ih = 0.15;
	const total = rows.reduce((a, b) => a + b, 0);
	let placed = 0;
	rows.forEach((cnt, layer) => {
		for (let i = 0; i < cnt; i++) {
			placed++;
			const gx = x + layer * 0.12;
			const gy = y + i * (id + 0.07) + layer * 0.11;
			const gz = layer * ih;
			const isTop = glowTop && placed === total;
			els.push(boxWalls(P, gx, gy, iw, id, ih, gz));
			els.push(
				poly({
					points: [P(gx, gy, gz + ih), P(gx + iw, gy, gz + ih), P(gx + iw, gy + id, gz + ih), P(gx, gy + id, gz + ih)],
					fill: isTop ? C.gold : C.paper,
					stroke: C.ink,
					width: HAIR,
					opacity: isTop ? 0.95 : 1,
				}),
			);
			if (isTop) {
				const c = P(gx + iw / 2, gy + id / 2, gz + ih);
				els.push(hotGlow(c[0], c[1]));
			}
		}
	});
	return els.join('');
}

export function rail(P: Proj, x0: number, x1: number, y: number): string {
	const els: string[] = [];
	for (let sx = x0; sx < x1; sx += 0.55) {
		els.push(line({ a: P(sx, y - 0.09, 0), b: P(sx, y + 0.35, 0), stroke: C.hairS, width: 0.7, opacity: 0.65 }));
	}
	els.push(line({ a: P(x0, y, 0), b: P(x1, y, 0), stroke: C.inkSoft, width: 0.9 }));
	els.push(line({ a: P(x0, y + 0.26, 0), b: P(x1, y + 0.26, 0), stroke: C.inkSoft, width: 0.9 }));
	els.push(line({ a: P(x1, y - 0.12, 0), b: P(x1, y + 0.38, 0), stroke: C.ink, width: 1.4 }));
	els.push(line({ a: P(x1 - 0.22, y + 0.13, 0.22), b: P(x1, y + 0.13, 0), stroke: C.ink, width: 0.9 }));
	return els.join('');
}

export function flatcar(P: Proj, x: number, y: number): string {
	const els: string[] = [];
	els.push(boxWalls(P, x, y - 0.12, 1.3, 0.5, 0.2, 0.12));
	els.push(poly({ points: [P(x, y - 0.12, 0.32), P(x + 1.3, y - 0.12, 0.32), P(x + 1.3, y + 0.38, 0.32), P(x, y + 0.38, 0.32)], fill: C.paper, stroke: C.ink, width: HAIR }));
	const w1 = P(x + 0.3, y + 0.38, 0.06);
	const w2 = P(x + 1.0, y + 0.38, 0.06);
	els.push(circle(w1[0], w1[1], 2.2, { fill: 'none', stroke: C.ink, width: 0.7 }));
	els.push(circle(w2[0], w2[1], 2.2, { fill: 'none', stroke: C.ink, width: 0.7 }));
	els.push(ingotStack(P, x + 0.18, y - 0.02, [2], true));
	return els.join('');
}

export function gantryCrane(P: Proj, x0: number, y0: number, x1: number, y1: number, h: number): string {
	const els: string[] = [];
	const leg = (lx: number, ly: number) => els.push(line({ a: P(lx, ly, 0), b: P(lx, ly, h), stroke: C.ink, width: 0.9 }));
	leg(x0, y0);
	leg(x0, y1);
	leg(x1, y0);
	leg(x1, y1);
	els.push(line({ a: P(x0, y0, 0), b: P(x0, y1, h * 0.55), stroke: C.hairS, width: 0.5 }));
	els.push(line({ a: P(x0, y1, 0), b: P(x0, y0, h * 0.55), stroke: C.hairS, width: 0.5 }));
	els.push(line({ a: P(x1, y0, 0), b: P(x1, y1, h * 0.55), stroke: C.hairS, width: 0.5 }));
	els.push(line({ a: P(x1, y1, 0), b: P(x1, y0, h * 0.55), stroke: C.hairS, width: 0.5 }));
	els.push(line({ a: P(x0, y0, h), b: P(x1, y0, h), stroke: C.ink, width: 1.2 }));
	els.push(line({ a: P(x0, y1, h), b: P(x1, y1, h), stroke: C.ink, width: 1.2 }));
	const xg = x0 + (x1 - x0) * 0.6;
	els.push(line({ a: P(xg, y0, h), b: P(xg, y1, h), stroke: C.inkStrong, width: 1.6 }));
	const ym = y0 + (y1 - y0) * 0.42;
	const tr = P(xg, ym, h);
	els.push(`<rect x="${n(tr[0] - 3)}" y="${n(tr[1] - 2.4)}" width="6" height="4.4" style="fill:${C.paper2};stroke:${C.ink}" stroke-width="0.7"/>`);
	els.push(line({ a: P(xg, ym, h - 0.06), b: P(xg, ym, 0.78), stroke: C.inkSoft, width: 0.6 }));
	const hk = P(xg, ym, 0.78);
	els.push(`<path d="M ${n(hk[0])} ${n(hk[1])} q 3 3 0 5 q -2.4 1.6 -3.4 -0.6" style="fill:none;stroke:${C.ink}" stroke-width="0.8"/>`);
	els.push(boxWalls(P, xg - 0.23, ym - 0.12, 0.46, 0.24, 0.15, 0.44));
	els.push(
		poly({
			points: [P(xg - 0.23, ym - 0.12, 0.59), P(xg + 0.23, ym - 0.12, 0.59), P(xg + 0.23, ym + 0.12, 0.59), P(xg - 0.23, ym + 0.12, 0.59)],
			fill: C.hot,
			stroke: C.ink,
			width: HAIR,
			opacity: 0.95,
		}),
	);
	els.push(line({ a: P(xg, ym, 0.78), b: P(xg - 0.2, ym - 0.1, 0.6), stroke: C.inkSoft, width: 0.45 }));
	els.push(line({ a: P(xg, ym, 0.78), b: P(xg + 0.2, ym + 0.1, 0.6), stroke: C.inkSoft, width: 0.45 }));
	return els.join('');
}

function vacantLot(P: Proj, x: number, y: number, w: number, d: number): string {
	const els: string[] = [];
	els.push(poly({ points: [P(x, y, 0), P(x + w, y, 0), P(x + w, y + d, 0), P(x, y + d, 0)], fill: 'none', stroke: C.inkSoft, width: 0.7, dash: '3 3' }));
	(
		[
			[x, y],
			[x + w, y],
			[x + w, y + d],
			[x, y + d],
		] as [number, number][]
	).forEach(([sx, sy]) => {
		const b = P(sx, sy, 0);
		const t = P(sx, sy, 0.3);
		els.push(line({ a: b, b: t, stroke: C.ink, width: 0.7 }));
		els.push(poly({ points: [t, [t[0] + 5, t[1] + 1.6], [t[0], t[1] + 3.4]], fill: C.accent, stroke: 'none', opacity: 0.8 }));
	});
	els.push(line({ a: P(x, y, 0), b: P(x + w, y + d, 0), stroke: C.hair, width: 0.5, dash: '2 3' }));
	els.push(line({ a: P(x + w, y, 0), b: P(x, y + d, 0), stroke: C.hair, width: 0.5, dash: '2 3' }));
	const bx = x + w * 0.32;
	const by = y + d + 0.001;
	els.push(line({ a: P(bx, by, 0), b: P(bx, by, 0.62), stroke: C.ink, width: 0.8 }));
	els.push(line({ a: P(bx + 0.55, by, 0), b: P(bx + 0.55, by, 0.62), stroke: C.ink, width: 0.8 }));
	els.push(poly({ points: [P(bx - 0.06, by, 0.3), P(bx + 0.61, by, 0.3), P(bx + 0.61, by, 0.62), P(bx - 0.06, by, 0.62)], fill: C.paper, stroke: C.ink, width: 0.8 }));
	const c = P(bx + 0.28, by, 0.47);
	els.push(line({ a: [c[0] - 6, c[1] - 1.5], b: [c[0] + 6, c[1] - 1.5], stroke: C.inkSoft, width: 0.7 }));
	els.push(line({ a: [c[0] - 6, c[1] + 1.5], b: [c[0] + 4, c[1] + 1.5], stroke: C.inkSoft, width: 0.7 }));
	return els.join('');
}

function furnaceMouth(P: Proj, plane: 'x' | 'y', fixed: number, from: number, z0: number): string {
	const w = 0.5;
	const h = 0.5;
	const q: [number, number][] =
		plane === 'x'
			? [P(fixed, from, z0), P(fixed, from + w, z0), P(fixed, from + w, z0 + h), P(fixed, from, z0 + h)]
			: [P(from, fixed, z0), P(from + w, fixed, z0), P(from + w, fixed, z0 + h), P(from, fixed, z0 + h)];
	const c: [number, number] = [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2];
	const els: string[] = [];
	els.push(furnaceGlow(c[0], c[1]));
	els.push(poly({ points: q, fill: C.gold, stroke: 'color-mix(in srgb, var(--ds-text) 35%, transparent)', width: 0.6, opacity: 0.95 }));
	const arch: [number, number][] =
		plane === 'x'
			? [P(fixed, from + 0.07, z0), P(fixed, from + w - 0.07, z0), P(fixed, from + w - 0.07, z0 + h - 0.1), P(fixed, from + 0.07, z0 + h - 0.1)]
			: [P(from + 0.07, fixed, z0), P(from + w - 0.07, fixed, z0), P(from + w - 0.07, fixed, z0 + h - 0.1), P(from + 0.07, fixed, z0 + h - 0.1)];
	els.push(poly({ points: arch, fill: 'none', stroke: 'color-mix(in srgb, var(--ds-text) 45%, transparent)', width: 0.5 }));
	return els.join('');
}

function numberPlate(P: Proj, x: number, y: number, rank: number): string {
	const c = P(x, y, 0);
	const label = String(rank).padStart(2, '0');
	return (
		circle(c[0], c[1], 7, { fill: C.paper, stroke: C.inkSoft, width: 0.8, className: 'fyw-np-circle' }) +
		text({ x: c[0], y: c[1] + 2.6, text: label, size: 7.2, fill: C.ink, weight: 600, anchor: 'middle', className: 'fyw-np-text' })
	);
}

export function districtLabel(P: Proj, plate: PlateSpec): string {
	const a = plate.screen ?? P(plate.lx ?? plate.x, plate.ly ?? plate.y, 0);
	if (plate.anchor === 'end') {
		return (
			line({ a: [a[0] - 14, a[1] + 4], b: [a[0], a[1] + 4], stroke: C.accent, width: 2 }) +
			text({ x: a[0] - 20, y: a[1] + 7, text: plate.label, size: 8.5, fill: C.inkSoft, ls: '0.16em', anchor: 'end' })
		);
	}
	return (
		line({ a: [a[0], a[1] + 4], b: [a[0] + 14, a[1] + 4], stroke: C.accent, width: 2 }) +
		text({ x: a[0] + 20, y: a[1] + 7, text: plate.label, size: 8.5, fill: C.inkSoft, ls: '0.16em' })
	);
}

export function titleBlock(x: number, y: number, meta: { sheetLabel: string; sheetNo: string; l1: string; l2: string; l3: string }): string {
	const w = 292;
	const h = 76;
	const els: string[] = [];
	els.push(`<rect x="${n(x)}" y="${n(y)}" width="${w}" height="${h}" style="fill:${C.paper};stroke:${C.hairS}" stroke-width="0.9"/>`);
	els.push(`<rect x="${n(x + 3)}" y="${n(y + 3)}" width="${w - 6}" height="${h - 6}" style="fill:none;stroke:${C.hair}" stroke-width="0.6"/>`);
	els.push(line({ a: [x + 3, y + 30], b: [x + w - 3, y + 30], stroke: C.hair, width: 0.6 }));
	els.push(line({ a: [x + w - 74, y + 3], b: [x + w - 74, y + 30], stroke: C.hair, width: 0.6 }));
	els.push(`<rect x="${n(x)}" y="${n(y)}" width="22" height="4" style="fill:${C.accent}"/>`);
	els.push(text({ x: x + 12, y: y + 22, text: 'The Works', size: 16.5, fill: C.inkStrong, font: C.serif, ls: '0.01em', weight: 400 }));
	els.push(text({ x: x + w - 66, y: y + 15, text: meta.sheetLabel, size: 7.5, fill: C.inkSoft }));
	els.push(text({ x: x + w - 66, y: y + 25, text: meta.sheetNo, size: 7.5, fill: C.inkSoft }));
	const textMaxWidth = w - 24;
	els.push(text({ x: x + 12, y: y + 43, text: meta.l1, size: 7.6, fill: C.inkSoft, maxWidth: textMaxWidth }));
	els.push(text({ x: x + 12, y: y + 55, text: meta.l2, size: 7.6, fill: C.inkFaint, maxWidth: textMaxWidth }));
	els.push(text({ x: x + 12, y: y + 67, text: meta.l3, size: 7.6, fill: C.inkFaint, maxWidth: textMaxWidth }));
	return els.join('');
}

export function northArrow(x: number, y: number): string {
	return (
		circle(x, y, 11, { fill: 'none', stroke: C.hairS, width: 0.8 }) +
		`<polygon points="${n(x)},${n(y - 8)} ${n(x + 3)},${n(y + 4)} ${n(x)},${n(y + 1.5)} ${n(x - 3)},${n(y + 4)}" style="fill:${C.ink}"/>` +
		text({ x, y: y + 22, text: 'N', size: 8, anchor: 'middle', fill: C.inkSoft })
	);
}

export function scaleBar(x: number, y: number, S: number): string {
	const u = S * 0.6;
	return (
		line({ a: [x, y], b: [x + u * 2, y], stroke: C.ink, width: 0.9 }) +
		line({ a: [x, y - 3.5], b: [x, y + 3.5], stroke: C.ink, width: 0.9 }) +
		line({ a: [x + u, y - 2.5], b: [x + u, y + 2.5], stroke: C.ink, width: 0.7 }) +
		line({ a: [x + u * 2, y - 3.5], b: [x + u * 2, y + 3.5], stroke: C.ink, width: 0.9 }) +
		`<rect x="${n(x)}" y="${n(y - 2)}" width="${n(u)}" height="4" style="fill:${C.ink};opacity:0.75"/>` +
		text({ x: x + u * 2 + 8, y: y + 3, text: '2 STOREYS', size: 7.5, fill: C.inkFaint })
	);
}

/** Repo name + lines/PRs caption drawn under a strip building — ported
 * from works-city.jsx's per-repo `furn` labels (strip variant only). */
export function stripBuildingLabel(P: Proj, b: StripLayoutEntry, r: WorksRepo): string {
	const a = P(b.x + b.w + 0.15, b.y + b.d + 0.15, 0);
	const prs = r.prs ?? 0;
	return (
		text({ x: a[0], y: a[1] + 12, text: r.repo, size: 9, fill: C.ink, weight: 600, anchor: 'middle', ls: '0.04em' }) +
		text({ x: a[0], y: a[1] + 23, text: `${fmtK(r.lines)} · ${prs} PR${prs === 1 ? '' : 'S'}`, size: 7.4, fill: C.inkFaint, anchor: 'middle' })
	);
}

/** Top-right "WEEK {id} · {range}" stamp on a strip. */
export function stripStamp(vw: number, label: string): string {
	return text({ x: vw - 10, y: 16, text: label, size: 7.5, fill: C.inkFaint, anchor: 'end', ls: '0.14em' });
}

/** Screen-reader/hover `<title>` text for one building — the v1 tooltip
 * fallback per README's Interactions section. */
export function buildingTitle(r: WorksRepo, storeys: number): string {
	if (storeys <= 0) return `${r.repo} — site cleared, groundbreaking soon`;
	const parts = [`${storeys} ${storeys === 1 ? 'storey' : 'storeys'}`, `${fmtK(r.sessions)} sessions`, `${fmtK(r.lines)} lines added`];
	if (r.tokens !== undefined) parts.push(`${fmtK(r.tokens)} tokens out`);
	if (r.prs !== undefined && r.prs > 0) parts.push(`${r.prs} PR${r.prs === 1 ? '' : 's'} merged`);
	const head = `${r.repo} — ${parts.join(' · ')}`;
	if (r.prTitles && r.prTitles.length > 0) {
		return `${head}\n${r.prTitles.slice(0, 2).join('\n')}`;
	}
	return head;
}

/** One building's full markup — walls, roof, windows, chimneys/smoke,
 * pennants, flag — wrapped in the hoverable/focusable group with its
 * accessible `<title>` and (yard only) number plate. */
export function buildingEls(
	P: Proj,
	b: YardLayoutEntry | StripLayoutEntry,
	r: WorksRepo,
	storeys: number,
	litFrac: number,
	hatchId: string,
	glassId: string,
	glowAcc: string[],
	rank?: number,
): string {
	if (b.arch === 'lot') {
		return `<g class="fyw-building"><title>${esc(buildingTitle(r, storeys))}</title>${vacantLot(P, b.x, b.y, b.w, b.d)}</g>`;
	}

	const base = 0.36;
	const h = storeys <= 0 ? 0 : base + storeys * 0.6 + 0.1;
	const isHall = b.arch === 'hall';
	const hasAnnex = 'annex' in b && b.annex === true;
	const hasFurnace = 'furnace' in b && b.furnace === true;
	const hasVent = 'vent' in b && b.vent === true;
	const hasFlag = 'flag' in b && b.flag === true;

	const els: string[] = [];
	els.push(shadowOf(P, b.x, b.y, b.w, b.d, h));
	els.push(boxWalls(P, b.x, b.y, b.w, b.d, h, 0, hatchId));

	if (!hasAnnex) {
		els.push(windows(P, 'x', b.x + b.w, b.y, b.y + b.d, 0, storeys, litFrac, r.repo + 'x', glowAcc));
	}
	if (b.d >= 1.4 || b.w >= 2.4) {
		const skipGround = isHall && storeys > 1;
		els.push(windows(P, 'y', b.y + b.d, b.x, b.x + b.w, skipGround ? 0.6 : 0, skipGround ? storeys - 1 : storeys, litFrac * 0.8, r.repo + 'y', glowAcc));
	}

	const rr = Math.max(0.35, Math.min(0.8, b.w * 0.24));
	// The ridge rise actually used for this archetype's roof, so pennants
	// (planted "along the roof ridge" — README) sit on the ridge they're
	// drawn against instead of a generic width-based estimate; gableX uses
	// a depth-based rise (see the gableRoof call below), everything else
	// already renders at rr.
	const roofRidge = b.arch === 'gableX' ? Math.min(0.5, b.d * 0.3) : rr;
	if (b.arch === 'hall' || b.arch === 'gableY') {
		els.push(gableRoof(P, b.x, b.y, b.w, b.d, h, rr, 'y', hatchId));
	} else if (b.arch === 'gableX') {
		els.push(gableRoof(P, b.x, b.y, b.w, b.d, h, roofRidge, 'x', hatchId));
	} else if (b.arch === 'monitor') {
		els.push(monitorRoof(P, b.x, b.y, b.w, b.d, h, hatchId));
	} else {
		els.push(flatTop(P, b.x, b.y, b.w, b.d, h));
	}

	if (hasFurnace) {
		if (hasAnnex) els.push(furnaceMouth(P, 'y', b.y + b.d, b.x + 0.55, 0.02));
		else els.push(furnaceMouth(P, 'x', b.x + b.w, b.y + b.d * 0.32, 0.02));
	}

	if (hasAnnex) {
		const ax = b.x + b.w + 0.001;
		const ay = b.y + 0.35;
		const aw = 2.7;
		const ad = 3.0;
		const ah = base + 1.9;
		els.push(shadowOf(P, ax, ay, aw, ad, ah));
		els.push(boxWalls(P, ax, ay, aw, ad, ah, 0, hatchId));
		els.push(windows(P, 'x', ax + aw, ay, ay + ad, 0, 2, litFrac, r.repo + 'ax', glowAcc));
		els.push(sawtoothRoof(P, ax, ay, aw, ad, ah, 0.55, 4, hatchId, glassId));
	}

	(b.stacks || []).forEach(([sx, sy], i) => {
		const hs = h + 1.5 + i * 0.35;
		els.push(chimney(P, sx, sy, hs, hatchId));
		if (r.active) els.push(smoke(P, sx + 0.17, sy + 0.17, hs + 0.35, i * 2));
	});

	if (hasVent && r.active) {
		const vx = b.x + b.w * 0.32;
		const vy = b.y + b.d * 0.4;
		const vh = h + rr + 0.42;
		els.push(line({ a: P(vx, vy, h - 0.1), b: P(vx, vy, vh), stroke: C.ink, width: 1.6 }));
		els.push(smoke(P, vx, vy, vh + 0.12, 1));
	}

	if ((r.prs ?? 0) > 0) {
		const xr = b.x + b.w / 2;
		els.push(pennants(P, xr, b.y + 0.2, xr, b.y + b.d - 0.2, h + roofRidge, r.prs ?? 0));
	}

	if (hasFlag) {
		const fx = b.x + b.w / 2;
		const fy = b.y + b.d / 2;
		const t = P(fx, fy, h + 1.1);
		els.push(line({ a: P(fx, fy, h + Math.min(0.5, b.d * 0.3)), b: t, stroke: C.ink, width: 0.7 }));
		els.push(poly({ points: [t, [t[0] + 9, t[1] + 2.6], [t[0], t[1] + 5.4]], fill: C.accent, stroke: 'none' }));
	}

	if (rank !== undefined && 'np' in b) {
		els.push(numberPlate(P, b.np[0], b.np[1], rank));
	}

	return `<g class="fyw-building"><title>${esc(buildingTitle(r, storeys))}</title>${els.join('')}</g>`;
}
