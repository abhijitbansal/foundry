// weekly.types.ts — mirrors scripts/stats/weekly_stats.py's JSON output
// shape (data/weekly/<week>.json). Only the fields the /updates page
// consumes are modeled.

export interface WeeklyRepoStats {
	repo: string;
	sessions: number;
	lines_added: number;
	lines_removed: number;
	top_tool: string | null;
	top_model: string | null;
}

export interface WeeklyHeatmapCell {
	count: number;
	out_tokens: number;
}

export interface WeeklyHeatmap {
	timezone: string;
	weekday_labels: string[];
	cells: WeeklyHeatmapCell[][]; // [weekday 0-6][hour 0-23]
}

export interface WeeklyReleaseInfo {
	pr_merge_count: number;
	pr_titles: string[] | null; // null for private repos — count-only
	release_count: number;
	release_tags: string[] | null;
}

export interface WeeklyHighlights {
	overall: string;
	repos: Record<string, string>;
}

export interface WeeklyDigest {
	week_id: string;
	week_start: string;
	week_end: string;
	generated_at: string;
	repos: WeeklyRepoStats[];
	heatmap: WeeklyHeatmap;
	releases: Record<string, WeeklyReleaseInfo>;
	highlights: WeeklyHighlights | null;
}
