import { describe, it, expect } from 'vitest';
import { CRAFT_ACTS } from '../../src/lib/craft-content';
import {
	buildRoom,
	buildVigCoda,
	buildVigCuriosity,
	buildVigFirstPrinciples,
	buildVigHarness,
	buildVigLimits,
	buildVigOrgDesign,
	buildVigOutcome,
	buildVigSecurity,
	buildVigTester,
} from '../../src/lib/craft-svg';

const VIGNETTE_BUILDERS = [
	buildVigFirstPrinciples,
	buildVigOutcome,
	buildVigOrgDesign,
	buildVigHarness,
	buildVigLimits,
	buildVigCuriosity,
	buildVigTester,
	buildVigSecurity,
	buildVigCoda,
];

describe('CRAFT_ACTS content', () => {
	it('has three acts in Direct → Delegate → Verify order with 2/3/3 skills', () => {
		expect(CRAFT_ACTS.map((a) => a.id)).toEqual(['craft-direct', 'craft-delegate', 'craft-verify']);
		expect(CRAFT_ACTS.map((a) => a.skills.length)).toEqual([2, 3, 3]);
	});

	it('gives every skill a title, at least one body paragraph, a margin note, and a vignette', () => {
		for (const act of CRAFT_ACTS) {
			for (const skill of act.skills) {
				expect(skill.title.length).toBeGreaterThan(0);
				expect(skill.bodyHtml.length).toBeGreaterThan(0);
				expect(skill.margin.length).toBeGreaterThan(0);
				expect(skill.vignette).toContain('<svg');
			}
		}
	});

	it('links the harness engineering skill to the harness page', () => {
		const harnessSkill = CRAFT_ACTS[1].skills.find((s) => s.title === 'Harness engineering');
		expect(harnessSkill?.bodyHtml.some((p) => p.includes('href') && p.includes('harness/'))).toBe(true);
	});
});

describe('craft svg builders', () => {
	it('every vignette is an accessible 280×130 svg using only DS custom properties', () => {
		for (const build of VIGNETTE_BUILDERS) {
			const svg = build();
			expect(svg).toContain('viewBox="0 0 280 130"');
			expect(svg).toContain('role="img"');
			expect(svg).toContain('aria-label="');
			expect(svg).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
			expect(svg).toContain('var(--ds-');
		}
	});

	it('the room figure names all three agents and the harness fixtures', () => {
		const room = buildRoom();
		for (const label of ['Planner', 'Builder', 'Reviewer', 'TOOLS', 'GUARDRAILS', 'EVALS', 'CONTEXT']) {
			expect(room).toContain(label);
		}
		expect(room).toContain('role="img"');
	});

	it('keeps the coda loop inside the viewBox (regression: arrowhead clipped at y=134)', () => {
		expect(buildVigCoda()).toContain('translate(0,-10)');
	});
});
