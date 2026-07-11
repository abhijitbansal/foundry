import { describe, it, expect } from 'vitest';
import {
	formatCompact,
	heatBucket,
	heatBucketColor,
	last30DaysCells,
	modelDisplayName,
	modelMixSegments,
	topToolBars,
	memekitTerminal,
	windowSum,
	peakDay,
	lookupCount,
	formatDateRange,
	daysBetweenInclusive,
	heaviestDaysLabel,
	heatmapAriaLabel,
} from '../../src/lib/telemetry';

describe('formatCompact', () => {
	it.each([
		[292504, '292,504'],
		[76683120, '76.7M'],
		[11156632042, '11.2B'],
		[2796, '2,796'],
	])('formats %i as %s', (input, expected) => {
		expect(formatCompact(input)).toBe(expected);
	});
});

describe('heatBucket', () => {
	it.each([
		[undefined, 'quiet'],
		[0, 'quiet'],
		[1, 'low'],
		[1_499_999, 'low'],
		[1_500_000, 'mid'],
		[4_499_999, 'mid'],
		[4_500_000, 'high'],
		[7_499_999, 'high'],
		[7_500_000, 'peak'],
	] as const)('buckets %s as %s', (input, expected) => {
		expect(heatBucket(input)).toBe(expected);
	});
});

describe('heatBucketColor', () => {
	it('returns a distinct color expression for every bucket', () => {
		const buckets = ['quiet', 'low', 'mid', 'high', 'peak'] as const;
		const colors = buckets.map(heatBucketColor);
		expect(new Set(colors).size).toBe(buckets.length);
	});
});

describe('last30DaysCells', () => {
	it('produces exactly 30 entries ending on the given date', () => {
		const cells = last30DaysCells({}, '2026-07-06');
		expect(cells).toHaveLength(30);
		expect(cells[0].date).toBe('2026-06-07');
		expect(cells[29].date).toBe('2026-07-06');
	});

	it('marks a missing date as tokens: undefined', () => {
		const cells = last30DaysCells({ '2026-07-06': 1234 }, '2026-07-06');
		const missing = cells.find((c) => c.date === '2026-07-05');
		const present = cells.find((c) => c.date === '2026-07-06');
		expect(missing?.tokens).toBeUndefined();
		expect(present?.tokens).toBe(1234);
	});

	it('reproduces the 2A source snapshot heat buckets from the real daily series', () => {
		const daily: Record<string, number> = {
			'2026-06-07': 417761,
			'2026-06-10': 4093395,
			'2026-06-28': 10351443,
			'2026-06-30': 5438909,
		};
		const cells = last30DaysCells(daily, '2026-07-06');
		const byDate = Object.fromEntries(cells.map((c) => [c.date, c]));
		expect(heatBucket(byDate['2026-06-07'].tokens)).toBe('low');
		expect(heatBucket(byDate['2026-06-10'].tokens)).toBe('mid');
		expect(heatBucket(byDate['2026-06-28'].tokens)).toBe('peak');
		expect(heatBucket(byDate['2026-06-30'].tokens)).toBe('high');
		expect(heatBucket(byDate['2026-06-08'].tokens)).toBe('quiet');
	});
});

describe('modelDisplayName', () => {
	it.each([
		['claude-opus-4-8', 'Opus 4.8'],
		['claude-sonnet-5', 'Sonnet 5'],
		['claude-fable-5', 'Fable 5'],
		['claude-haiku-4-5-20251001', 'Haiku 4.5'],
		['claude-sonnet-4-6', 'Sonnet 4.6'],
		['claude-opus-4-7', 'Opus 4.7'],
	])('formats %s as %s', (input, expected) => {
		expect(modelDisplayName(input)).toBe(expected);
	});
});

describe('modelMixSegments', () => {
	const models: Array<[string, number]> = [
		['claude-opus-4-8', 40872],
		['claude-sonnet-5', 17088],
		['claude-fable-5', 12249],
		['claude-haiku-4-5-20251001', 8085],
		['claude-sonnet-4-6', 6880],
		['claude-opus-4-7', 6795],
		['<synthetic>', 75],
	];

	it('excludes non-model bookkeeping entries and caps at 6 segments', () => {
		const segments = modelMixSegments(models, 92044);
		expect(segments).toHaveLength(6);
		expect(segments.every((s) => s.label !== '<synthetic>')).toBe(true);
	});

	it('assigns the six design colors in accent/secondary/tertiary/success/warning/text-faint order', () => {
		const segments = modelMixSegments(models, 92044);
		expect(segments.map((s) => s.colorVar)).toEqual([
			'var(--ds-accent)',
			'var(--ds-secondary)',
			'var(--ds-tertiary)',
			'var(--ds-success)',
			'var(--ds-warning)',
			'var(--ds-text-faint)',
		]);
	});

	it('rounds each segment to the nearest whole percent of total assistant messages', () => {
		const segments = modelMixSegments(models, 92044);
		expect(segments[0]).toMatchObject({ label: 'Opus 4.8', percent: 44 });
		expect(segments[1]).toMatchObject({ label: 'Sonnet 5', percent: 19 });
	});
});

