// telemetry.ts — plan Task 5.1. Pure functions that turn data/stats.json
// into the numbers/colors the Telemetry section renders. No DOM, no
// fetch — everything here runs at build time in Astro frontmatter and is
// unit-tested directly.

import type { HeatBucket, HeatmapCell, ModelMixSegment, NameCountTuple, ToolBar } from './telemetry.types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * 292504 -> "292,504"; 76683120 -> "76.7M"; 11156632042 -> "11.2B"
 */
export function formatCompact(n: number): string {
	if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	return n.toLocaleString('en-US');
}

// thresholds per README §03: >0, >=1.5M, >=4.5M, >=7.5M — 'peak' is gold
// (--ds-secondary), 'high' is full accent.
export function heatBucket(outTokens: number | undefined): HeatBucket {
	if (outTokens === undefined || outTokens <= 0) return 'quiet';
	if (outTokens < 1_500_000) return 'low';
	if (outTokens < 4_500_000) return 'mid';
	if (outTokens < 7_500_000) return 'high';
	return 'peak';
}

export function heatBucketColor(bucket: HeatBucket): string {
	switch (bucket) {
		case 'quiet':
			return 'var(--ds-surface-2)';
		case 'low':
			return 'color-mix(in srgb, var(--ds-accent) 28%, var(--ds-surface-2))';
		case 'mid':
			return 'color-mix(in srgb, var(--ds-accent) 55%, var(--ds-surface-2))';
		case 'high':
			return 'var(--ds-accent)';
		case 'peak':
			return 'var(--ds-secondary)';
	}
}

function parseISODateUTC(iso: string): Date {
	const [y, m, d] = iso.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d));
}

