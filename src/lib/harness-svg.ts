// harness-svg.ts — "The Harness" figures (public API): Hall, Lifecycle,
// Tracker, Loop. Ported from design_handoff_harness/src/harness-hall.jsx's
// React.createElement-based generators as plain, dependency-free
// SVG-string builders — mirrors the works.ts + works-svg.ts split. Pure,
// build-time only (no window/document access). Geometry and label
// positions are collision-tuned against long captions in the original
// design file — verbatim port, do not re-layout. Switchyard is ported
// separately as a React island and is intentionally not included here.
import { box, C, Ci, g, ground, hatchDefs, leader, LINE, Ln, makeProj, Pa, pl, Po, shadowOf, smoke, Tx, windowsSE } from './harness-svg-primitives';
import type { Point } from './harness-svg-primitives';

const HALL_ARIA_LABEL =
	'Isometric engineering drawing of the harness as a machine hall: the ask enters, passes guard gates, a routing tower dispatches to three model furnaces, castings become commits, records feed lessons back.';
const LIFECYCLE_ARIA_LABEL = 'The session lifecycle as a conveyor: five hook events with their guard plates, classed hard, block-once, or passive.';
const TRACKER_ARIA_LABEL =
	'The dev-tracker: a cheap capture loop appends real items to TRACKER.md; the /fix resolve loop groups a wave, plans, waits for approval, runs TDD and review through the gates, verifies on device, archives; /tracker-learn mines repeat fixes.';
const LOOP_ARIA_LABEL =
	'The learning cycle: governed work writes session logs and memory, mined into instincts (observer currently paused), codified as skills, guards, and rules that govern the next session.';

