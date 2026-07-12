// works-layout.ts — hand-tuned layout tables, copied verbatim from
// design_handoff_works/works-city.jsx (YARD, YARD_PLATES). Keyed by repo
// name; a new repo needs a slot added here or it's skipped by coverage
// checks in works.ts. Do not hand-tune coordinates — regenerate from the
// design source if the yard plan itself changes.
//
// The weekly STRIP is different: which repos are active, and how many,
// changes every week, so its positions can't be a hand-tuned per-repo
// table like YARD — layoutStripGrid() below places whatever repos that
// week has into a wrapping multi-row grid. STRIP_ARCHETYPES keeps each
// repo's visual identity (footprint, archetype, chimneys) recognizable
// week to week; DEFAULT_STRIP_ARCHETYPE covers any repo without a
// hand-tuned entry so a new repo still renders instead of vanishing.

import type { PlateSpec, StripArchetype, StripLayoutEntry, YardLayoutEntry } from './works.types';

export const YARD: Record<string, YardLayoutEntry> = {
	cubby: { x: 0.9, y: 0.7, w: 2.9, d: 4.6, arch: 'hall', plate: 0, np: [4.4, 5.8], stacks: [[0.35, 1.7], [0.35, 3.2]], furnace: true, annex: true },
	'claude-skills': { x: 15.3, y: 1.0, w: 2.3, d: 1.9, arch: 'monitor', plate: 1, np: [18.2, 3.4], stacks: [[14.9, 1.35]] },
	floorprint: { x: 5.2, y: 4.9, w: 3.1, d: 1.7, arch: 'monitor', plate: 0, np: [8.8, 7.0], stacks: [] },
	sift: { x: 18.7, y: 1.1, w: 2.0, d: 1.5, arch: 'gableY', plate: 1, np: [21.2, 3.0], stacks: [] },
	cartoon: { x: 15.5, y: 3.9, w: 1.7, d: 1.3, arch: 'gableY', plate: 1, np: [17.6, 5.6], stacks: [[15.2, 4.15]] },
	'doc-scan': { x: 8.9, y: 5.0, w: 1.9, d: 1.4, arch: 'gableY', plate: 0, np: [11.2, 6.8], stacks: [] },
	foundry: { x: 5.9, y: 9.1, w: 2.0, d: 1.5, arch: 'gableX', plate: 2, np: [8.3, 11.0], stacks: [], flag: true },
	memekit: { x: 18.5, y: 3.8, w: 1.4, d: 1.1, arch: 'shed', plate: 1, np: [20.3, 5.3], stacks: [] },
	'design-system': { x: 9.0, y: 9.2, w: 1.5, d: 1.2, arch: 'shed', plate: 2, np: [10.9, 10.8], stacks: [] },
	folix: { x: 11.3, y: 4.9, w: 2.1, d: 1.6, arch: 'lot', plate: 0, np: [13.8, 6.9], stacks: [] },
};

export const YARD_PLATES: PlateSpec[] = [
	{ x: 0, y: 0, w: 14, d: 7.2, label: '01 · APPS', lx: 0.1, ly: 7.5 },
	{ x: 14.7, y: 0.4, w: 8.1, d: 5.6, label: '02 · AGENT TOOLING', screen: [858, 415] },
	{ x: 5.4, y: 8.6, w: 6.0, d: 2.6, label: '03 · WEB & SITES', lx: 5.6, ly: 10.9, anchor: 'end' },
];

export const STRIP_ARCHETYPES: Record<string, StripArchetype> = {
	cubby: { w: 3.3, d: 2.0, arch: 'hall', stacksRel: [[-0.35, 0.45], [-0.35, 1.3]], furnace: true },
	'claude-skills': { w: 1.9, d: 1.55, arch: 'monitor', stacksRel: [[-0.3, 0.25]] },
	sift: { w: 1.7, d: 1.4, arch: 'gableY', stacksRel: [], vent: true },
	'doc-scan': { w: 1.6, d: 1.3, arch: 'gableY', stacksRel: [], vent: true },
	floorprint: { w: 1.8, d: 1.35, arch: 'monitor', stacksRel: [], vent: true },
	cartoon: { w: 1.5, d: 1.2, arch: 'shed', stacksRel: [], vent: true },
	foundry: { w: 1.6, d: 1.3, arch: 'gableX', stacksRel: [], vent: true },
	memekit: { w: 1.4, d: 1.1, arch: 'shed', stacksRel: [] },
	'design-system': { w: 1.5, d: 1.2, arch: 'shed', stacksRel: [] },
};

const DEFAULT_STRIP_ARCHETYPE: StripArchetype = { w: 1.6, d: 1.3, arch: 'shed', stacksRel: [], vent: true };

const STRIP_GRID_COLS = 3;
const STRIP_GRID_X0 = 0.6;
const STRIP_GRID_Y0 = 0.45;
const STRIP_GRID_CELL_W = 4.6;
// Deep enough that a row of buildings never visually collides with the
// row above — cubby (the largest archetype, always row 0) is nearly 2x
// STRIP_MAX_STOREYS tall with twin chimneys, so this needs much more
// clearance than the footprint depth (d) alone would suggest once the
// isometric projection's height contribution is accounted for.
export const STRIP_GRID_CELL_D = 5.4;

/** Places a week's active repos (already ordered, e.g. by lines added
 * descending) into a wrapping `STRIP_GRID_COLS`-column grid rather than
 * one long single-row line — reads as a proper yard, not a vanishing
 * point, once a week has more than 3-4 active repos. Every repo gets an
 * entry: known ones keep their hand-tuned archetype, anything else falls
 * back to DEFAULT_STRIP_ARCHETYPE. */
export function layoutStripGrid(repoNames: string[]): Record<string, StripLayoutEntry> {
	const out: Record<string, StripLayoutEntry> = {};
	repoNames.forEach((repo, i) => {
		const archetype = STRIP_ARCHETYPES[repo] ?? DEFAULT_STRIP_ARCHETYPE;
		const col = i % STRIP_GRID_COLS;
		const row = Math.floor(i / STRIP_GRID_COLS);
		const x = STRIP_GRID_X0 + col * STRIP_GRID_CELL_W;
		const y = STRIP_GRID_Y0 + row * STRIP_GRID_CELL_D;
		out[repo] = {
			x,
			y,
			w: archetype.w,
			d: archetype.d,
			arch: archetype.arch,
			stacks: archetype.stacksRel.map(([dx, dy]) => [x + dx, y + dy]),
			furnace: archetype.furnace,
			vent: archetype.vent,
		};
	});
	return out;
}

/** Ground-plate footprint for a grid of `count` repos at
 * `STRIP_GRID_COLS` columns — wide enough for the last column, deep
 * enough for every row. */
export function stripGridFootprint(count: number): { w: number; d: number; rows: number } {
	const rows = Math.max(1, Math.ceil(count / STRIP_GRID_COLS));
	const cols = Math.min(count, STRIP_GRID_COLS);
	return {
		w: STRIP_GRID_X0 + cols * STRIP_GRID_CELL_W,
		d: STRIP_GRID_Y0 + (rows - 1) * STRIP_GRID_CELL_D + 2.6,
		rows,
	};
}
