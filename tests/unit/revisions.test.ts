import { describe, it, expect } from 'vitest';
import { revisionRows } from '../../src/lib/revisions';
import type { WeeklyDigest } from '../../src/lib/weekly.types';

const week = (id: string, start: string, end: string, repos: [string, number, number][]): WeeklyDigest =>
	({ week_id: id, week_start: start, week_end: end, generated_at: '', heatmap: {} as never, releases: {}, highlights: null, repos: repos.map(([repo, sessions, lines_added]) => ({ repo, sessions, lines_added, lines_removed: 0, top_tool: '', top_model: '' })) }) as WeeklyDigest;

describe('revisionRows', () => {
	const weeks = [
		week('2026-W40', '2026-09-28', '2026-10-04', [['cubby', 142, 12706], ['doc-scan', 37, 4302]]),
		week('2026-W39', '2026-09-21', '2026-09-27', [['doc-scan', 32, 1446]]),
	];

	it('summarises each week newest first, with its lead repo', () => {
		expect(revisionRows(weeks)).toEqual([
			{ rev: 'W40', week: 'Sep 28 – Oct 4, 2026', lines: 17008, sessions: 179, lead: 'cubby', isLatest: true },
			{ rev: 'W39', week: 'Sep 21 – Sep 27, 2026', lines: 1446, sessions: 32, lead: 'doc-scan', isLatest: false },
		]);
	});

	it('honours the limit', () => {
		expect(revisionRows(weeks, 1)).toHaveLength(1);
	});

	it('returns nothing (not a throw) when there are no digests yet', () => {
		expect(revisionRows([])).toEqual([]);
	});

	it('reports no lead for a week with no repo activity', () => {
		expect(revisionRows([week('2026-W41', '2026-10-05', '2026-10-11', [])])[0].lead).toBeNull();
	});
});