/* ================= HALL — hero isometric machine hall ================= */
export function buildHall(motion: boolean): string {
	const P = makeProj(26, 318, 92);
	const H = 'hh-hatch';
	const els: string[] = [];

	// sheet furniture
	els.push(hatchDefs(H));
	els.push(
		g([
			`<rect x="10" y="10" width="1120" height="614" fill="none" style="stroke:${C.hair}" stroke-width="0.8"/>`,
			...(
				[
					[10, 10],
					[1130, 10],
					[10, 624],
					[1130, 624],
				] as Point[]
			).flatMap((c) => [
				Ln({ a: [c[0], c[1]], b: [c[0] + (c[0] < 500 ? 14 : -14), c[1]], s: C.hairS, w: 1 }),
				Ln({ a: [c[0], c[1]], b: [c[0], c[1] + (c[1] < 300 ? 14 : -14)], s: C.hairS, w: 1 }),
			]),
		]),
	);

	// ground slab
	els.push(g(ground(P, 0, 0, 27, 11)));

	// ---- conveyor belt spine (x 0.8→26.2 at y 4.2..5.4) ----
	const beltEls: string[] = [];
	beltEls.push(...box(P, 0.8, 4.2, 25.4, 1.2, 0.3, 0, null, C.paper2));
	for (let i = 0; i < 31; i++) beltEls.push(Ln({ a: P(1.2 + i * 0.82, 4.2, 0.3), b: P(1.2 + i * 0.82, 5.4, 0.3), s: C.hair, w: 0.5, o: 0.8 }));
	for (let i = 0; i < 6; i++) {
		const bx = 3.2 + i * 4.1;
		beltEls.push(Pa({ d: `M${P(bx, 4.55, 0.31)} L${P(bx + 0.45, 4.8, 0.31)} L${P(bx, 5.05, 0.31)}`, s: C.accent, w: 1.1, o: 0.85 }));
	}
	els.push(g(beltEls));

	// ---- 01 intake dock (front-left) ----
	const dock: string[] = [];
	dock.push(shadowOf(P, 1.2, 6.2, 2.4, 1.9, 0.5));
	dock.push(...box(P, 1.2, 6.2, 2.4, 1.9, 0.5, 0, H));
	dock.push(...box(P, 1.7, 6.6, 0.8, 0.6, 0.4, 0.5, null));
	dock.push(...box(P, 2.6, 6.9, 0.8, 0.6, 0.4, 0.5, null));
	dock.push(...box(P, 2.15, 6.75, 0.8, 0.6, 0.4, 0.9, null));
	// ramp to belt
	dock.push(Po({ p: pl([P(2.1, 6.2, 0.5), P(3.0, 6.2, 0.5), P(3.0, 5.4, 0.3), P(2.1, 5.4, 0.3)]), f: C.paper2, s: C.ink }));
	els.push(g(dock));

	// ---- 02 guard portal over belt at x≈5.4 ----
	const gate: string[] = [];
	gate.push(...box(P, 5.2, 3.7, 0.4, 0.4, 2.5, 0, null));
	gate.push(...box(P, 5.2, 5.5, 0.4, 0.4, 2.5, 0, null));
	gate.push(...box(P, 5.1, 3.55, 0.6, 2.5, 0.4, 2.5, H));
	// hanging plate
	gate.push(Po({ p: pl([P(5.4, 4.1, 2.1), P(5.4, 5.3, 2.1), P(5.4, 5.3, 1.65), P(5.4, 4.1, 1.65)]), f: C.plate, s: C.hairS }));
	gate.push(Ln({ a: P(5.4, 4.35, 2.5), b: P(5.4, 4.35, 2.1), s: C.ink, w: 0.5 }));
	gate.push(Ln({ a: P(5.4, 5.05, 2.5), b: P(5.4, 5.05, 2.1), s: C.ink, w: 0.5 }));
	els.push(g(gate));

	// ---- 03 control tower (routing) ----
	const tower: string[] = [];
	tower.push(shadowOf(P, 7.6, 1.3, 2, 2, 3.2));
	tower.push(...box(P, 7.6, 1.3, 2, 2, 3.2, 0, H));
	tower.push(...windowsSE(P, 7.6, 1.3, 2, 2, 3.2, 0, 3, 3, new Set([1, 3, 4, 7])));
	tower.push(...box(P, 7.75, 1.45, 1.7, 1.7, 0.22, 3.2, null));
	tower.push(Ln({ a: P(8.6, 2.3, 3.42), b: P(8.6, 2.3, 4.5), s: C.inkStrong, w: LINE }));
	tower.push(Ci({ c: P(8.6, 2.3, 4.5), r: 2.2, s: C.inkStrong, w: 0.8, f: 'none' }));
	// signal flag
	tower.push(Po({ p: pl([P(8.6, 2.3, 4.36), P(8.6, 2.3, 4.14), [P(8.6, 2.3, 4.25)[0] + 13, P(8.6, 2.3, 4.25)[1] + 3]]), f: C.accent, s: 'none', o: 0.9 }));
	// catwalk tower → belt
	tower.push(Po({ p: pl([P(8.3, 3.3, 1.4), P(9.0, 3.3, 1.4), P(9.0, 4.2, 1.4), P(8.3, 4.2, 1.4)]), f: 'none', s: C.ink, w: 0.6 }));
	tower.push(Ln({ a: P(8.3, 4.2, 1.4), b: P(8.3, 4.2, 0.3), s: C.ink, w: 0.55 }));
	tower.push(Ln({ a: P(9.0, 4.2, 1.4), b: P(9.0, 4.2, 0.3), s: C.ink, w: 0.55 }));
	els.push(g(tower));

	// ---- 04 furnaces (behind belt) ----
	const furn: string[] = [];
	// planner — tall, crowned
	furn.push(shadowOf(P, 11.4, 0.7, 2, 2, 4));
	furn.push(...box(P, 11.4, 0.7, 2, 2, 4, 0, H));
	furn.push(...windowsSE(P, 11.4, 0.7, 2, 2, 4, 0, 2, 4, new Set([0, 1, 3, 4, 6])));
	furn.push(...box(P, 11.85, 1.15, 1.1, 1.1, 0.5, 4, null));
	furn.push(...box(P, 12.9, 0.85, 0.5, 0.5, 1.3, 4, null));
	furn.push(...smoke(P, 13.15, 1.1, 5.35, motion, 0));
	// executor — wide
	furn.push(shadowOf(P, 14.6, 0.8, 2.4, 1.9, 2.9));
	furn.push(...box(P, 14.6, 0.8, 2.4, 1.9, 2.9, 0, H));
	furn.push(...windowsSE(P, 14.6, 0.8, 2.4, 1.9, 2.9, 0, 3, 3, new Set([0, 2, 4, 5, 7])));
	furn.push(...box(P, 16.35, 0.95, 0.5, 0.5, 1.0, 2.9, null));
	furn.push(...smoke(P, 16.6, 1.2, 3.95, motion, 0.9));
	// chore — small
	furn.push(shadowOf(P, 18.2, 1.05, 1.4, 1.5, 1.9));
	furn.push(...box(P, 18.2, 1.05, 1.4, 1.5, 1.9, 0, H));
	furn.push(...windowsSE(P, 18.2, 1.05, 1.4, 1.5, 1.9, 0, 2, 2, new Set([1, 2])));
	furn.push(...smoke(P, 19.35, 1.25, 1.95, motion, 1.8));
	// feed chutes furnace → belt
	(
		[
			[12.4, 2.7, 2.2],
			[15.8, 2.7, 1.8],
			[18.9, 2.55, 1.2],
		] as [number, number, number][]
	).forEach(([fx, fy, fz]) => {
		furn.push(Pa({ d: `M${P(fx, fy, fz)} L${P(fx, 4.35, 0.4)}`, s: C.ink, w: 0.8, dash: '1 3' }));
	});
	els.push(g(furn));

	// ---- 05 casting bay ----
	const cast: string[] = [];
	cast.push(shadowOf(P, 21, 3.4, 3, 2.6, 2.2));
	// open shed: two end frames + gable roof
	cast.push(...box(P, 21, 3.4, 0.28, 2.6, 2.0, 0, null));
	cast.push(...box(P, 23.72, 3.4, 0.28, 2.6, 2.0, 0, null));
	const ridgeZ = 2.75;
	cast.push(Po({ p: pl([P(21, 3.4, 2.0), P(24, 3.4, 2.0), P(24, 4.7, ridgeZ), P(21, 4.7, ridgeZ)]), f: C.paper, s: C.ink }));
	cast.push(Po({ p: pl([P(21, 6.0, 2.0), P(24, 6.0, 2.0), P(24, 4.7, ridgeZ), P(21, 4.7, ridgeZ)]), f: C.shade, s: C.ink }));
	cast.push(Po({ p: pl([P(21, 6.0, 2.0), P(24, 6.0, 2.0), P(24, 4.7, ridgeZ), P(21, 4.7, ridgeZ)]), f: `url(#${H})`, s: 'none' }));
	cast.push(Ln({ a: P(21, 4.7, ridgeZ), b: P(24, 4.7, ridgeZ), s: C.inkStrong, w: LINE }));
	// ingot molds on belt
	[21.5, 22.4, 23.3].forEach((mx, i) => {
		cast.push(...box(P, mx, 4.5, 0.62, 0.62, 0.3, 0.3, null, i === 1 ? C.gold : C.paper));
	});
	// pennant mast
	cast.push(Ln({ a: P(24.1, 3.3, 0), b: P(24.1, 3.3, 3.4), s: C.inkStrong, w: 0.9 }));
	const mp = P(24.1, 3.3, 3.4);
	const mp2 = P(24.1, 3.3, 3.05);
	cast.push(Po({ p: pl([mp, [mp[0] + 15, mp[1] + 4], [mp[0], mp[1] + 8]]), f: C.accent, s: 'none', o: 0.9 }));
	cast.push(Po({ p: pl([mp2, [mp2[0] + 13, mp2[1] + 3.5], [mp2[0], mp2[1] + 7]]), f: C.gold, s: 'none', o: 0.85 }));
	els.push(g(cast));

	// ---- 06 records shed (front-right) ----
	const rec: string[] = [];
	rec.push(shadowOf(P, 24.3, 6.6, 2, 1.7, 1.5));
	rec.push(...box(P, 24.3, 6.6, 2, 1.7, 1.5, 0, H));
	rec.push(...box(P, 24.5, 6.8, 0.9, 0.6, 0.5, 1.5, null, C.paper2));
	// spool / drum on top
	const dc0 = P(25.9, 7.3, 1.8);
	rec.push(Ci({ c: dc0, r: 5.5, s: C.inkStrong, w: 0.9, f: C.paper2 }));
	rec.push(Ci({ c: dc0, r: 2, s: C.ink, w: 0.6, f: 'none' }));
	els.push(g(rec));

	// belt → records chute
	els.push(g([Pa({ d: `M${P(24.9, 5.4, 0.3)} L${P(25.1, 6.6, 0.9)}`, s: C.ink, w: 0.8, dash: '1 3' })]));

	// ---- lessons return pipe (records → tower), dashed on ground ----
	const flowCls = motion ? 'fyh-flow' : undefined;
	els.push(
		g([Pa({ d: `M${P(24.6, 8.7, 0)} L${P(9.0, 8.7, 0)} L${P(9.0, 3.8, 0)}`, s: C.accent, w: 1.2, dash: '5 5', o: 0.8, cls: flowCls, marker: `url(#${H}-arr)` })]),
	);

	// ---- yard furniture ----
	const yard: string[] = [];
	yard.push(...box(P, 4.3, 7.6, 0.7, 0.7, 0.5, 0, null));
	yard.push(...box(P, 5.2, 7.9, 0.7, 0.7, 0.5, 0, null));
	for (let i = 0; i <= 12; i++) yard.push(Ln({ a: P(1 + i * 2.05, 10.4, 0), b: P(1 + i * 2.05, 10.4, 0.42), s: C.ink, w: 0.6, o: 0.75 }));
	for (let i = 0; i < 12; i++) yard.push(Ln({ a: P(1 + i * 2.05, 10.4, 0.34), b: P(1 + (i + 1) * 2.05, 10.4, 0.34), s: C.hairS, w: 0.5, o: 0.7 }));
	const bm = P(2.2, 9.5, 0);
	yard.push(Ln({ a: [bm[0] - 5, bm[1]], b: [bm[0] + 5, bm[1]], s: C.inkSoft, w: 0.7 }));
	yard.push(Ln({ a: [bm[0], bm[1] - 5], b: [bm[0], bm[1] + 5], s: C.inkSoft, w: 0.7 }));
	yard.push(Ci({ c: bm, r: 3.2, s: C.inkSoft, w: 0.6 }));
	els.push(g(yard));

	// ---- leader labels ----
	els.push(leader(P(2.4, 7, 1.1), [64, 486], ['01 · intake', 'the ask arrives']));
	els.push(leader(P(5.3, 3.8, 2.6), [128, 128], ['02 · guards', 'hooks deny the', 'catastrophic']));
	els.push(leader(P(8.6, 1.5, 3.6), [318, 66], ['03 · routing', 'mode · tier · effort']));
	els.push(leader(P(12.4, 0.8, 4.3), [568, 46], ['04 · furnaces — model tiers', 'planner · executor · chore', 'fable/opus · sonnet · haiku']));
	els.push(leader(P(23.9, 3.5, 2.9), [942, 96], ['05 · casting', 'commits · prs']));
	els.push(leader(P(26.2, 7.4, 1.4), [1044, 388], ['06 · records', 'session logs', 'memory']));
	els.push(leader(P(16.5, 8.7, 0), [560, 590], ['lessons return — skills · guards · rules']));

	// ---- title block ----
	els.push(
		g([
			`<rect x="24" y="552" width="316" height="62" fill="${C.paper}" style="stroke:${C.hairS}" stroke-width="0.8"/>`,
			Ln({ a: [24, 574], b: [340, 574], s: C.hair, w: 0.6 }),
			Ln({ a: [236, 574], b: [236, 614], s: C.hair, w: 0.6 }),
			Tx({ x: 34, y: 568, t: 'the harness — machine hall', size: 10.5, fill: C.inkStrong, w: 650 }),
			Tx({ x: 34, y: 590, t: 'governed engineering line', size: 8.5 }),
			Tx({ x: 34, y: 604, t: 'abhijit bansal · foundry', size: 8.5 }),
			Tx({ x: 246, y: 590, t: 'dwg fy-05a', size: 8.5, fill: C.accentH }),
			Tx({ x: 246, y: 604, t: '2026-07-13', size: 8.5 }),
		]),
	);

	// north arrow
	els.push(
		g([
			Ci({ c: [1092, 66], r: 14, s: C.hairS, w: 0.7 }),
			Pa({ d: 'M1092,76 L1092,56', s: C.inkStrong, w: 1, marker: `url(#${H}-arr)` }),
			Tx({ x: 1092, y: 96, t: 'n', size: 9, anchor: 'middle', fill: C.inkStrong }),
		]),
	);

	return `<svg viewBox="0 0 1140 634" role="img" aria-label="${HALL_ARIA_LABEL}" style="width:100%;height:auto;display:block">${els.join('')}</svg>`;
}

