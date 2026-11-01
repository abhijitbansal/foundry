import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Card-only repos (AGENTS.md → Telemetry data). Allowlisting one gives it a
// permanent yard building through the archive ratchet, so the guard is the
// allowlist itself, not just the absence of a YARD slot.
const CARD_ONLY = ['orca-local'];

function allowlist(): string[] {
	const src = readFileSync(resolve(__dirname, '../../scripts/stats/parse_sessions.py'), 'utf8');
	const block = src.match(/PROJECTS_ALLOWLIST = \{([\s\S]*?)\}/);
	if (!block) throw new Error('PROJECTS_ALLOWLIST not found in parse_sessions.py');
	return [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

describe('PROJECTS_ALLOWLIST', () => {
	it('parses a non-trivial allowlist', () => {
		expect(allowlist()).toContain('cubby');
	});

	// Coming-soon repos still earn a building like any other tool.
	it.each(['jarvis', 'job-finder'])('allowlists %s for its yard building', (repo) => {
		expect(allowlist()).toContain(repo);
	});

	it.each(CARD_ONLY)('keeps the card-only %s off the allowlist', (repo) => {
		expect(allowlist()).not.toContain(repo);
	});
});
