// works-layout.ts — hand-tuned layout tables, copied verbatim from
// design_handoff_works/works-city.jsx (YARD, YARD_PLATES, STRIP). Keyed by
// repo name; a new repo needs a slot added here or it's skipped by
// coverage checks in works.ts. Do not hand-tune coordinates — regenerate
// from the design source if the yard plan itself changes.

import type { PlateSpec, StripLayoutEntry, YardLayoutEntry } from './works.types';

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

export const STRIP: Record<string, StripLayoutEntry> = {
	cubby: { x: 0.6, y: 0.45, w: 3.3, d: 2.0, arch: 'hall', stacks: [[0.25, 0.9], [0.25, 1.75]], furnace: true },
	'claude-skills': { x: 4.8, y: 0.7, w: 1.9, d: 1.55, arch: 'monitor', stacks: [[4.5, 0.95]] },
	sift: { x: 7.5, y: 0.8, w: 1.7, d: 1.4, arch: 'gableY', stacks: [], vent: true },
	'doc-scan': { x: 9.9, y: 0.85, w: 1.6, d: 1.3, arch: 'gableY', stacks: [], vent: true },
	floorprint: { x: 12.1, y: 0.8, w: 1.8, d: 1.35, arch: 'monitor', stacks: [], vent: true },
	cartoon: { x: 14.6, y: 0.9, w: 1.5, d: 1.2, arch: 'shed', stacks: [], vent: true },
};