/* ================= LIFECYCLE — the conveyor of hook events ================= */
function hookChip(x: number, y: number, name: string, cls: string, note?: string): string {
	const col = cls === 'hard' ? C.danger : cls === 'once' ? C.warn : cls === 'paused' ? C.inkFaint : C.inkSoft;
	const textCol = cls === 'hard' ? C.danger : cls === 'once' ? C.warn : cls === 'paused' ? C.capFaint : C.capSoft;
	const marker =
		cls === 'hard'
			? `<rect x="${x + 6}" y="${y + 5.5}" width="6" height="6" fill="${col}"/>`
			: `<circle cx="${x + 9}" cy="${y + 8.5}" r="${cls === 'once' ? 3.4 : 2.6}" fill="${cls === 'once' ? col : 'none'}" stroke="${cls === 'once' ? 'none' : col}" stroke-width="1"/>`;
	return g([
		`<rect x="${x}" y="${y}" width="178" height="17" rx="2.5" fill="${C.paper}" style="stroke:${C.hair}" stroke-width="0.7"/>`,
		marker,
		Tx({ x: x + 18, y: y + 12, t: name, size: 8, fill: cls === 'paused' ? C.capFaint : C.inkStrong, w: 550, upper: false }),
		note ? Tx({ x: x + 172, y: y + 12, t: note, size: 7, fill: textCol, anchor: 'end' }) : '',
	]);
}

