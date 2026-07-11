// weekly.ts — pure functions consumed by src/pages/updates.astro. No DOM,
// no fetch — everything here runs at build time in Astro frontmatter and
// is unit-tested directly, same pattern as lib/telemetry.ts.

import type { WeeklyDigest, WeeklyRepoStats } from './weekly.types';

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseISODate(iso: string): { y: number; m: number; d: number } {
	const [y, m, d] = iso.split('-').map(Number);
	return { y, m: m - 1, d };
}

/** "2026-06-29" + "2026-07-05" -> "Jun 29 – Jul 5, 2026" */
export function formatWeekRange(startISO: string, endISO: string): string {
	const start = parseISODate(startISO);
	const end = parseISODate(endISO);
	const startLabel = `${MONTH_ABBR[start.m]} ${start.d}`;
	const endLabel = `${MONTH_ABBR[end.m]} ${end.d}`;
	return `${startLabel} – ${endLabel}, ${end.y}`;
}

/** Newest week first. week_id is "YYYY-Www" (zero-padded week), so plain
 * string comparison already sorts chronologically within a century. */
export function sortWeeksDesc(digests: WeeklyDigest[]): WeeklyDigest[] {
	return [...digests].sort((a, b) => (a.week_id < b.week_id ? 1 : a.week_id > b.week_id ? -1 : 0));
}

/** 0 for an all-quiet grid (avoids divide-by-zero); otherwise value/max as
 * a 0-100 integer percent, clamped. */
export function heatmapCellPercent(value: number, max: number): number {
	if (max <= 0 || value <= 0) return 0;
	return Math.min(100, Math.max(0, Math.round((value / max) * 100)));
}

export function heatmapCellColor(percent: number): string {
	if (percent <= 0) return 'var(--ds-surface-2)';
	return `color-mix(in srgb, var(--ds-accent) ${percent}%, var(--ds-surface-2))`;
}

/** Max message count across every cell in a week's grid — the
 * normalization basis for heatmapCellPercent(). Message count, not
 * out_tokens: a message can have real activity with 0 recorded output
 * tokens (malformed/older transcript records), which would otherwise
 * render as a flat "quiet" cell despite genuine activity — count is never
 * zero when something happened, so color and "was this cell active" stay
 * in sync with each other and with the tooltip. */
export function maxHeatmapValue(cells: { count: number }[][]): number {
	let max = 0;
	for (const row of cells) {
		for (const cell of row) {
			if (cell.count > max) max = cell.count;
		}
	}
	return max;
}

/** The repo with the most lines_added this week, or undefined for an
 * empty week. Used for a deterministic "busiest repo" badge — computed
 * from the same data the highlight agent reads, not trusted from its
 * prose, so the UI can't drift out of sync with a stale/wrong highlight. */
export function busiestRepo(repos: WeeklyRepoStats[]): WeeklyRepoStats | undefined {
	if (repos.length === 0) return undefined;
	return [...repos].sort((a, b) => b.lines_added - a.lines_added)[0];
}

export function totalWeeklyLines(repos: WeeklyRepoStats[]): number {
	return repos.reduce((sum, r) => sum + r.lines_added, 0);
}

export function totalWeeklySessions(repos: WeeklyRepoStats[]): number {
	return repos.reduce((sum, r) => sum + r.sessions, 0);
}
