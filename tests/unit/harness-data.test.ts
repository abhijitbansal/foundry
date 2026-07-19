import { describe, it, expect } from 'vitest';
import { DELTA_ITEMS, SCALARS } from '../../src/data/harness';
import type { DeltaBadge } from '../../src/data/harness.types';

const VALID_BADGES: DeltaBadge[] = ['NEW', 'RULE', 'APPLIED', 'RETIRED', 'CLOSED', 'CHANGED', 'NOTE'];

describe('DELTA_ITEMS', () => {
	it('has 11 items', () => {
		expect(DELTA_ITEMS).toHaveLength(11);
	});

	it('every badge is in the DeltaBadge union', () => {
		for (const item of DELTA_ITEMS) {
			expect(VALID_BADGES).toContain(item.badge);
		}
	});

	it('every item has a non-empty title and body', () => {
		for (const item of DELTA_ITEMS) {
			expect(item.title.length).toBeGreaterThan(0);
			expect(item.body.length).toBeGreaterThan(0);
		}
	});
});

describe('SCALARS', () => {
	it('score stays 79 — a re-score requires a fresh independent dispatch, not a silent edit here', () => {
		expect(SCALARS.score).toBe(79);
	});
});