describe('topToolBars', () => {
	const topTools: Array<[string, number]> = [
		['Bash', 19359],
		['Read', 14348],
		['Edit', 4933],
		['Write', 1979],
		['StructuredOutput', 1806],
		['Grep', 622],
	];

	it('takes the top 5 tools with the max tool pinned at 100%', () => {
		const bars = topToolBars(topTools);
		expect(bars).toHaveLength(5);
		expect(bars[0]).toMatchObject({ label: 'Bash', percent: 100 });
	});

	it('rounds bar-fill percent to the nearest whole percent', () => {
		const bars = topToolBars(topTools);
		expect(bars.find((b) => b.label === 'Read')?.percent).toBe(74);
		expect(bars.find((b) => b.label === 'Edit')?.percent).toBe(25);
	});
});

describe('memekitTerminal', () => {
	it('produces the exact dot-padded, comma-formatted lines from the 2A source', () => {
		const lines = memekitTerminal(95229194, 76683120, 11156632042);
		expect(lines).toEqual([
			'in ........... 95,229,194',
			'out .......... 76,683,120',
			'cache read ... 11,156,632,042',
		]);
	});
});

describe('lookupCount', () => {
	it('returns the matching count and 0 for an unknown name', () => {
		const entries: Array<[string, number]> = [
			['Agent', 603],
			['Skill', 146],
		];
		expect(lookupCount(entries, 'Agent')).toBe(603);
		expect(lookupCount(entries, 'Skill')).toBe(146);
		expect(lookupCount(entries, 'Nope')).toBe(0);
	});
});

describe('formatDateRange / daysBetweenInclusive', () => {
	it('formats the kicker date range and inclusive day count from the 2A source snapshot', () => {
		expect(formatDateRange('2026-05-22', '2026-07-06')).toBe('May 22 – Jul 6, 2026');
		expect(daysBetweenInclusive('2026-05-22', '2026-07-06')).toBe(46);
	});
});

describe('windowSum / peakDay against the real committed daily series', () => {
	// Sourced from data/stats.json — the same snapshot the 2A source was
	// hand-authored from, trimmed to the fields these tests touch.
	const dailySessions: Record<string, number> = {
		'2026-06-07': 11,
		'2026-06-10': 125,
		'2026-06-11': 157,
		'2026-06-12': 85,
		'2026-06-13': 12,
		'2026-06-14': 11,
		'2026-06-15': 47,
		'2026-06-20': 197,
		'2026-06-28': 345,
		'2026-06-29': 466,
		'2026-06-30': 202,
		'2026-07-01': 235,
		'2026-07-02': 142,
		'2026-07-03': 180,
		'2026-07-04': 277,
		'2026-07-05': 190,
		'2026-07-06': 49,
	};
	const dailyLines: Record<string, number> = {
		'2026-06-07': 1393,
		'2026-06-10': 38425,
		'2026-06-11': 31209,
		'2026-06-12': 25157,
		'2026-06-13': 2560,
		'2026-06-14': 86,
		'2026-06-15': 2570,
		'2026-06-20': 5344,
		'2026-06-28': 41377,
		'2026-06-29': 29614,
		'2026-06-30': 15681,
		'2026-07-01': 15595,
		'2026-07-02': 13074,
		'2026-07-03': 19388,
		'2026-07-04': 15539,
		'2026-07-05': 17176,
		'2026-07-06': 1183,
	};
	const dailyOutTokens: Record<string, number> = {
		'2026-06-07': 417761,
		'2026-06-10': 4093395,
		'2026-06-11': 3926555,
		'2026-06-12': 4115874,
		'2026-06-13': 592829,
		'2026-06-14': 98266,
		'2026-06-15': 1675034,
		'2026-06-20': 1501042,
		'2026-06-28': 10351443,
		'2026-06-29': 8985317,
		'2026-06-30': 5438909,
		'2026-07-01': 5796685,
		'2026-07-02': 2687146,
		'2026-07-03': 6064600,
		'2026-07-04': 8767944,
		'2026-07-05': 7902175,
		'2026-07-06': 1359486,
	};

	it('reproduces the 2A source "Last 30 days" summary tile exactly', () => {
		expect(windowSum(dailySessions, '2026-07-06')).toBe(2731);
		expect(windowSum(dailyLines, '2026-07-06')).toBe(275371);
		expect(formatCompact(windowSum(dailyOutTokens, '2026-07-06'))).toBe('73.8M');
	});

	it('reproduces the 2A source peak-day caption exactly', () => {
		expect(peakDay(dailySessions, '2026-07-06')).toMatchObject({ date: '2026-06-29', label: 'Jun 29', value: 466 });
	});

	it('reproduces the 2A source heatmap aria-label exactly', () => {
		const cells = last30DaysCells(dailyOutTokens, '2026-07-06');
		expect(heaviestDaysLabel(cells)).toBe('June 28 and 29, July 4 and 5');
		expect(heatmapAriaLabel(cells)).toBe(
			'Activity heatmap, June 7 to July 6. Heaviest days: June 28 and 29, July 4 and 5.',
		);
	});
});
