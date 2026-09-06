// works.ts — "The Works" isometric yard-plan generator (public API). Pure,
// build-time only — no DOM, no fetch, everything here runs in Astro
// frontmatter and is unit-tested directly, same pattern as lib/telemetry.ts
// and lib/weekly.ts. Ported from design_handoff_works/works-city.jsx per
// docs/plans/2026-07-11-the-works-commit-city.md; geometry/paint primitives
// live in works-svg.ts, layout tables in works-layout.ts.

import { layoutStripGrid, STRIP_GRID_CELL_D, stripGridFootprint, YARD, YARD_PLATES } from './works-layout';
import type { LedgerEntry, WorksRepo, WorksResult, YardLayoutEntry } from './works.types';
import { annexRect, buildDefs, buildingEls, districtLabel, flatcar, FYW_STYLE, gantryCrane, ground, ingotStack, makeProj, northArrow, rail, scaleBar, stripBuildingLabel, stripStamp, titleBlock } from './works-svg';

export { fmtK, pennantCount, seeded } from './works-svg';

const YARD_MAX_STOREYS = 8;
const STRIP_MAX_STOREYS = 6;

const YARD_CONF = { S: 30, ox: 268, oy: 236, vw: 1010, vh: 612 };
const STRIP_CONF = { S: 26, ox: 126, oy: 172, vw: 620, vh: 448 };

const YARD_ARIA_LABEL = 'Isometric yard plan: one building per repository, height mapped to lines added.';
const STRIP_ARIA_LABEL = 'Isometric weekly strip: one building per active repository, height mapped to lines added this week.';

/** Every patch of ground the yard plan claims: one rect per YARD slot,
 * plus the derived annex rect for any building that grows one. The annex
 * is the reason this exists — its footprint is computed at paint time
 * from its parent's box, so reading YARD alone under-reports the occupied
 * ground by 8.1 units² and a new repo can be placed straight through a
 * hall's side wing. */
export function yardFootprints(): { key: string; x: number; y: number; w: number; d: number }[] {
	const out: { key: string; x: number; y: number; w: number; d: number }[] = [];
	for (const [key, b] of Object.entries(YARD)) {
		out.push({ key, x: b.x, y: b.y, w: b.w, d: b.d });
		if ('annex' in b && b.annex === true) {
			const { ax, ay, aw, ad } = annexRect(b.x, b.y, b.w);
			out.push({ key: `${key} (annex)`, x: ax, y: ay, w: aw, d: ad });
		}
	}
	return out;
}

/** Every repo in `repos` must have a YARD layout slot (src/lib/works-layout.ts)
 * — throws instead of silently skipping so a new repo in data/stats.json
 * fails the build loudly rather than rendering an incomplete yard. */
export function assertYardCoverage(repos: WorksRepo[]): void {
	const missing = repos.filter((r) => !YARD[r.repo]).map((r) => r.repo);
	if (missing.length > 0) {
		throw new Error(`works.ts: no YARD layout slot for repo(s): ${missing.join(', ')} — add an entry to YARD in src/lib/works-layout.ts`);
	}
}

/** score = lines_added; storeys = 0 (vacant lot) for score <= 0, otherwise
 * max(1, round(maxStoreys × (score/maxScore)^0.6)) — README "Encodings". */
export function computeStoreys(repos: WorksRepo[], maxStoreys: number): Record<string, number> {
	const maxScore = Math.max(...repos.map((r) => r.lines), 1);
	const out: Record<string, number> = {};
	for (const r of repos) {
		const score = r.lines;
		out[r.repo] = score <= 0 ? 0 : Math.max(1, Math.round(maxStoreys * Math.pow(score / maxScore, 0.6)));
	}
	return out;
}

/** litFrac = max(0.12, sqrt(metric/maxMetric)); metric is out_tokens when
 * present (yard), else sessions (weekly strips have no per-repo token
 * count) — README's data contract. */
export function computeLitFracs(repos: WorksRepo[]): Record<string, number> {
	const metric = (r: WorksRepo) => r.tokens ?? r.sessions;
	const maxMetric = Math.max(...repos.map(metric), 1);
	const out: Record<string, number> = {};
	for (const r of repos) {
		out[r.repo] = Math.max(0.12, Math.sqrt(metric(r) / maxMetric));
	}
	return out;
}

/** The Telemetry card's ledger grid — every repo ranked by lines added,
 * independent of the SVG (the screen-reader-friendly data path). */
export function buildLedger(repos: WorksRepo[]): LedgerEntry[] {
	assertYardCoverage(repos);
	const storeys = computeStoreys(repos, YARD_MAX_STOREYS);
	return [...repos]
		.sort((a, b) => b.lines - a.lines)
		.map((r, i) => ({
			rank: i + 1,
			repo: r.repo,
			storeys: storeys[r.repo],
			sessions: r.sessions,
			lines: r.lines,
			tokens: r.tokens ?? 0,
		}));
}

