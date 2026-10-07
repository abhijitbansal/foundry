// schedule.ts — joins projects.ts to the yard ledger for the home page's
// "Schedule of buildings". Bldg number = ledger rank, the same number the
// yard's nameplates print.
import type { Project, ProjectStatus } from '../data/projects.types';
import type { LedgerEntry } from './works.types';

export interface ScheduleLink { label: string; href: string }
export interface ScheduleRow {
	no: string;
	name: string;
	use: string;
	stack: string;
	storeys: number;
	status: ProjectStatus;
	links: ScheduleLink[];
	isPrivate: boolean;
}

const NOT_ON_YARD = '—';
const stripArrow = (s: string) => s.replace(/\s*↗\s*$/, '');

export function projectLinks(p: Project): ScheduleLink[] {
	const links: ScheduleLink[] = [];
	if (p.siteUrl) links.push({ label: stripArrow(p.siteLabel ?? new URL(p.siteUrl).hostname.replace(/^www\./, '')), href: p.siteUrl });
	if (p.repoUrl) links.push({ label: 'Source', href: p.repoUrl });
	if (p.extraLink) links.push({ label: stripArrow(p.extraLink.label), href: p.extraLink.url });
	return links;
}

export function scheduleRows(projects: Project[], ledger: LedgerEntry[]): ScheduleRow[] {
	const byRepo = new Map(ledger.map((e) => [e.repo, e]));
	return projects.map((p) => {
		const e = byRepo.get(p.repo);
		return {
			no: e ? String(e.rank).padStart(2, '0') : NOT_ON_YARD,
			name: p.name,
			use: p.blurb,
			stack: p.tech,
			storeys: e?.storeys ?? 0,
			status: p.status,
			links: projectLinks(p),
			isPrivate: p.private,
		};
	});
}
