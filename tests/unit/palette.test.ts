import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Hex literals of the retired cyan/ember palette (PR #25 and earlier). The
// vendored token files under src/styles/tokens/ are exempt: they're
// generated upstream and overridden by drawing-set.css, never edited here.
const RETIRED = ['#0E8FB0', '#34D3EE', '#0B7894', '#5ADCF1', '#236F86', '#175260', '#62C4D8', '#7FD0E0', '#AE4318', '#E8663A', '#B07A18', '#E8B94A', '#D9A93F'];

function walk(dir: string): string[] {
	return readdirSync(dir).flatMap((f) => {
		const p = join(dir, f);
		if (statSync(p).isDirectory()) return p.endsWith(join('styles', 'tokens')) ? [] : walk(p);
		return /\.(astro|ts|tsx|css)$/.test(p) ? [p] : [];
	});
}

const publicDir = resolve(__dirname, '../../public');
const svgs = readdirSync(publicDir)
	.filter((f) => f.endsWith('.svg'))
	.map((f) => join(publicDir, f));

describe('retired palette', () => {
	const files = [...walk(resolve(__dirname, '../../src')), ...svgs];

	it.each(RETIRED)('%s appears nowhere in src/ (outside the vendored tokens) or public/*.svg', (hex) => {
		const hits = files.filter((f) => readFileSync(f, 'utf8').toUpperCase().includes(hex));
		expect(hits).toEqual([]);
	});
});