/** All-time yard plan (index `#telemetry`). `repos` should cover every
 * repo in data/stats.json — throws via assertYardCoverage otherwise. */
export function buildYard(repos: WorksRepo[], opts: { instanceId?: string }): WorksResult {
	assertYardCoverage(repos);
	const { S, ox, oy, vw, vh } = YARD_CONF;
	const P = makeProj(S, ox, oy);
	const storeys = computeStoreys(repos, YARD_MAX_STOREYS);
	const litFracs = computeLitFracs(repos);
	const rankOrder = [...repos].sort((a, b) => b.lines - a.lines);
	const rankOf = (repo: string) => rankOrder.findIndex((r) => r.repo === repo) + 1;
	const ordered = [...repos].sort((a, b) => YARD[a.repo].x + YARD[a.repo].y - (YARD[b.repo].x + YARD[b.repo].y));

	const instanceId = opts.instanceId ?? 'yard';
	const hatchId = `${instanceId}-h`;
	const glassId = `${instanceId}-g`;
	const glowAcc: string[] = [];

	const buildings = ordered.map((r) => buildingEls(P, YARD[r.repo], r, storeys[r.repo], litFracs[r.repo], hatchId, glassId, glowAcc, rankOf(r.repo))).join('');

	const under =
		YARD_PLATES.map((p) => ground(P, p.x, p.y, p.w, p.d)).join('') +
		rail(P, -1.4, 14.2, 7.82) +
		flatcar(P, 2.1, 7.7) +
		YARD_PLATES.map((p) => districtLabel(P, p)).join('');

	const over =
		gantryCrane(P, 9.4, 0.8, 10.9, 3.6, 2.6) +
		ingotStack(P, 8.6, 1.2, [4, 4, 3, 1], true) +
		ingotStack(P, 20.9, 1.4, [3, 2], true) +
		ingotStack(P, 3.2, 5.6, [2, 1], false);

	const furn =
		titleBlock(vw - 194, vh - 76, {
			sheetLabel: 'SHEET 03',
			sheetNo: 'NO. 03-A',
			// Review fix: at titleBlock's current w:170 (LAY-2), textMaxWidth is
			// w-24=146, but the old 44-char line estimates to 227px by the same
			// heuristic text() uses for its own textLength clamp (t.length *
			// size * (0.6+lsEm), size 7.6, default ls 0.08em) — the SVG was
			// shipping with the glyphs squeezed ~36% via textLength, not
			// actually fitting. This line is 27 chars, estimate 139.5px,
			// leaving ~6.5px margin.
			l3: '1 STY ≈ LINES ADDED · 8 MAX',
		}) +
		northArrow(vw - 46, 40) +
		scaleBar(24, vh - 26, S);

	const svg =
		`<svg class="fyw-svg" viewBox="0 0 ${vw} ${vh}" role="img" aria-label="${YARD_ARIA_LABEL}" style="width:100%;height:auto;display:block">` +
		`<style>${FYW_STYLE}</style>${buildDefs(hatchId, glassId)}` +
		`<g class="fyw-under">${under}</g><g class="fyw-buildings">${buildings}</g><g class="fyw-glow">${glowAcc.join('')}</g>` +
		`<g class="fyw-over">${over}</g><g class="fyw-furn">${furn}</g></svg>`;

	return { svg, ariaLabel: YARD_ARIA_LABEL };
}

/** One week's strip (updates.astro). `repos` is that week's
 * data/weekly/<week>.json `repos[]`, ranked by lines added descending and
 * placed into a wrapping multi-row grid (src/lib/works-layout.ts's
 * layoutStripGrid) rather than one long single-row line, so a busy week
 * reads as a proper yard instead of a vanishing point. `instanceId` must
 * be unique per rendered strip on the page (e.g. the week_id) so pattern
 * `id`s don't collide across multiple weeks. */
