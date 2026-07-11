import { describe, it, expect } from 'vitest';
import { appsProjects, aiToolingProjects, foundationProjects } from '../../src/data/projects';

const allProjects = [...appsProjects, ...aiToolingProjects, ...foundationProjects];

describe('projects.ts data integrity', () => {
	it('has exactly nine projects across the three groups', () => {
		expect(allProjects).toHaveLength(9);
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
