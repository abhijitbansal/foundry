// yard-data.ts — the one place that turns data/stats.json + the latest
// weekly digest into the WorksRepo[] the yard, the schedule and the
// telemetry sheet all draw from.
import statsJson from '../../data/stats.json';
import type { WorksRepo } from './works.types';
import { getAllWeeksDesc } from './weekly';

interface StatsRepoRow {
	repo: string;
	sessions: number;
	lines_added: number;
	out_tokens: number;
}

export function loadWorksRepos(): WorksRepo[] {
	const latestWeek = getAllWeeksDesc()[0];
	const activeThisWeek = new Set(latestWeek ? latestWeek.repos.map((r) => r.repo) : []);
	return (statsJson.repos as unknown as StatsRepoRow[]).map((r) => ({
		repo: r.repo,
		lines: r.lines_added,
		sessions: r.sessions,
		tokens: r.out_tokens,
		active: activeThisWeek.has(r.repo),
	}));
}
