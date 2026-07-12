// works.ts — "The Works" isometric yard-plan generator (public API). Pure,
// build-time only — no DOM, no fetch, everything here runs in Astro
// frontmatter and is unit-tested directly, same pattern as lib/telemetry.ts
// and lib/weekly.ts. Ported from design_handoff_works/works-city.jsx per
// docs/plans/2026-07-11-the-works-commit-city.md; geometry/paint primitives
// live in works-svg.ts, layout tables in works-layout.ts.

import { STRIP, YARD, YARD_PLATES } from './works-layout';
import type { LedgerEntry, WorksRepo, WorksResult } from './works.types';
import { buildDefs, buildingEls, districtLabel, flatcar, FYW_STYLE, gantryCrane, ground, ingotStack, makeProj, northArrow, rail, scaleBar, stripBuildingLabel, stripStamp, titleBlock } from './works-svg';

export { fmtK, seeded } from './works-svg';

const YARD_MAX_STOREYS = 8;
const STRIP_MAX_STOREYS = 6;

const YARD_CONF = { S: 30, ox: 268, oy: 236, vw: 1160, vh: 612 };
const STRIP_CONF = { S: 26, ox: 126, oy: 172, vw: 620, vh: 448 };

const YARD_ARIA_LABEL = 'Isometric yard plan: one building per repository, height mapped to lines added.';
const STRIP_ARIA_LABEL = 'Isometric weekly strip: one building per active repository, height mapped to lines added this week.';

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

/** Pennant count for a building's roof ridge — README "min(6, pr_merge_count)". */
export function pennantCount(prs: number): number {
	return Math.min(6, Math.max(0, prs));
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
 * repo in data/stats.json — throws via assertYardCoverage otherwise.
 * `metaLine` fills the title block's survey line (e.g. session count + date
 * range); it's upper-cased to match the engraved-plate style. */
export function buildYard(repos: WorksRepo[], opts: { metaLine: string; instanceId?: string }): WorksResult {
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
		titleBlock(vw - 316, vh - 96, {
			sheetLabel: 'SHEET 03',
			sheetNo: 'NO. 03-A',
			l1: 'FORGE YARD PLAN — ONE BUILDING PER REPO',
			l2: opts.metaLine.toUpperCase(),
			l3: 'SCALE: 1 STOREY ≈ LINES ADDED · 8-STOREY MAX',
		}) +
		northArrow(vw - 46, 40) +
		scaleBar(24, vh - 26, S);

	const svg =
		`<svg class="fyw-svg" viewBox="0 0 ${vw} ${vh}" role="img" aria-label="${YARD_ARIA_LABEL}" style="width:100%;height:auto;display:block">` +
		`<style>${FYW_STYLE}</style>${buildDefs(hatchId, glassId)}` +
		`<g class="fyw-under">${under}</g><g class="fyw-glow">${glowAcc.join('')}</g><g class="fyw-buildings">${buildings}</g>` +
		`<g class="fyw-over">${over}</g><g class="fyw-furn">${furn}</g></svg>`;

	return { svg, ariaLabel: YARD_ARIA_LABEL };
}

/** One week's strip (updates.astro). `repos` is that week's
 * data/weekly/<week>.json `repos[]` — entries without a STRIP layout slot
 * (src/lib/works-layout.ts) are silently skipped, since STRIP only covers
 * the repos the design curated slots for, not every repo in stats.json.
 * `instanceId` must be unique per rendered strip on the page (e.g. the
 * week_id) so pattern `id`s don't collide across multiple weeks. */
export function buildStrip(repos: WorksRepo[], opts: { stamp: string; instanceId: string }): WorksResult {
	const filtered = repos.filter((r) => STRIP[r.repo]);
	const { S, ox, oy, vw, vh } = STRIP_CONF;
	const P = makeProj(S, ox, oy);
	const storeys = computeStoreys(filtered, STRIP_MAX_STOREYS);
	const litFracs = computeLitFracs(filtered);
	const ordered = [...filtered].sort((a, b) => STRIP[a.repo].x + STRIP[a.repo].y - (STRIP[b.repo].x + STRIP[b.repo].y));

	const hatchId = `${opts.instanceId}-h`;
	const glassId = `${opts.instanceId}-g`;
	const glowAcc: string[] = [];

	const buildings = ordered.map((r) => buildingEls(P, STRIP[r.repo], r, storeys[r.repo], litFracs[r.repo], hatchId, glassId, glowAcc)).join('');
	const under = ground(P, 0, 0, 16.8, 3.1);
	const labels = filtered.map((r) => stripBuildingLabel(P, STRIP[r.repo], r)).join('');
	const stamp = stripStamp(vw, opts.stamp);

	const svg =
		`<svg class="fyw-svg" viewBox="0 0 ${vw} ${vh}" role="img" aria-label="${STRIP_ARIA_LABEL}" style="width:100%;height:auto;display:block">` +
		`<style>${FYW_STYLE}</style>${buildDefs(hatchId, glassId)}` +
		`<g class="fyw-under">${under}</g><g class="fyw-glow">${glowAcc.join('')}</g><g class="fyw-buildings">${buildings}</g>` +
		`<g class="fyw-furn">${stamp}${labels}</g></svg>`;

	return { svg, ariaLabel: STRIP_ARIA_LABEL };
}
