import { describe, it, expect } from 'vitest';
import { projectLinks, scheduleRows } from '../../src/lib/schedule';
import type { Project } from '../../src/data/projects.types';
import type { LedgerEntry } from '../../src/lib/works.types';

const p = (over: Partial<Project>): Project => ({ name: 'X', repo: 'x', status: 'active', blurb: 'b', tech: 't', private: false, repoUrl: 'https://github.com/a/x', ...over });
const L = (rank: number, repo: string, storeys: number): LedgerEntry => ({ rank, repo, storeys, sessions: 1, lines: 1, tokens: 0 });

describe('scheduleRows', () => {
	it('numbers each row by its yard rank and carries its storeys', () => {
		const rows = scheduleRows([p({ name: 'Cubby', repo: 'cubby' }), p({ name: 'Paperix', repo: 'doc-scan' })], [L(1, 'cubby', 8), L(4, 'doc-scan', 3)]);
		expect(rows.map((r) => [r.name, r.no, r.storeys])).toEqual([['Cubby', '01', 8], ['Paperix', '04', 3]]);
	});

	it('keeps a project whose repo is not on the yard, numbered — with 0 storeys', () => {
		const [row] = scheduleRows([p({ name: 'New', repo: 'brand-new' })], [L(1, 'cubby', 8)]);
		expect(row).toMatchObject({ name: 'New', no: '—', storeys: 0 });
	});

	it('marks private builds and gives them no links', () => {
		const [row] = scheduleRows([p({ private: true, repoUrl: undefined })], []);
		expect(row.isPrivate).toBe(true);
		expect(row.links).toEqual([]);
	});
});

describe('projectLinks', () => {
	it('site first (its label without the arrow), then source, then the extra link', () => {
		expect(projectLinks(p({ siteUrl: 'https://gotcubby.com', siteLabel: 'gotcubby.com ↗', repoUrl: 'https://github.com/a/c', extraLink: { url: 'https://d', label: 'digest ↗' } }))).toEqual([
			{ label: 'gotcubby.com', href: 'https://gotcubby.com' },
			{ label: 'Source', href: 'https://github.com/a/c' },
			{ label: 'digest', href: 'https://d' },
		]);
	});

	it('falls back to the host when a site has no label', () => {
		expect(projectLinks(p({ siteUrl: 'https://www.example.com/x', repoUrl: undefined }))).toEqual([{ label: 'example.com', href: 'https://www.example.com/x' }]);
	});
});