interface LifecycleStation {
	x: number;
	name: string;
	sub: string;
	barrier?: string;
	chips: [string, string, string?][];
}

export function buildLifecycle(): string {
	const A = 'lc-hatch';
	const els: string[] = [hatchDefs(A)];
	const BY = 268;

	// belt
	els.push(
		g([
			Ln({ a: [60, BY], b: [1080, BY], s: C.hairS, w: 1.2 }),
			Ln({ a: [60, BY + 10], b: [1080, BY + 10], s: C.hairS, w: 1.2 }),
			...Array.from({ length: 23 }, (_, i) => Ci({ c: [82 + i * 44, BY + 20], r: 4.5, s: C.ink, w: 0.7 })),
			...Array.from({ length: 6 }, (_, i) => Pa({ d: `M${150 + i * 160},${BY + 2.5} l7,2.5 l-7,2.5`, s: C.accent, w: 1, o: 0.9 })),
		]),
	);

	const stations: LifecycleStation[] = [
		{
			x: 130,
			name: 'SessionStart',
			sub: 'once, at open',
			chips: [['session auto-namer', 'inject'], ['ultracode directive', 'inject'], ['session-context inject', 'inject'], ['caveman · instincts', 'inject']],
		},
		{
			x: 330,
			name: 'UserPromptSubmit',
			sub: 'each turn',
			chips: [['caveman re-assert', 'inject'], ['instinct observer', 'paused', 'paused 07-12']],
		},
		{
			x: 545,
			name: 'PreToolUse',
			sub: 'the chokepoint',
			barrier: C.danger,
			chips: [
				['bash-guard', 'hard', 'deny'],
				['cartoon rewrite', 'inject', '−70%'],
				['guard-test-scope', 'hard', 'deny'],
				['guard-push-gate', 'once', 'remind'],
				['guard-generated (W|E)', 'hard', 'deny'],
			],
		},
		{
			x: 760,
			name: 'PostToolUse',
			sub: 'after each call',
			chips: [['format-file', 'inject', 'no-op']],
		},
		{
			x: 950,
			name: 'Stop',
			sub: 'end of turn',
			barrier: C.warn,
			chips: [['stop-log-guard', 'once', 'per tip'], ['/goal gate', 'hard', 'until met']],
		},
	];

	stations.forEach((st) => {
		const stEls: string[] = [];
		const topY = 196 - st.chips.length * 19;
		stEls.push(Ln({ a: [st.x, 214], b: [st.x, BY], s: C.ink, w: 0.9 }));
		stEls.push(Ci({ c: [st.x, BY - 4], r: 2.4, f: C.accent, s: 'none' }));
		stEls.push(Tx({ x: st.x, y: 206, t: st.name, size: 10, fill: C.inkStrong, w: 700, anchor: 'middle', upper: false }));
		stEls.push(Tx({ x: st.x, y: 217, t: st.sub, size: 7.5, fill: C.accentH, anchor: 'middle' }));
		st.chips.forEach((c, i) => stEls.push(hookChip(st.x - 89, topY + i * 19, c[0], c[1], c[2])));
		if (st.barrier) {
			stEls.push(Ln({ a: [st.x - 13, BY - 26], b: [st.x - 13, BY + 12], s: st.barrier, w: 1.6 }));
			stEls.push(Ln({ a: [st.x + 13, BY - 26], b: [st.x + 13, BY + 12], s: st.barrier, w: 1.6 }));
			stEls.push(Pa({ d: `M${st.x - 13},${BY - 26} L${st.x + 13},${BY - 26}`, s: st.barrier, w: 1.6 }));
			stEls.push(Pa({ d: `M${st.x - 13},${BY - 19} L${st.x + 13},${BY - 26} M${st.x - 13},${BY - 12} L${st.x + 13},${BY - 19}`, s: st.barrier, w: 0.8, o: 0.7 }));
		}
		els.push(g(stEls));
	});

	// tool loop between Pre and Post
	els.push(
		g([
			Pa({ d: `M575,${BY + 34} C 610,${BY + 62} 700,${BY + 62} 735,${BY + 34}`, s: C.ink, w: 0.9, marker: `url(#${A}-arr)` }),
			Tx({ x: 655, y: BY + 66, t: 'the tool runs', size: 8, anchor: 'middle' }),
			Pa({ d: `M735,232 C 700,206 610,206 575,230`, s: C.inkSoft, w: 0.8, dash: '3 4', marker: `url(#${A}-arr)` }),
			Tx({ x: 655, y: 200, t: 'next tool call', size: 8, fill: C.capFaint, anchor: 'middle' }),
		]),
	);

	// legend
	els.push(
		g([
			`<rect x="60" y="${BY + 84}" width="570" height="24" rx="3" fill="none" style="stroke:${C.hair}" stroke-width="0.7"/>`,
			`<rect x="74" y="${BY + 93}" width="6" height="6" fill="${C.danger}"/>`,
			Tx({ x: 86, y: BY + 100, t: 'hard — blocks every time', size: 8 }),
			Ci({ c: [248, BY + 96], r: 3.4, f: C.warn, s: 'none' }),
			Tx({ x: 258, y: BY + 100, t: 'block-once — reminds, then passes', size: 8 }),
			Ci({ c: [478, BY + 96], r: 2.6, s: C.inkSoft, w: 1 }),
			Tx({ x: 488, y: BY + 100, t: 'inject / passive', size: 8 }),
		]),
	);

	return `<svg viewBox="0 0 1140 392" role="img" aria-label="${LIFECYCLE_ARIA_LABEL}" style="width:100%;height:auto;display:block">${els.join('')}</svg>`;
}

