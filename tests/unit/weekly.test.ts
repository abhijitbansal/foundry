import { describe, it, expect } from 'vitest';
import {
	formatWeekRange,
	sortWeeksDesc,
	heatmapCellPercent,
	heatmapCellColor,
	maxHeatmapValue,
	busiestRepo,
	totalWeeklyLines,
	totalWeeklySessions,
} from '../../src/lib/weekly';
import type { WeeklyDigest, WeeklyRepoStats } from '../../src/lib/weekly.types';

describe('formatWeekRange', () => {
	it('formats a same-month range', () => {
		expect(formatWeekRange('2026-06-29', '2026-07-05')).toBe('Jun 29 – Jul 5, 2026');
	});
});

describe('sortWeeksDesc', () => {
	it('orders newest week first via string comparison', () => {
		const weeks = [{ week_id: '2026-W25' }, { week_id: '2026-W27' }, { week_id: '2026-W26' }] as WeeklyDigest[];
		expect(sortWeeksDesc(weeks).map((w) => w.week_id)).toEqual(['2026-W27', '2026-W26', '2026-W25']);
	});

	it('does not mutate the input array', () => {
		const weeks = [{ week_id: '2026-W25' }, { week_id: '2026-W27' }] as WeeklyDigest[];
		sortWeeksDesc(weeks);
		expect(weeks.map((w) => w.week_id)).toEqual(['2026-W25', '2026-W27']);
	});
});

describe('heatmapCellPercent', () => {
	it('returns 0 for an all-quiet grid (max=0)', () => {
		expect(heatmapCellPercent(0, 0)).toBe(0);
	});

	it('returns 0 for a zero-value cell in an active grid', () => {
		expect(heatmapCellPercent(0, 1000)).toBe(0);
	});

	it('returns 100 for the max cell', () => {
		expect(heatmapCellPercent(1000, 1000)).toBe(100);
	});

	it('returns a proportional percent for a mid-value cell', () => {
		expect(heatmapCellPercent(500, 1000)).toBe(50);
	});
});

describe('heatmapCellColor', () => {
	it('returns the flat surface color at 0%', () => {
		expect(heatmapCellColor(0)).toBe('var(--ds-surface-2)');
	});

	it('returns a color-mix expression for a positive percent', () => {
		expect(heatmapCellColor(50)).toBe('color-mix(in srgb, var(--ds-accent) 50%, var(--ds-surface-2))');
	});
});

describe('maxHeatmapValue', () => {
	it('finds the max message count across a 2D grid', () => {
		const cells = [
			[{ count: 10 }, { count: 5 }],
			[{ count: 20 }, { count: 3 }],
		];
		expect(maxHeatmapValue(cells)).toBe(20);
	});

	it('returns 0 for an all-empty grid', () => {
		const cells = [[{ count: 0 }, { count: 0 }]];
		expect(maxHeatmapValue(cells)).toBe(0);
	});
});

describe('busiestRepo', () => {
	const repos: WeeklyRepoStats[] = [
		{ repo: 'a', sessions: 1, lines_added: 100, lines_removed: 0, top_tool: 'Bash', top_model: 'x' },
		{ repo: 'b', sessions: 1, lines_added: 500, lines_removed: 0, top_tool: 'Bash', top_model: 'x' },
	];

	it('returns the repo with the most lines_added', () => {
		expect(busiestRepo(repos)?.repo).toBe('b');
	});

	it('returns undefined for an empty week', () => {
		expect(busiestRepo([])).toBeUndefined();
	});
});

describe('totalWeeklyLines / totalWeeklySessions', () => {
	const repos: WeeklyRepoStats[] = [
		{ repo: 'a', sessions: 3, lines_added: 100, lines_removed: 0, top_tool: 'Bash', top_model: 'x' },
		{ repo: 'b', sessions: 5, lines_added: 500, lines_removed: 0, top_tool: 'Bash', top_model: 'x' },
	];

	it('sums lines_added across repos', () => {
		expect(totalWeeklyLines(repos)).toBe(600);
	});

	it('sums sessions across repos', () => {
		expect(totalWeeklySessions(repos)).toBe(8);
	});
});