function toISODateUTC(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function formatCellLabel(date: Date): string {
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/**
 * The main page's telemetry window is anchored here, not on a trailing
 * 30-day window: the requirement is "always everything from May 1st 2026
 * onwards".
 */
export const TELEMETRY_START_ISO = '2026-05-01';

/**
 * Builds the oldest-first, 7-row grid the heatmap consumes, one cell per
 * day from startDateISO through endDateISO inclusive. Missing dates (no
 * activity that day) => tokens: undefined ("quiet").
 */
export function dateRangeCells(
	dailyOutTokens: Record<string, number>,
	startDateISO: string,
	endDateISO: string,
): HeatmapCell[] {
	const start = parseISODateUTC(startDateISO);
	const end = parseISODateUTC(endDateISO);
	const cells: HeatmapCell[] = [];
	for (let t = start.getTime(); t <= end.getTime(); t += MS_PER_DAY) {
		const date = new Date(t);
		const iso = toISODateUTC(date);
		cells.push({
			date: iso,
			label: formatCellLabel(date),
			tokens: dailyOutTokens[iso],
		});
	}
	return cells;
}

/** The trailing-30-day variant of dateRangeCells. */
export function last30DaysCells(dailyOutTokens: Record<string, number>, endDateISO: string): HeatmapCell[] {
	const end = parseISODateUTC(endDateISO);
	const start = toISODateUTC(new Date(end.getTime() - 29 * MS_PER_DAY));
	return dateRangeCells(dailyOutTokens, start, endDateISO);
}

// Display order/colors mirror the 2A source's six model-mix segments
// exactly: accent, secondary, tertiary, success, warning, text-faint.
const MODEL_MIX_COLORS = [
	'var(--ds-accent)',
	'var(--ds-secondary)',
	'var(--ds-tertiary)',
	'var(--ds-success)',
	'var(--ds-warning)',
	'var(--ds-text-faint)',
];

// Converts a raw model id (e.g. "claude-opus-4-8", "claude-haiku-4-5-20251001")
// into the short display label the design uses ("Opus 4.8", "Haiku 4.5").
// Drops any date-suffix segment (an 8-digit numeric token).
export function modelDisplayName(id: string): string {
	const parts = id.replace(/^claude-/, '').split('-');
	const [family, ...rest] = parts;
	const version = rest.filter((p) => !/^\d{8}$/.test(p)).join('.');
	const label = family.charAt(0).toUpperCase() + family.slice(1);
	return version ? `${label} ${version}` : label;
}

/**
 * Top 6 real models (excludes non-model bookkeeping entries like
 * "<synthetic>") by message count, with a percent of totalAssistantMsgs
 * rounded to the nearest whole percent.
 */
export function modelMixSegments(models: NameCountTuple[], totalAssistantMsgs: number): ModelMixSegment[] {
	const realModels = models.filter(([id]) => id.startsWith('claude-'));
	const top6 = [...realModels].sort((a, b) => b[1] - a[1]).slice(0, 6);
	return top6.map(([id, count], i) => ({
		label: modelDisplayName(id),
		percent: Math.round((count / totalAssistantMsgs) * 100),
		colorVar: MODEL_MIX_COLORS[i],
	}));
}

/**
 * Top N tools by count, with a bar-fill percent relative to the highest
 * count (so the top tool is always 100%), rounded to the nearest whole
 * percent.
 */
export function topToolBars(topTools: NameCountTuple[], limit = 5): ToolBar[] {
	const sorted = [...topTools].sort((a, b) => b[1] - a[1]).slice(0, limit);
	const max = sorted[0]?.[1] ?? 0;
	return sorted.map(([label, count]) => ({
		label,
		count,
		percent: max > 0 ? Math.round((count / max) * 100) : 0,
	}));
}

/**
 * Sum of a sparse date->value series over the inclusive [startDateISO,
 * endDateISO] range. Missing dates count as 0. ISO dates compare
 * correctly as strings, so no Date math is needed.
 */
export function rangeSum(dailyValues: Record<string, number>, startDateISO: string, endDateISO: string): number {
	let total = 0;
	for (const [iso, value] of Object.entries(dailyValues)) {
		if (iso >= startDateISO && iso <= endDateISO) total += value;
	}
	return total;
}

/**
 * Sum of a sparse date->value series over the trailing `windowDays` days
 * ending at endDateISO (inclusive). Missing dates count as 0.
 */
export function windowSum(dailyValues: Record<string, number>, endDateISO: string, windowDays = 30): number {
	const end = parseISODateUTC(endDateISO);
	const start = toISODateUTC(new Date(end.getTime() - (windowDays - 1) * MS_PER_DAY));
	return rangeSum(dailyValues, start, endDateISO);
}

/**
 * The single highest-value day in the inclusive [startDateISO, endDateISO]
 * range — e.g. "Peak: Jun 29 — 466 sessions in one day".
 */
export function peakDayInRange(
	dailyValues: Record<string, number>,
	startDateISO: string,
	endDateISO: string,
): { date: string; label: string; value: number } | undefined {
	let best: { date: string; label: string; value: number } | undefined;
	for (const [iso, value] of Object.entries(dailyValues)) {
		if (iso < startDateISO || iso > endDateISO) continue;
		if (!best || value > best.value) {
			best = { date: iso, label: formatCellLabel(parseISODateUTC(iso)), value };
		}
	}
	return best;
}

/**
 * The single highest-value day in the trailing `windowDays` days ending at
 * endDateISO.
 */
export function peakDay(
	dailyValues: Record<string, number>,
	endDateISO: string,
	windowDays = 30,
): { date: string; label: string; value: number } | undefined {
	const end = parseISODateUTC(endDateISO);
	const start = toISODateUTC(new Date(end.getTime() - (windowDays - 1) * MS_PER_DAY));
	return peakDayInRange(dailyValues, start, endDateISO);
}

/** Looks up a [name, count] tuple's count by name; 0 if not found. */
export function lookupCount(entries: NameCountTuple[], name: string): number {
	return entries.find(([n]) => n === name)?.[1] ?? 0;
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
];

function formatShortDate(iso: string): string {
	const d = parseISODateUTC(iso);
	return `${MONTH_ABBR[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** "2026-05-22" + "2026-07-06" -> "May 22 – Jul 6, 2026" */
export function formatDateRange(startISO: string, endISO: string): string {
	const year = endISO.slice(0, 4);
	return `${formatShortDate(startISO)} – ${formatShortDate(endISO)}, ${year}`;
}

/** Inclusive day count between two ISO dates, e.g. May 22 -> Jul 6 = 46 days. */
export function daysBetweenInclusive(startISO: string, endISO: string): number {
	const start = parseISODateUTC(startISO);
	const end = parseISODateUTC(endISO);
	return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
}

/**
 * Groups the 'peak'-bucket cells' dates into consecutive-day runs and
 * renders them the way the 2A source's heatmap aria-label does, e.g.
 * "June 28 and 29, July 4 and 5".
 */
export function heaviestDaysLabel(cells: HeatmapCell[]): string {
	const peakDates = cells.filter((c) => heatBucket(c.tokens) === 'peak').map((c) => parseISODateUTC(c.date));
	if (peakDates.length === 0) return 'none';

	const groups: Date[][] = [];
	for (const d of peakDates) {
		const currentGroup = groups[groups.length - 1];
		const prev = currentGroup?.[currentGroup.length - 1];
		if (prev && d.getTime() - prev.getTime() === MS_PER_DAY) {
			currentGroup.push(d);
		} else {
			groups.push([d]);
		}
	}

	return groups
		.map((group) => {
			const month = MONTH_FULL[group[0].getUTCMonth()];
			const days = group.map((d) => d.getUTCDate());
			if (days.length === 1) return `${month} ${days[0]}`;
			return `${month} ${days.slice(0, -1).join(', ')} and ${days[days.length - 1]}`;
		})
		.join(', ');
}

/**
 * Full aria-label for the heatmap's role="img" wrapper, e.g. "Activity
 * heatmap, June 7 to July 6. Heaviest days: June 28 and 29, July 4 and 5."
 */
export function heatmapAriaLabel(cells: HeatmapCell[]): string {
	const start = parseISODateUTC(cells[0].date);
	const end = parseISODateUTC(cells[cells.length - 1].date);
	const startLabel = `${MONTH_FULL[start.getUTCMonth()]} ${start.getUTCDate()}`;
	const endLabel = `${MONTH_FULL[end.getUTCMonth()]} ${end.getUTCDate()}`;
	return `Activity heatmap, ${startLabel} to ${endLabel}. Heaviest days: ${heaviestDaysLabel(cells)}.`;
}

function padDotLabel(label: string, width = 15): string {
	const dots = '.'.repeat(Math.max(0, width - label.length - 2));
	return `${label} ${dots} `;
}

/**
 * The `$ memekit react --to "the token ledger"` terminal block's three
 * label-padded lines (2A source lines 447-449) — a small local helper for
 * this one block, not a general-purpose table formatter.
 */
export function memekitTerminal(inTokens: number, outTokens: number, cacheReadTokens: number): string[] {
	return [
		`${padDotLabel('in')}${inTokens.toLocaleString('en-US')}`,
		`${padDotLabel('out')}${outTokens.toLocaleString('en-US')}`,
		`${padDotLabel('cache read')}${cacheReadTokens.toLocaleString('en-US')}`,
	];
}