/* ================= TRACKER — two loops with opposite cost profiles ================= */
interface PlateOpts {
	fill?: string;
	stroke?: string;
	sw?: number;
	lineFill?: string;
}

function trackerPlate(x: number, y: number, w: number, h: number, title: string, lines: string[], opts: PlateOpts = {}): string {
	return g([
		`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${opts.fill || C.paper}" style="stroke:${opts.stroke || C.hairS}" stroke-width="${opts.sw || 1}"/>`,
		Tx({ x: x + 12, y: y + 19, t: title, size: 9.5, fill: C.inkStrong, w: 650, upper: false }),
		...lines.map((l, i) => Tx({ x: x + 12, y: y + 34 + i * 12, t: l, size: 8, fill: opts.lineFill || C.capSoft, upper: false })),
	]);
}

export function buildTracker(): string {
	const A = 'tk-hatch';
	const els: string[] = [hatchDefs(A)];

	// capture loop (left)
	els.push(
		g([
			Tx({ x: 60, y: 52, t: 'capture loop — cheap, instant, chore-tier', size: 9.5, fill: C.accentH, w: 650 }),
			trackerPlate(60, 66, 150, 78, '/issue · /feature · /task', ['"found a bug on X"', '"we should build Y"', 'no research, no reads']),
			Pa({ d: 'M210,105 L266,105', s: C.accent, w: 1.4, marker: `url(#${A}-arr)` }),
			Tx({ x: 238, y: 96, t: 'seconds', size: 7.5, anchor: 'middle', fill: C.accentH }),
		]),
	);

	// the ledger (center-left) — drawn as a document sheet with real rows
	const LX = 268;
	const LY = 58;
	const LW = 300;
	const LH = 210;
	const ledger: string[] = [
		`<rect x="${LX + 5}" y="${LY + 5}" width="${LW}" height="${LH}" fill="var(--ds-text)" opacity="0.05"/>`,
		`<rect x="${LX}" y="${LY}" width="${LW}" height="${LH}" fill="${C.paper}" style="stroke:${C.hairS}" stroke-width="1"/>`,
		Ln({ a: [LX, LY + 30], b: [LX + LW, LY + 30], s: C.hair, w: 0.7 }),
		Tx({ x: LX + 14, y: LY + 20, t: 'docs/tracker/TRACKER.md', size: 9.5, fill: C.inkStrong, w: 650, upper: false }),
		Tx({ x: LX + LW - 14, y: LY + 20, t: 'the ledger', size: 8, fill: C.accentH, anchor: 'end' }),
	];
	const rows: [string, string, string, string][] = [
		['BUG-004', 'barcode overwrites name', 'open · med', C.danger],
		['BUG-005', 'favorite star unclear', 'open · low', C.danger],
		['FEAT-003', 'edit an item’s cover photo', 'open · med', C.accent],
		['FEAT-008', 'voice queries over labels', 'open · med', C.accent],
		['TASK-002', 'deploy CloudKit prod schema', 'open · crit', C.warn],
		['TASK-004', 'device checklist A–H', 'open · high', C.warn],
	];
	rows.forEach((r, i) => {
		const ry = LY + 46 + i * 24;
		ledger.push(Ci({ c: [LX + 20, ry - 3], r: 2.4, f: r[3], s: 'none', o: 0.9 }));
		ledger.push(Tx({ x: LX + 30, y: ry, t: r[0], size: 8, fill: C.inkStrong, w: 650 }));
		ledger.push(Tx({ x: LX + 88, y: ry, t: r[1], size: 7.5, fill: C.capSoft, upper: false }));
		ledger.push(Tx({ x: LX + LW - 12, y: ry, t: r[2], size: 7, fill: C.capFaint, anchor: 'end' }));
		ledger.push(Ln({ a: [LX + 12, ry + 8], b: [LX + LW - 12, ry + 8], s: C.hair, w: 0.5, o: 0.7 }));
	});
	ledger.push(Tx({ x: LX + 14, y: LY + LH - 8, t: '27 open on this branch · s32–s33 · 2026-07-13', size: 7.5, fill: C.capFaint }));
	els.push(g(ledger));

	// /backlog tap
	els.push(
		g([
			Pa({ d: `M${LX + 150},${LY + LH} L${LX + 150},${LY + LH + 26}`, s: C.inkSoft, w: 0.9, dash: '3 3', marker: `url(#${A}-arr)` }),
			trackerPlate(LX + 92, LY + LH + 28, 116, 34, '/backlog', ['grouped, filtered view']),
		]),
	);

	// resolve loop (right)
	const RX = 640;
	els.push(
		g([
			Tx({ x: RX, y: 52, t: 'resolve loop — full ceremony, AGENTS.md throughout', size: 9.5, fill: C.accentH, w: 650 }),
			Pa({ d: `M${LX + LW},105 L${RX - 14},105`, s: C.accent, w: 1.4, marker: `url(#${A}-arr)` }),
			Tx({ x: (LX + LW + RX) / 2, y: 96, t: '/fix BUG-004', size: 8, anchor: 'middle', fill: C.accentH, w: 650 }),
			trackerPlate(RX, 66, 128, 66, '1 · group a wave', ['cluster by screen/area', 'recommend /goal first']),
			trackerPlate(RX + 148, 66, 128, 66, '2 · plan, then WAIT', ['writing-plans · planner', 'status → planned'], { stroke: C.warn, lineFill: C.capSoft }),
			trackerPlate(RX + 296, 66, 128, 66, '3 · TDD + review', ['failing test first', 'swift-reviewer per phase']),
			trackerPlate(RX, 172, 128, 66, '4 · gates + ship', ['compile · tests · review', 'push · docs: checkpoint']),
			trackerPlate(RX + 148, 172, 128, 66, '5 · device-verify', ['checklist on real device', 'status → verified']),
			trackerPlate(RX + 296, 172, 128, 66, '6 · archive', ['archive/2026-07.md', 'screenshots swept']),
			Pa({ d: `M${RX + 128},99 L${RX + 146},99`, s: C.ink, w: 1, marker: `url(#${A}-arr)` }),
			Pa({ d: `M${RX + 276},99 L${RX + 294},99`, s: C.ink, w: 1, marker: `url(#${A}-arr)` }),
			Pa({ d: `M${RX + 360},132 C ${RX + 360},152 ${RX + 128},148 ${RX + 66},170`, s: C.ink, w: 1, marker: `url(#${A}-arr)` }),
			Pa({ d: `M${RX + 128},205 L${RX + 146},205`, s: C.ink, w: 1, marker: `url(#${A}-arr)` }),
			Pa({ d: `M${RX + 276},205 L${RX + 294},205`, s: C.ink, w: 1, marker: `url(#${A}-arr)` }),
			Tx({ x: RX + 212, y: 148, t: '⏸ user approval', size: 8, fill: C.warn, anchor: 'middle' }),
		]),
	);

	// learn tap (bottom right)
	els.push(
		g([
			Pa({ d: `M${RX + 360},238 L${RX + 360},268 L${RX + 220},268 L${RX + 220},282`, s: C.inkSoft, w: 0.9, dash: '3 3', marker: `url(#${A}-arr)` }),
			Pa({ d: `M${LX + 240},${LY + LH} C ${LX + 280},330 ${RX - 40},324 ${RX + 118},296`, s: C.inkSoft, w: 0.9, dash: '3 3', o: 0.8 }),
			trackerPlate(RX + 130, 284, 180, 52, '/tracker-learn', ['attempts ≥ 2 → patterns report', 'suggest-only — drafts nothing'], { stroke: C.hairS }),
			Tx({ x: RX + 130, y: 352, t: 'repeat fixes feed skills · AGENTS.md amendments · hooks', size: 7.5, fill: C.capFaint, upper: false }),
		]),
	);

	return `<svg viewBox="0 0 1140 366" role="img" aria-label="${TRACKER_ARIA_LABEL}" style="width:100%;height:auto;display:block">${els.join('')}</svg>`;
}

