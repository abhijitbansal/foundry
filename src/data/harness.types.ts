// Harness page v2 delta data shape — plan docs/plans/2026-07-18-harness-page-v2.md Task 1.1.
// Refreshed by hand from cubby docs/harness + AGENTS.md; no runtime fetch (site is static output).

export const DELTA_BADGES = ['NEW', 'RULE', 'APPLIED', 'RETIRED', 'CLOSED', 'CHANGED', 'NOTE'] as const;
export type DeltaBadge = (typeof DELTA_BADGES)[number];

export interface DeltaItem {
	badge: DeltaBadge;
	wave: 's56' | 's57' | 's45→s56';
	title: string;
	body: string;
	ref?: string;
}

export interface HarnessScalars {
	score: number;
	scorePrev: number;
	scoreAsOf: string;
	agentsKb: string;
	agentsLines: number;
	plugins: number;
	skills: number;
	agents: number;
	hooks: number;
	skillsInstalled: string;
	deltaWaveDate: string;
}
