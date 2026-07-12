// works.types.ts — shapes for "The Works" isometric yard-plan generator.
// Mirrors the fields works-city.jsx (design_handoff_works/works-city.jsx)
// reads off each repo/layout entry, ported to Astro's build-time-only
// pipeline (src/lib/works.ts).

export type WorksVariant = 'yard' | 'strip';

export type Archetype = 'hall' | 'monitor' | 'gableY' | 'gableX' | 'shed' | 'lot';

/** One repo's activity, already projected from data/stats.json or a
 * data/weekly/<week>.json entry — see buildYardRepo/buildStripRepo call
 * sites in Telemetry.astro/updates.astro. */
export interface WorksRepo {
	repo: string;
	lines: number;
	sessions: number;
	/** out_tokens (yard only). Weekly strips have no per-repo token count —
	 * litFrac falls back to sessions per README's data contract. */
	tokens?: number;
	/** Smoke/vent puffs render only when true. */
	active: boolean;
	/** PRs merged this week (strip only) — pennant count = min(6, prs). */
	prs?: number;
	/** Up to 2 shown in the building's tooltip; null for private repos
	 * (count-only, per data/weekly/<week>.json's release contract). */
	prTitles?: string[] | null;
}

export interface YardLayoutEntry {
	x: number;
	y: number;
	w: number;
	d: number;
	arch: Archetype;
	plate: number;
	np: [number, number];
	stacks: [number, number][];
	furnace?: boolean;
	annex?: boolean;
	flag?: boolean;
}

export interface StripLayoutEntry {
	x: number;
	y: number;
	w: number;
	d: number;
	arch: Archetype;
	stacks: [number, number][];
	furnace?: boolean;
	vent?: boolean;
}

export interface PlateSpec {
	x: number;
	y: number;
	w: number;
	d: number;
	label: string;
	lx?: number;
	ly?: number;
	screen?: [number, number];
	anchor?: 'start' | 'end';
}

export interface WorksResult {
	svg: string;
	ariaLabel: string;
}

export interface LedgerEntry {
	rank: number;
	repo: string;
	storeys: number;
	sessions: number;
	lines: number;
	tokens: number;
}
