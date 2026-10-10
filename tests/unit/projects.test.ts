import { describe, it, expect } from 'vitest';
import { appsProjects, aiToolingProjects, foundationProjects } from '../../src/data/projects';

const allProjects = [...appsProjects, ...aiToolingProjects, ...foundationProjects];

describe('projects.ts data integrity', () => {
	it('has exactly fourteen projects across the three groups', () => {
		expect(allProjects).toHaveLength(14);
	});

	// Schedule.astro renders these three groups under their own headings
	// (rows are numbered by yard rank, not group order). A total-only
	// assertion passes when a project silently moves between groups, so pin
	// the split too.
	it('keeps the three-group split Schedule.astro renders', () => {
		expect({
			apps: appsProjects.length,
			aiTooling: aiToolingProjects.length,
			foundation: foundationProjects.length,
		}).toEqual({ apps: 5, aiTooling: 7, foundation: 2 });
	});

	it('every public (private:false) project has at least one of repoUrl/siteUrl set', () => {
		for (const project of allProjects.filter((p) => !p.private)) {
			expect(
				Boolean(project.repoUrl || project.siteUrl),
				`${project.name} is private:false but has neither repoUrl nor siteUrl`,
			).toBe(true);
		}
	});

	it('every private (private:true) project has neither repoUrl nor siteUrl', () => {
		for (const project of allProjects.filter((p) => p.private)) {
			expect(
				Boolean(project.repoUrl || project.siteUrl),
				`${project.name} is private:true but has a repoUrl or siteUrl set`,
			).toBe(false);
		}
	});
});
