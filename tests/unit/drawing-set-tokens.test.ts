import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(resolve(__dirname, '../../src/styles/drawing-set.css'), 'utf8');

function palette(name: 'day' | 'night'): Record<string, string> {
	const start = css.indexOf(`/* @palette ${name} */`);
	const end = css.indexOf('/* @end */', start);
	if (start < 0 || end < 0) throw new Error(`palette ${name} markers missing`);
	const block = css.slice(start, end);
	const out: Record<string, string> = {};
	for (const m of block.matchAll(/(--[a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})\s*;/g)) out[m[1]] = m[2].toUpperCase();
	return out;
}

function luminance(hex: string): number {
	const [r, g, b] = [1, 3, 5]
		.map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
		.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

describe.each(['day', 'night'] as const)('drawing-set %s palette', (name) => {
	const p = palette(name);
	const grounds = ['--ds-bg', '--ds-surface', '--ds-surface-2'];
	const inks = ['--ds-text', '--ds-text-2', '--ds-text-3', '--ds-secondary'];

	it('defines every token the site and the yard SVG read', () => {
		for (const t of [...grounds, ...inks, '--ds-line', '--ds-line-strong', '--ds-text-faint', '--ds-accent', '--ds-on-accent', '--fy-ember']) {
			expect(p[t], t).toMatch(/^#[0-9A-F]{6}$/);
		}
	});

	it.each(inks)('%s clears WCAG AA (4.5:1) on every ground', (ink) => {
		for (const g of grounds) expect(contrast(p[ink], p[g]), `${ink} on ${g}`).toBeGreaterThanOrEqual(4.5);
	});

	it('interaction is ink: accent equals text, and on-accent reads on it', () => {
		expect(p['--ds-accent']).toBe(p['--ds-text']);
		expect(contrast(p['--ds-on-accent'], p['--ds-accent'])).toBeGreaterThanOrEqual(4.5);
	});

	it('redline is the one hue: ember equals secondary', () => {
		expect(p['--fy-ember']).toBe(p['--ds-secondary']);
	});
});
