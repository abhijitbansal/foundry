// Telemetry data shapes — plan Task 5.1. Mirrors only the fields of
// data/stats.json that the Telemetry section actually renders (headline
// totals, per-day out-token series for the heatmap, model mix, top tools).
// Deliberately does NOT model the whole stats.json schema — e.g.
// top_agents/top_slash/model_breakdown are present in the file but unused
// by the page, per Task 5.1's instruction to skip fields the page doesn't
// consume.

export interface StatsMeta {
	files_found: number;
	sessions_parsed: number;
	sessions_skipped: number;
	date_min: string;
	date_max: string;
	chars_per_token: number;
}

export interface StatsTotals {
	user_msgs: number;
	assistant_msgs: number;
	lines_added: number;
	lines_removed: number;
	files_written: number;
	files_edited: number;
	in_tokens: number;
	out_tokens: number;
	cache_read_tokens: number;
	cache_creation_tokens: number;
	sessions: number;
	thinking_blocks: number;
	web_search: number;
	web_fetch: number;
}

export type NameCountTuple = [name: string, count: number];
export type DateValueTuple = [date: string, value: number];

export interface GlobalPrompts {
	count: number;
	max: number;
}

export interface RepoSummary {
	repo: string;
	image_count: number;
}

export interface StatsJson {
	meta: StatsMeta;
	totals: StatsTotals;
	top_tools: NameCountTuple[];
	top_slash: NameCountTuple[];
	models: NameCountTuple[];
	daily_sessions: DateValueTuple[];
	daily_out_tokens: DateValueTuple[];
	daily_lines: DateValueTuple[];
	global_prompts: GlobalPrompts;
	repos: RepoSummary[];
}

export type HeatBucket = 'quiet' | 'low' | 'mid' | 'high' | 'peak';

export interface HeatmapCell {
	date: string;
	label: string;
	tokens: number | undefined;
}

export interface ModelMixSegment {
	label: string;
	percent: number;
	colorVar: string;
}

export interface ToolBar {
	label: string;
	count: number;
	percent: number;
}