export function buildStrip(repos: WorksRepo[], opts: { stamp: string; instanceId: string }): WorksResult {
	const ordered = [...repos].sort((a, b) => b.lines - a.lines);
	const layout = layoutStripGrid(ordered.map((r) => r.repo));
	const { w: groundW, d: groundD, rows } = stripGridFootprint(ordered.length);

	const { S, oy, vw } = STRIP_CONF;
	// Per extra grid row, the ground plate's far-left corner (screen X =
	// ox − groundD·cos30°·S) walks further negative by exactly
	// STRIP_GRID_CELL_D·cos30°·S — shift the projection origin right by
	// that same amount, or a 2+ row week clips its own ground plate off
	// the left edge of the viewBox. The viewBox needs to grow taller by
	// roughly that row's screen-space depth (·sin30° instead of ·cos30°)
	// plus a fixed margin for the row's building/label height.
	const rowDepthPx = STRIP_GRID_CELL_D * S;
	const ox = STRIP_CONF.ox + (rows - 1) * rowDepthPx * Math.cos(Math.PI / 6);
	const vh = rows <= 1 ? STRIP_CONF.vh : STRIP_CONF.vh + (rows - 1) * (rowDepthPx * Math.sin(Math.PI / 6) + 20);
	const P = makeProj(S, ox, oy);
	const storeys = computeStoreys(ordered, STRIP_MAX_STOREYS);
	const litFracs = computeLitFracs(ordered);

	const hatchId = `${opts.instanceId}-h`;
	const glassId = `${opts.instanceId}-g`;
	const glowAcc: string[] = [];

	const buildings = ordered.map((r) => buildingEls(P, layout[r.repo], r, storeys[r.repo], litFracs[r.repo], hatchId, glassId, glowAcc)).join('');
	const under = ground(P, 0, 0, groundW, groundD);
	const labels = ordered.map((r) => stripBuildingLabel(P, layout[r.repo], r)).join('');
	const stamp = stripStamp(vw, opts.stamp);

	const svg =
		`<svg class="fyw-svg" viewBox="0 0 ${vw} ${vh}" role="img" aria-label="${STRIP_ARIA_LABEL}" style="width:100%;height:auto;display:block">` +
		`<style>${FYW_STYLE}</style>${buildDefs(hatchId, glassId)}` +
		`<g class="fyw-under">${under}</g><g class="fyw-buildings">${buildings}</g><g class="fyw-glow">${glowAcc.join('')}</g>` +
		`<g class="fyw-furn">${stamp}${labels}</g></svg>`;

	return { svg, ariaLabel: STRIP_ARIA_LABEL };
}

const FORGE_CONF = { S: 40, ox: 70, oy: 98, vw: 182, vh: 212 };
const FORGE_ARIA_LABEL = 'Isometric drawing of a cold forge building, the fire out, one ember still glowing at the furnace door.';

/** BRA-6 — 404's decorative "cold forge": one hand-placed building from
 * the same works-svg primitive vocabulary as the yard/strip, no data
 * behind it. `active:false` on the placeholder repo means buildingEls()
 * never emits smoke/vent puffs — no CSS suppression needed for that part.
 * The cold palette itself (window-lit/clerestory/hot-fill/halo/furnace-glow
 * overrides) is the caller's job via a scoped `.fyw-svg` custom-property
 * override (see 404.astro) — this only emits the neutral drawing plus the
 * one static ember coal those overrides can't produce (buildingEls has no
 * "single warm pixel, no animation" primitive; the built-in furnaceMouth()
 * is animated and fixed to --ds-secondary gold, not swappable to
 * --fy-ember, so it's deliberately not used here). */
export function buildColdForge(): WorksResult {
	const { S, ox, oy, vw, vh } = FORGE_CONF;
	const P = makeProj(S, ox, oy);
	const hatchId = 'forge-h';
	const glassId = 'forge-g';
	const glowAcc: string[] = [];

	const layout: YardLayoutEntry = { x: 0, y: 0, w: 2.6, d: 1.8, arch: 'monitor', plate: 0, np: [0, 0], stacks: [] };
	const repo: WorksRepo = { repo: 'the-forge', lines: 0, sessions: 0, active: false };
	const building = buildingEls(P, layout, repo, 3, 0.12, hatchId, glassId, glowAcc);

	// The last coal: a plain static dot at the furnace door's approximate
	// centre (same spot buildingEls' own furnaceMouth() would use for a
	// non-annex hall — see works-svg.ts's furnaceMouth call site), fixed
	// opacity, no keyframe.
	const emberCoal = P(layout.x + layout.w, layout.y + layout.d * 0.32 + 0.25, 0.27);

	const svg =
		`<svg class="fyw-svg fy-forge-svg" viewBox="0 0 ${vw} ${vh}" role="img" aria-label="${FORGE_ARIA_LABEL}" style="width:100%;height:auto;display:block">` +
		`<style>${FYW_STYLE}</style>${buildDefs(hatchId, glassId)}` +
		`<g class="fyw-buildings">${building}</g><g class="fyw-glow">${glowAcc.join('')}</g>` +
		`<circle class="fy-forge-ember" cx="${emberCoal[0].toFixed(2)}" cy="${emberCoal[1].toFixed(2)}" r="3" style="fill:var(--fy-ember);opacity:0.35"/>` +
		`</svg>`;

	return { svg, ariaLabel: FORGE_ARIA_LABEL };
}
