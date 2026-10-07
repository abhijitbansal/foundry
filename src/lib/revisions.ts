// revisions.ts — the home sheet's revision block: one row per completed
// week, newest first, from data/weekly/*.json.
import type { WeeklyDigest } from './weekly.types';
import { busiestRepo, formatWeekRange, totalWeeklyLines, totalWeeklySessions } from './weekly';

export interface RevisionRow {
	rev: string;
	week: string;
	lines: number;
	sessions: number;
	lead: string | null;
	isLatest: boolean;
}

export function revisionRows(weeksDesc: WeeklyDigest[], limit = 4): RevisionRow[] {
	return weeksDesc.slice(0, limit).map((w, i) => ({
		rev: w.week_id.split('-')[1] ?? w.week_id,
		week: formatWeekRange(w.week_start, w.week_end),
		lines: totalWeeklyLines(w.repos),
		sessions: totalWeeklySessions(w.repos),
		lead: busiestRepo(w.repos)?.repo ?? null,
		isLatest: i === 0,
	}));
}
