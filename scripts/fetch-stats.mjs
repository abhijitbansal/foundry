#!/usr/bin/env node
// fetch-stats.mjs — plan Task 5.2 prebuild step.
//
// If STATS_SOURCE is set and points at a real file, copy it over
// data/stats.json so the build picks up freshly generated telemetry.
// Otherwise leave the committed snapshot as-is. The actual generator
// script that produces a fresh stats.json lives in the claude-skills
// repo (out of this repo's scope) and is expected to write to whatever
// path STATS_SOURCE points at in CI.

import { existsSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const destPath = path.join(__dirname, '..', 'data', 'stats.json');
const source = process.env.STATS_SOURCE;

if (source && existsSync(source)) {
	copyFileSync(source, destPath);
	console.log(`[fetch-stats] copied STATS_SOURCE (${source}) -> data/stats.json`);
} else if (source) {
	console.log(`[fetch-stats] STATS_SOURCE was set to "${source}" but the file was not found — keeping committed snapshot`);
} else {
	console.log('[fetch-stats] STATS_SOURCE not set — keeping committed data/stats.json snapshot');
}
