import { describe, it, expect } from 'vitest';
import { appsProjects, aiToolingProjects, foundationProjects } from '../../src/data/projects';

const allProjects = [...appsProjects, ...aiToolingProjects, ...foundationProjects];

describe('projects.ts data integrity', () => {
	it('has exactly ten projects across the three groups', () => {
		expect(allProjects).toHaveLength(10);
	});

	// WorkSection.astro hand-maintains a count badge and a startIndex per
	// group, and the card badges run 01..10 off those numbers. A total-only
	// assertion passes even when a project moves between groups and every
	// badge after it drifts, so pin the split too.
	it('keeps the group split WorkSection.astro numbers its badges from', () => {
		expect({
			apps: appsProjects.length,
			aiTooling: aiToolingProjects.length,
			foundation: foundationProjects.length,
		}).toEqual({ apps: 5, aiTooling: 4, foundation: 1 });
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