/* ================= LOOP — the learning cycle ================= */
function loopNode(x: number, y: number, w: number, title: string, lines: string[], stamp: string | null): string {
	const stampEl = stamp
		? g(
				[
					`<rect x="${x + w / 2 - 62}" y="${y - 32}" width="84" height="18" rx="2" fill="none" style="stroke:${C.warn}" stroke-width="1.1"/>`,
					Tx({ x: x + w / 2 - 20, y: y - 19, t: stamp, size: 7.5, fill: C.warn, w: 700, anchor: 'middle' }),
				],
				{ transform: `rotate(-8 ${x + w / 2 - 20} ${y - 22})` },
			)
		: '';
	return g([
		`<rect x="${x - w / 2}" y="${y - 26}" width="${w}" height="56" rx="4" fill="${C.paper}" style="stroke:${C.hairS}" stroke-width="1"/>`,
		Tx({ x, y: y - 8, t: title, size: 9.5, fill: C.inkStrong, w: 650, anchor: 'middle', upper: false }),
		...lines.map((l, i) => Tx({ x, y: y + 6 + i * 11, t: l, size: 7.5, fill: C.capSoft, anchor: 'middle', upper: false })),
		stampEl,
	]);
}

function loopArc(cx: number, cy: number, rx: number, ry: number, hatchId: string, a0: number, a1: number): string {
	const p0: Point = [cx + Math.cos(a0) * rx, cy + Math.sin(a0) * ry];
	const p1: Point = [cx + Math.cos(a1) * rx, cy + Math.sin(a1) * ry];
	const mid: Point = [(p0[0] + p1[0]) / 2 + Math.cos((a0 + a1) / 2) * 40, (p0[1] + p1[1]) / 2 + Math.sin((a0 + a1) / 2) * 26];
	return Pa({ d: `M${p0[0]},${p0[1]} Q${mid[0]},${mid[1]} ${p1[0]},${p1[1]}`, s: C.accent, w: 1.2, dash: '4 5', o: 0.75, marker: `url(#${hatchId}-arr)` });
}

