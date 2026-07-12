import { describe, it, expect } from 'vitest';
import { assertYardCoverage, buildLedger, buildStrip, buildYard, computeLitFracs, computeStoreys, fmtK, pennantCount, seeded } from '../../src/lib/works';
import { layoutStripGrid, stripGridFootprint } from '../../src/lib/works-layout';
import type { WorksRepo } from '../../src/lib/works.types';

const YARD_REPOS: WorksRepo[] = [
	{ repo: 'cubby', lines: 116975, sessions: 1396, tokens: 48016419, active: true },
	{ repo: 'claude-skills', lines: 49569, sessions: 551, tokens: 11698838, active: true },
	{ repo: 'floorprint', lines: 32064, sessions: 266, tokens: 8220815, active: true },
	{ repo: 'cartoon', lines: 15617, sessions: 62, tokens: 2896138, active: true },
	{ repo: 'sift', lines: 12182, sessions: 137, tokens: 3316581, active: true },
	{ repo: 'memekit', lines: 9855, sessions: 37, tokens: 794654, active: false },
	{ repo: 'foundry', lines: 7338, sessions: 103, tokens: 2427996, active: true },
	{ repo: 'doc-scan', lines: 6042, sessions: 93, tokens: 2782177, active: true },
	{ repo: 'design-system', lines: 3129, sessions: 16, tokens: 586810, active: false },
	{ repo: 'folix', lines: 0, sessions: 2, tokens: 3019, active: false },
];

describe('computeStoreys', () => {
	it('gives the max-score repo the full maxStoreys', () => {
		const storeys = computeStoreys(YARD_REPOS, 8);
		expect(storeys.cubby).toBe(8);
	});

	it('maps zero (or negative) lines to 0 — a vacant lot', () => {
		const storeys = computeStoreys(YARD_REPOS, 8);
		expect(storeys.folix).toBe(0);
	});

	it('never returns less than 1 storey for a repo with positive lines', () => {
		const storeys = computeStoreys([...YARD_REPOS, { repo: 'tiny', lines: 1, sessions: 1, active: false }], 8);
		expect(storeys.tiny).toBeGreaterThanOrEqual(1);
	});

	it('is monotonic with score — more lines never yields fewer storeys', () => {
		const storeys = computeStoreys(YARD_REPOS, 8);
		const sorted = [...YARD_REPOS].sort((a, b) => b.lines - a.lines);
		for (let i = 1; i < sorted.length; i++) {
			expect(storeys[sorted[i - 1].repo]).toBeGreaterThanOrEqual(storeys[sorted[i].repo]);
		}
	});
});

describe('computeLitFracs', () => {
	it('never returns below the 0.12 floor', () => {
		const fracs = computeLitFracs(YARD_REPOS);
		for (const repo of Object.keys(fracs)) expect(fracs[repo]).toBeGreaterThanOrEqual(0.12);
	});

	it('never exceeds 1 for the max-metric repo', () => {
		const fracs = computeLitFracs(YARD_REPOS);
		expect(fracs.cubby).toBeLessThanOrEqual(1);
		expect(fracs.cubby).toBeCloseTo(1, 5);
	});

	it('falls back to sessions when tokens is absent (weekly strips)', () => {
		const repos: WorksRepo[] = [
			{ repo: 'a', lines: 10, sessions: 100, active: true },
			{ repo: 'b', lines: 10, sessions: 25, active: true },
		];
		const fracs = computeLitFracs(repos);
		expect(fracs.a).toBeCloseTo(1, 5);
		expect(fracs.b).toBeCloseTo(0.5, 5);
	});
});

describe('seeded', () => {
	it('produces the same sequence for the same seed string', () => {
		const a = seeded('cubbyx');
		const b = seeded('cubbyx');
		const seqA = [a(), a(), a()];
		const seqB = [b(), b(), b()];
		expect(seqA).toEqual(seqB);
	});

	it('produces a different sequence for a different seed string', () => {
		const a = seeded('cubbyx');
		const b = seeded('cubbyy');
		expect(a()).not.toBe(b());
	});
});

describe('pennantCount', () => {
	it('caps at 6 regardless of how many PRs merged', () => {
		expect(pennantCount(11)).toBe(6);
	});

	it('passes through counts at or under the cap', () => {
		expect(pennantCount(3)).toBe(3);
		expect(pennantCount(0)).toBe(0);
	});

	it('floors negative input at 0', () => {
		expect(pennantCount(-2)).toBe(0);
	});
});

describe('assertYardCoverage', () => {
	it('does not throw when every repo has a YARD slot', () => {
		expect(() => assertYardCoverage(YARD_REPOS)).not.toThrow();
	});

	it('throws loudly when a repo has no YARD slot', () => {
		const repos: WorksRepo[] = [...YARD_REPOS, { repo: 'brand-new-repo', lines: 500, sessions: 5, active: true }];
		expect(() => assertYardCoverage(repos)).toThrow(/brand-new-repo/);
	});
});

describe('buildLedger', () => {
	it('ranks repos by lines added, descending', () => {
		const ledger = buildLedger(YARD_REPOS);
		expect(ledger[0].repo).toBe('cubby');
		expect(ledger[0].rank).toBe(1);
		expect(ledger[ledger.length - 1].repo).toBe('folix');
	});

	it('carries storeys, sessions, lines, tokens for each entry', () => {
		const ledger = buildLedger(YARD_REPOS);
		const cubby = ledger.find((e) => e.repo === 'cubby')!;
		expect(cubby.storeys).toBe(8);
		expect(cubby.sessions).toBe(1396);
		expect(cubby.lines).toBe(116975);
		expect(cubby.tokens).toBe(48016419);
	});
});

