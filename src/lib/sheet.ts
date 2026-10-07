// sheet.ts — the drawing-set's sheet index. One source for the nav, every
// page's SheetHead code, and the footer title block.

export interface Sheet {
	code: string;
	label: string;
	path: string; // relative to BASE_URL; '' is the home page
}

export const SHEETS: Sheet[] = [
	{ code: 'A-01', label: 'Yard', path: '' },
	{ code: 'A-02', label: 'Works', path: '#schedule' },
	{ code: 'A-03', label: 'Revisions', path: 'updates/' },
	{ code: 'A-04', label: 'Notes', path: '#notes' },
	{ code: 'B-01', label: 'Telemetry', path: 'telemetry/' },
	{ code: 'C-01', label: 'Harness', path: 'harness/' },
	{ code: 'C-02', label: 'Craft', path: 'craft/' },
];

export function sheet(code: string): Sheet {
	const s = SHEETS.find((x) => x.code === code);
	if (!s) throw new Error(`unknown sheet ${code}`);
	return s;
}

export function formatSheetDate(d: Date): string {
	const dd = String(d.getUTCDate()).padStart(2, '0');
	const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
	return `${dd}.${mm}.${d.getUTCFullYear()}`;
}