export function buildLoop(): string {
	const A = 'lp-hatch';
	const els: string[] = [hatchDefs(A)];
	const cx = 450;
	const cy = 196;
	const rx = 330;
	const ry = 128;

	els.push(loopArc(cx, cy, rx, ry, A, -Math.PI / 2 + 0.35, -0.35));
	els.push(loopArc(cx, cy, rx, ry, A, 0.35, Math.PI / 2 - 0.35));
	els.push(loopArc(cx, cy, rx, ry, A, Math.PI / 2 + 0.35, Math.PI - 0.35));
	els.push(loopArc(cx, cy, rx, ry, A, Math.PI + 0.35, (3 * Math.PI) / 2 - 0.35));

	els.push(loopNode(cx, cy - ry - 24, 240, 'governed work', ['workflow + tiers + adversarial verify'], null));
	els.push(loopNode(cx + rx + 10, cy, 220, 'session logs + memory', ['resume pointers · decisions', 'one fact per file'], null));
	els.push(loopNode(cx, cy + ry + 30, 260, 'instincts', ['272 banked · 0 byte-dupes', 'curation still open'], 'observer paused'));
	els.push(loopNode(cx - rx - 10, cy, 220, 'skills · guards · rules', ['ios-dev mined lessons', 'AGENTS.md amendments'], null));
	els.push(Tx({ x: cx, y: cy - 4, t: 'every lesson becomes machinery', size: 10, fill: C.inkStrong, w: 650, anchor: 'middle', upper: false }));
	els.push(Tx({ x: cx, y: cy + 12, t: 'the next session starts smarter than the last', size: 8.5, fill: C.capSoft, anchor: 'middle', upper: false }));

	return `<svg viewBox="0 0 900 400" role="img" aria-label="${LOOP_ARIA_LABEL}" style="width:100%;height:auto;display:block;max-width:900px;margin:0 auto">${els.join('')}</svg>`;
}
