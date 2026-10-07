import { describe, it, expect } from 'vitest';
import { formatSheetDate, SHEETS } from '../../src/lib/sheet';

describe('sheet.ts', () => {
	it('formats a build date as a drawing-sheet date, dd.mm.yyyy in UTC', () => {
		expect(formatSheetDate(new Date(Date.UTC(2026, 9, 6, 23, 59)))).toBe('06.10.2026');
		expect(formatSheetDate(new Date(Date.UTC(2027, 0, 1)))).toBe('01.01.2027');
	});

	it('numbers every sheet uniquely, in index order', () => {
		const codes = SHEETS.map((s) => s.code);
		expect(new Set(codes).size).toBe(codes.length);
		expect(codes).toEqual(['A-01', 'A-02', 'A-03', 'B-01', 'C-01', 'C-02']);
	});
});