describe('buildYard', () => {
	it('renders an accessible inline SVG with a title per building', () => {
		const { svg, ariaLabel } = buildYard(YARD_REPOS, { metaLine: 'Test survey line' });
		expect(svg).toContain('role="img"');
		expect(svg).toContain(ariaLabel);
		expect(svg).toContain('<title>cubby');
		expect(svg).toContain('<title>folix');
	});

	it('throws when a repo in the input has no YARD slot', () => {
		const repos: WorksRepo[] = [...YARD_REPOS, { repo: 'brand-new-repo', lines: 500, sessions: 5, active: true }];
		expect(() => buildYard(repos, { metaLine: 'x' })).toThrow(/brand-new-repo/);
	});
});

describe('buildStrip', () => {
	const WEEK_REPOS: WorksRepo[] = [
		{ repo: 'cubby', lines: 75306, sessions: 1028, active: true, prs: 8 },
		{ repo: 'claude-skills', lines: 13839, sessions: 201, active: true, prs: 2 },
		{ repo: 'sift', lines: 5826, sessions: 61, active: true, prs: 0 },
		// no hand-tuned STRIP_ARCHETYPES entry — must still render via the
		// default archetype, not vanish
		{ repo: 'brand-new-repo', lines: 200, sessions: 5, active: true, prs: 0 },
	];

	it('renders every repo, including one with no hand-tuned archetype', () => {
		const { svg } = buildStrip(WEEK_REPOS, { stamp: 'WEEK 2026-W27', instanceId: '2026-w27' });
		expect(svg).toContain('<title>cubby');
		expect(svg).toContain('<title>claude-skills');
		expect(svg).toContain('<title>brand-new-repo');
	});

	it('caps pennants at 6 even when more PRs merged', () => {
		const repos: WorksRepo[] = [{ repo: 'cubby', lines: 1000, sessions: 10, active: true, prs: 20 }];
		const { svg } = buildStrip(repos, { stamp: 'WEEK X', instanceId: 'cap-test' });
		const pennantFlags = svg.match(/fill:var\(--ds-accent\);stroke:none;opacity:0\.95/g);
		expect(pennantFlags?.length).toBe(6);
	});

	it('does not throw for a single-repo week', () => {
		expect(() => buildStrip([{ repo: 'cubby', lines: 10, sessions: 5, active: true }], { stamp: 'x', instanceId: 'y' })).not.toThrow();
	});
});

describe('layoutStripGrid', () => {
	it('wraps into a new row after STRIP_GRID_COLS (3) repos', () => {
		const names = ['cubby', 'claude-skills', 'sift', 'doc-scan', 'floorprint'];
		const layout = layoutStripGrid(names);
		// first 3 share the top row's y
		expect(layout['claude-skills'].y).toBe(layout.cubby.y);
		expect(layout.sift.y).toBe(layout.cubby.y);
		// the 4th wraps to a new row and resets to the first column's x
		expect(layout['doc-scan'].y).toBeGreaterThan(layout.cubby.y);
		expect(layout['doc-scan'].x).toBe(layout.cubby.x);
	});

	it('gives an unknown repo the default archetype instead of omitting it', () => {
		const layout = layoutStripGrid(['brand-new-repo']);
		expect(layout['brand-new-repo']).toBeDefined();
		expect(layout['brand-new-repo'].w).toBeGreaterThan(0);
	});

	it('places chimneys relative to the building as it moves between rows', () => {
		const rowsOf4 = layoutStripGrid(['a', 'b', 'c', 'cubby']);
		const rowsOf1 = layoutStripGrid(['cubby']);
		// cubby's chimney offset from its own origin is identical regardless
		// of which grid cell it landed in
		const offsetIn4 = [rowsOf4.cubby.stacks[0][0] - rowsOf4.cubby.x, rowsOf4.cubby.stacks[0][1] - rowsOf4.cubby.y];
		const offsetIn1 = [rowsOf1.cubby.stacks[0][0] - rowsOf1.cubby.x, rowsOf1.cubby.stacks[0][1] - rowsOf1.cubby.y];
		expect(offsetIn4[0]).toBeCloseTo(offsetIn1[0], 10);
		expect(offsetIn4[1]).toBeCloseTo(offsetIn1[1], 10);
	});
});

describe('stripGridFootprint', () => {
	it('reports 1 row for up to 3 repos', () => {
		expect(stripGridFootprint(3).rows).toBe(1);
	});

	it('reports 2 rows for 4-6 repos', () => {
		expect(stripGridFootprint(4).rows).toBe(2);
		expect(stripGridFootprint(6).rows).toBe(2);
	});

	it('reports 3 rows for 7 repos', () => {
		expect(stripGridFootprint(7).rows).toBe(3);
	});
});

describe('fmtK', () => {
	it('formats sub-10k thousands with one decimal', () => {
		expect(fmtK(5500)).toBe('5.5k');
	});

	it('formats ten-thousands+ as a rounded integer k', () => {
		expect(fmtK(116975)).toBe('117k');
	});

	it('leaves small numbers as-is', () => {
		expect(fmtK(42)).toBe('42');
	});
});
