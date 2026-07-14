// RoutingCard.tsx — the harness page's one interactive React island: a
// verbatim port of harness-hall.jsx's Switchyard SVG plus the routing.dc
// script's DEFS pill/label/detail-line data (Foundry 5A - Harness.dc.html
// lines ~427-517). Geometry (RAIL_Y, FURN_X, SCN) is collision-tuned —
// do not re-lay it out.

import { useState, type ReactNode } from 'react';
import { C, HAIR, type Point } from '../../lib/harness-svg-primitives';

/* ---------- shared iso pieces ---------- */

type Anchor = 'start' | 'middle' | 'end';

interface PaProps { d: string; f?: string; s?: string; w?: number; o?: number; dash?: string; cls?: string; marker?: string }
function Pa({ d, f = 'none', s = C.ink, w = HAIR, o, dash, cls, marker }: PaProps) {
	return <path d={d} className={cls} style={{ fill: f, stroke: s, opacity: o }} strokeWidth={w} strokeDasharray={dash} strokeLinecap="round" strokeLinejoin="round" markerEnd={marker} />;
}

interface LnProps { a: Point; b: Point; s?: string; w?: number; o?: number; dash?: string; cls?: string; marker?: string }
function Ln({ a, b, s = C.ink, w = HAIR, o, dash, cls, marker }: LnProps) {
	return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className={cls} style={{ stroke: s, opacity: o }} strokeWidth={w} strokeDasharray={dash} strokeLinecap="round" markerEnd={marker} />;
}

interface CiProps { c: Point; r: number; f?: string; s?: string; w?: number; o?: number; cls?: string }
function Ci({ c, r, f = 'none', s = C.ink, w = HAIR, o, cls }: CiProps) {
	return <circle cx={c[0]} cy={c[1]} r={r} className={cls} style={{ fill: f, stroke: s, opacity: o }} strokeWidth={w} />;
}

interface TxProps { x: number; y: number; t: string; size?: number; fill?: string; w?: number; ls?: string; anchor?: Anchor; font?: string; o?: number; upper?: boolean }
function Tx({ x, y, t, size = 9, fill = C.capSoft, w = 500, ls = '0.09em', anchor = 'start', font = C.mono, o, upper = true }: TxProps) {
	return (
		<text x={x} y={y} textAnchor={anchor} style={{ fill, opacity: o, fontFamily: font, fontSize: size, fontWeight: w, letterSpacing: ls, textTransform: upper ? 'uppercase' : 'none' }}>
			{t}
		</text>
	);
}

function HatchDefs({ id }: { id: string }) {
	return (
		<defs>
			<pattern id={id} width={5} height={5} patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
				<line x1={0} y1={0} x2={0} y2={5} style={{ stroke: 'var(--ds-text)' }} strokeWidth={0.55} opacity={0.16} />
			</pattern>
			<marker id={`${id}-arr`} viewBox="0 0 8 8" refX={6.5} refY={4} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
				<path d="M0.5,0.8 L7,4 L0.5,7.2" fill="none" style={{ stroke: 'context-stroke' }} strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" />
			</marker>
		</defs>
	);
}

/* ================= SWITCHYARD — interactive routing schematic ================= */

type RailId = 'solo' | 'single' | 'wf' | 'teamA' | 'teamB';
type FurnaceId = 'planner' | 'executor' | 'chore';
type GateState = 'on' | 'warn' | 'skip' | 'off';
type ScenarioId = 'fix' | 'review' | 'advisor' | 'wave' | 'audit' | 'team';

const RAIL_Y: Record<RailId, number> = { solo: 150, single: 245, wf: 340, teamA: 460, teamB: 512 };
const FURN_X: Record<FurnaceId, number> = { planner: 330, executor: 545, chore: 745 };
const EFFORTS = ['low', 'med', 'high', 'xhigh', 'max'];

interface Drop { x: number; furnace: FurnaceId; t: [string, string]; fromY?: number; labelLeft?: boolean; ly?: number }
interface ScenarioNode { x: number; t: [string, string] }
interface GateStates { compile: GateState; tests: GateState; review: GateState; push: GateState; log: GateState }
interface ScenarioGeom {
	mode: 'solo' | 'single' | 'wf' | 'team';
	modeLabel: string;
	node: ScenarioNode | null;
	drops: Drop[];
	dials: Partial<Record<FurnaceId, number>>;
	gates: GateStates;
	gateNote: string;
}

const SCN: Record<ScenarioId, ScenarioGeom> = {
	fix: {
		mode: 'solo',
		modeLabel: 'Solo — orchestrator edits directly',
		node: { x: 520, t: ['orchestrator edits', 'no dispatch ceremony'] },
		drops: [],
		dials: {},
		gates: { compile: 'skip', tests: 'skip', review: 'skip', push: 'off', log: 'on' },
		gateNote: 'smart routing: trivial tier — heavy review skipped, fired gates never suppressed',
	},
	review: {
		mode: 'single',
		modeLabel: 'Single agent — one bounded delegation',
		node: { x: 430, t: ['one perspective', 'schema-shaped return'] },
		drops: [{ x: 545, furnace: 'executor', t: ['ecc:swift-reviewer', 'sonnet · medium'] }],
		dials: { executor: 1 },
		gates: { compile: 'off', tests: 'off', review: 'on', push: 'off', log: 'on' },
		gateNote: 'a focused review dispatch — findings return with file:line anchors',
	},
	advisor: {
		mode: 'single',
		modeLabel: 'Single agent + advisor — consult one tier up before committing',
		node: { x: 430, t: ['build at your tier', 'convinced? consult up'] },
		drops: [
			{ x: 545, furnace: 'executor', t: ['sonnet 5 · builds', 'medium–high'] },
			{ x: 460, furnace: 'planner', t: ['advisor() call', 'fable/opus · high'], labelLeft: true },
		],
		dials: { executor: 1, planner: 2 },
		gates: { compile: 'off', tests: 'off', review: 'on', push: 'off', log: 'on' },
		gateNote: 'advisor sees the full transcript — call before committing to an interpretation, and again before declaring done',
	},
	wave: {
		mode: 'wf',
		modeLabel: 'Workflow — /fix BUG-004 · a real wave',
		node: { x: 260, t: ['plan desk', 'propose → WAIT'] },
		drops: [
			{ x: 330, furnace: 'planner', t: ['writing-plans', 'fable/opus · xhigh'] },
			{ x: 545, furnace: 'executor', t: ['TDD · phases serial', 'sonnet · med–high'] },
			{ x: 745, furnace: 'chore', t: ['digests · checklists', 'haiku · low'] },
		],
		dials: { planner: 3, executor: 2, chore: 0 },
		gates: { compile: 'on', tests: 'on', review: 'on', push: 'warn', log: 'warn' },
		gateNote: 'phase boundary, in order: compile → whole CubbyTests → reviewer → push → docs: checkpoint',
	},
	audit: {
		mode: 'wf',
		modeLabel: 'Workflow + adversarial verify',
		node: { x: 260, t: ['fan-out over', 'the config'] },
		drops: [
			{ x: 545, furnace: 'executor', t: ['6 finder agents', 'sonnet · medium'] },
			{ x: 330, furnace: 'planner', t: ['synthesis · scoring', 'opus · high'], labelLeft: true },
			{ x: 490, furnace: 'planner', t: ['adversarial verify', 'fable · max'], labelLeft: true },
		],
		dials: { planner: 4, executor: 1 },
		gates: { compile: 'off', tests: 'off', review: 'on', push: 'off', log: 'on' },
		gateNote: 'schema every data-returning dispatch — parse-retry loops are pure token burn',
	},
	team: {
		mode: 'team',
		modeLabel: 'Agent team — long-lived roles, cross-talk',
		node: null,
		drops: [
			{ x: 430, furnace: 'executor', t: ['implementer', 'sonnet · med–high'], fromY: RAIL_Y.teamA, labelLeft: true, ly: 16 },
			{ x: 640, furnace: 'executor', t: ['reviewer', 'sonnet · med'], fromY: RAIL_Y.teamB },
		],
		dials: { planner: 3, executor: 2 },
		gates: { compile: 'on', tests: 'on', review: 'on', push: 'warn', log: 'warn' },
		gateNote: 'mid-flight steering across phases — the orchestrator stays planner-tier',
	},
};

interface CrucibleProps { cx: number; cy: number; name: string; tier: string; level: number | undefined; active: boolean }
function Crucible({ cx, cy, name, tier, level, active }: CrucibleProps) {
	const ink = active ? C.accent : C.ink;
	const body = `M${cx - 26},${cy - 18} L${cx + 26},${cy - 18} L${cx + 18},${cy + 14} L${cx - 18},${cy + 14} Z`;
	const dx = cx + 44, dy = cy - 2, r = 15;
	const na = Math.PI - ((level == null ? 0 : level) * Math.PI) / 4;
	return (
		<g>
			<Pa d={body} f={active ? C.accentSoft : C.paper2} s={ink} w={active ? 1.4 : HAIR} />
			<Pa d={`M${cx - 20},${cy - 18} L${cx + 20},${cy - 18}`} s={active ? C.gold : C.inkSoft} w={active ? 2.2 : 1.2} o={active ? 0.95 : 0.6} cls={active ? 'fyh-glow' : undefined} />
			<Ln a={[cx - 22, cy + 14]} b={[cx - 26, cy + 20]} s={ink} w={HAIR} />
			<Ln a={[cx + 22, cy + 14]} b={[cx + 26, cy + 20]} s={ink} w={HAIR} />
			<Tx x={cx} y={cy + 34} t={name} size={9.5} fill={active ? C.inkStrong : C.capSoft} w={650} anchor="middle" />
			<Tx x={cx} y={cy + 46} t={tier} size={8} fill={active ? C.accentH : C.capFaint} anchor="middle" />
			<Pa d={`M${dx - r},${dy} A${r},${r} 0 0 1 ${dx + r},${dy}`} s={C.hairS} w={0.8} />
			{EFFORTS.map((_, i) => {
				const a = Math.PI - (i * Math.PI) / 4;
				return <Ln key={'dt' + i} a={[dx + Math.cos(a) * (r - 2.5), dy - Math.sin(a) * (r - 2.5)]} b={[dx + Math.cos(a) * (r + 1.5), dy - Math.sin(a) * (r + 1.5)]} s={C.inkSoft} w={0.7} o={0.8} />;
			})}
			<Ln a={[dx, dy]} b={[dx + Math.cos(na) * (r - 4.5), dy - Math.sin(na) * (r - 4.5)]} s={level != null && active ? C.gold : C.inkFaint} w={level != null && active ? 1.6 : 1} o={level != null && active ? 1 : 0.6} />
			<Ci c={[dx, dy]} r={1.6} f={level != null && active ? C.gold : C.inkFaint} s="none" />
			<Tx x={dx} y={dy + 12} t={level != null && active ? EFFORTS[level] : 'effort'} size={7.5} fill={level != null && active ? C.gold : C.capFaint} anchor="middle" />
		</g>
	);
}

interface GateLampProps { x: number; y: number; label: string; sub: string; state: GateState }
function GateLamp({ x, y, label, sub, state }: GateLampProps) {
	const col = state === 'on' ? C.good : state === 'warn' ? C.warn : C.inkFaint;
	const fill = state === 'on' ? 'color-mix(in srgb, var(--ds-success) 12%, transparent)' : state === 'warn' ? 'color-mix(in srgb, var(--ds-warning) 12%, transparent)' : 'none';
	return (
		<g>
			<rect x={x} y={y} width={118} height={34} rx={3} fill={fill} style={{ stroke: state === 'off' ? C.hair : col }} strokeWidth={state === 'off' ? 0.7 : 1.1} strokeDasharray={state === 'skip' ? '3 3' : undefined} />
			<Ci c={[x + 12, y + 17]} r={3} f={state === 'off' ? 'none' : col} s={state === 'off' ? C.inkFaint : 'none'} w={0.8} />
			<Tx x={x + 22} y={y + 15} t={label} size={8.5} fill={state === 'off' ? C.capFaint : C.inkStrong} w={600} />
			<Tx x={x + 22} y={y + 27} t={state === 'skip' ? 'skipped — trivial' : sub} size={7.5} fill={state === 'skip' ? C.capSoft : state === 'off' ? C.capFaint : col} />
		</g>
	);
}

function Switchyard({ scenario }: { scenario: ScenarioId }) {
	const sc = SCN[scenario] || SCN.wave;
	const A = 'sy-hatch';
	const flow = 'fyh-flow';
	const MERGE_X = 872, GATE_X = 900, OUT_X = 1032;

	const rails: ReactNode[] = [];
	const railDefs: [Exclude<RailId, 'teamB'>, string, string][] = [
		['solo', 'solo', 'single-file fix · conversational turn'],
		['single', 'single agent', 'one bounded delegation'],
		['wf', 'workflow', 'fan-out · pipelines · aggregation'],
		['teamA', 'agent team', 'long-lived roles · cross-talk'],
	];
	railDefs.forEach(([id, name, when]) => {
		const y = RAIL_Y[id];
		rails.push(<Ln key={'rail-' + id} a={[232, y]} b={[MERGE_X, y]} s={C.hairS} w={1.2} />);
		rails.push(<Ln key={'railb-' + id} a={[232, y + 3.5]} b={[MERGE_X, y + 3.5]} s={C.hair} w={0.6} o={0.9} />);
		for (let tx = 244; tx < MERGE_X; tx += 26) rails.push(<Ln key={'tie-' + id + tx} a={[tx, y - 2.5]} b={[tx, y + 6]} s={C.hair} w={0.6} o={0.55} />);
		rails.push(<Tx key={'rn-' + id} x={240} y={y - 22} t={name} size={10} fill={C.inkStrong} w={650} />);
		rails.push(<Tx key={'rw-' + id} x={240} y={y - 11} t={when} size={7.5} fill={C.capFaint} />);
	});
	rails.push(<Ln key="rail-tb" a={[380, RAIL_Y.teamB]} b={[MERGE_X - 40, RAIL_Y.teamB]} s={C.hairS} w={1.2} />);
	rails.push(<Ln key="railb-tb" a={[380, RAIL_Y.teamB + 3.5]} b={[MERGE_X - 40, RAIL_Y.teamB + 3.5]} s={C.hair} w={0.6} o={0.9} />);
	rails.push(<Tx key="rn-tb" x={388} y={RAIL_Y.teamB + 16} t="second role — reviewer" size={7.5} fill={C.capFaint} />);
	(Object.keys(RAIL_Y) as RailId[]).filter((k) => k !== 'teamB').forEach((k) => {
		rails.push(<Pa key={'fan-' + k} d={`M158,340 C 195,340 200,${RAIL_Y[k]} 232,${RAIL_Y[k]}`} s={C.hairS} w={1.1} />);
	});
	rails.push(<Pa key="fan-tb" d={`M340,${RAIL_Y.teamA} C 362,${RAIL_Y.teamA} 358,${RAIL_Y.teamB} 380,${RAIL_Y.teamB}`} s={C.hairS} w={1.1} />);
	rails.push(<Ci key="switch-dot" c={[158, 340]} r={3.2} f={C.inkStrong} s="none" />);
	(Object.keys(RAIL_Y) as RailId[]).forEach((k) => {
		const endX = k === 'teamB' ? MERGE_X - 40 : MERGE_X;
		rails.push(<Pa key={'mg-' + k} d={`M${endX},${RAIL_Y[k]} C ${MERGE_X + 20},${RAIL_Y[k]} ${MERGE_X - 4},340 ${GATE_X},340`} s={C.hairS} w={1.1} />);
	});

	const gateStates = sc.gates;

	const act: ReactNode[] = [];
	const y0 = RAIL_Y[sc.mode === 'team' ? 'teamA' : sc.mode];
	act.push(<Pa key="a-trunk" d={`M158,340 C 195,340 200,${y0} 232,${y0} L${MERGE_X},${y0} C ${MERGE_X + 20},${y0} ${MERGE_X - 4},340 ${GATE_X},340 L${OUT_X - 8},340`} s={C.accent} w={2} cls={flow} dash="7 6" o={0.95} />);
	if (sc.mode === 'team') {
		act.push(<Pa key="a-tb" d={`M340,${RAIL_Y.teamA} C 362,${RAIL_Y.teamA} 358,${RAIL_Y.teamB} 380,${RAIL_Y.teamB} L${MERGE_X - 40},${RAIL_Y.teamB} C ${MERGE_X + 8},${RAIL_Y.teamB} ${MERGE_X - 10},340 ${GATE_X},340`} s={C.accent} w={1.6} cls={flow} dash="7 6" o={0.75} />);
		[480, 600, 720].forEach((x, i) => {
			act.push(<Ln key={'ct' + i} a={[x, RAIL_Y.teamA + 6]} b={[x, RAIL_Y.teamB - 6]} s={C.gold} w={1.1} dash="2 3" marker={`url(#${A}-arr)`} />);
			act.push(<Ln key={'ct2' + i} a={[x + 14, RAIL_Y.teamB - 6]} b={[x + 14, RAIL_Y.teamA + 6]} s={C.gold} w={1.1} dash="2 3" marker={`url(#${A}-arr)`} />);
		});
		act.push(<Tx key="ctt" x={547} y={(RAIL_Y.teamA + RAIL_Y.teamB) / 2 + 3} t="cross-talk" size={8} fill={C.gold} anchor="middle" />);
	}
	if (sc.node) {
		const node = sc.node;
		act.push(<rect key="nd" x={node.x - 58} y={y0 - 60} width={116} height={26} rx={3} fill={C.paper} style={{ stroke: C.accent }} strokeWidth={1} />);
		act.push(<Tx key="ndt" x={node.x} y={y0 - 49} t={node.t[0]} size={8.5} fill={C.inkStrong} w={600} anchor="middle" />);
		act.push(<Tx key="nds" x={node.x} y={y0 - 39} t={node.t[1]} size={7.5} fill={C.capSoft} anchor="middle" />);
		act.push(<Ln key="ndl" a={[node.x, y0 - 32]} b={[node.x, y0 - 4]} s={C.accent} w={0.8} dash="2 2" />);
		act.push(<Ci key="ndd" c={[node.x, y0]} r={3} f={C.accent} s="none" />);
	}
	sc.drops.forEach((d, i) => {
		const fy = d.fromY || y0;
		const fx = FURN_X[d.furnace];
		const jog = d.fromY ? 524 : Math.min(fy + 26, 524);
		act.push(<Pa key={'dr' + i} d={`M${d.x},${fy} L${d.x},${jog} L${fx},${jog} L${fx},528`} s={C.accentH} w={1.3} dash="3 4" marker={`url(#${A}-arr)`} o={0.9} />);
		act.push(<Ci key={'drd' + i} c={[d.x, fy]} r={2.6} f={C.accentH} s="none" />);
		const lx = d.labelLeft ? d.x - 6 : d.x + 6;
		const lanchor: Anchor = d.labelLeft ? 'end' : 'start';
		const ly = fy + (d.ly || 40);
		act.push(<Tx key={'drt' + i} x={lx} y={ly} t={d.t[0]} size={8.5} fill={C.inkStrong} w={600} anchor={lanchor} />);
		act.push(<Tx key={'drs' + i} x={lx} y={ly + 11} t={d.t[1]} size={7.5} fill={C.accentH} anchor={lanchor} />);
	});
	act.push(<Tx key="gnote" x={1128} y={616} t={sc.gateNote} size={8} fill={C.capSoft} anchor="end" upper={false} />);

	return (
		<svg viewBox="0 0 1140 640" role="img" aria-label="Routing switchyard: a task enters, a switch fans to four orchestration-mode rails, dispatches drop to three model furnaces with effort dials, and every path exits through the phase-boundary gates." style={{ width: '100%', height: 'auto', display: 'block' }}>
			<HatchDefs id={A} />
			<g>{rails}</g>
			<g>
				<rect x={56} y={316} width={102} height={48} rx={4} fill={C.paper} style={{ stroke: C.hairS }} strokeWidth={1} />
				<Tx x={70} y={337} t="task in" size={10} fill={C.inkStrong} w={650} />
				<Tx x={70} y={351} t="the ask" size={8} fill={C.capSoft} />
			</g>
			<g>
				<rect x={OUT_X - 8} y={306} width={106} height={68} rx={4} fill={C.paper} style={{ stroke: C.hairS }} strokeWidth={1} />
				<Tx x={OUT_X + 4} y={328} t="shipped" size={10} fill={C.inkStrong} w={650} />
				<Tx x={OUT_X + 4} y={342} t="commits + PR" size={8} fill={C.capSoft} />
				<Tx x={OUT_X + 4} y={354} t="docs: checkpoint" size={8} fill={C.capSoft} />
				<Tx x={OUT_X + 4} y={366} t="session log" size={8} fill={C.capSoft} />
			</g>
			<g>
				<rect x={GATE_X - 14} y={118} width={132} height={404} rx={6} fill="none" style={{ stroke: C.hair }} strokeWidth={0.8} strokeDasharray="4 4" />
				<Tx x={GATE_X - 4} y={106} t="phase-boundary gates" size={8.5} fill={C.capSoft} w={600} />
				<GateLamp x={GATE_X} y={152} label="compile" sub="green" state={gateStates.compile} />
				<GateLamp x={GATE_X} y={200} label="tests" sub="whole CubbyTests" state={gateStates.tests} />
				<GateLamp x={GATE_X} y={248} label="review" sub="no CRIT/HIGH" state={gateStates.review} />
				<GateLamp x={GATE_X} y={296} label="push gate ▲" sub="block-once" state={gateStates.push} />
				<GateLamp x={GATE_X} y={344} label="log ▲" sub="docs: checkpoint" state={gateStates.log} />
				<Tx x={GATE_X} y={400} t="■ hard · ▲ reminder" size={7.5} fill={C.capFaint} />
			</g>
			<g>
				<Ln a={[240, 596]} b={[860, 596]} s={C.hair} w={0.7} dash="2 4" />
				<Tx x={240} y={628} t="the furnaces — every dispatch sets two knobs: tier + effort" size={8.5} fill={C.capSoft} />
				<Crucible cx={FURN_X.planner} cy={560} name="fable / opus" tier="planner" level={sc.dials.planner} active={sc.dials.planner != null} />
				<Crucible cx={FURN_X.executor} cy={560} name="sonnet" tier="executor" level={sc.dials.executor} active={sc.dials.executor != null} />
				<Crucible cx={FURN_X.chore} cy={560} name="haiku" tier="chore" level={sc.dials.chore} active={sc.dials.chore != null} />
			</g>
			<g>{act}</g>
		</svg>
	);
}

/* ================= card — pills, mode/ask line, detail lines ================= */

interface ScenarioDef { id: ScenarioId; label: string; ask: string; mode: string; lines: string[] }

const DEFS: ScenarioDef[] = [
	{ id: 'fix', label: 'One-line fix', ask: '“BinDetail title is truncated — fix the copy”', mode: 'Solo — orchestrator edits directly, no dispatch ceremony', lines: [
		'session model does it in place · opus / xhigh',
		'guards still fire: guard-generated on the edit, format-file after',
		'smart routing: trivial tier skips heavy review — never a fired gate',
		'commits made? then a docs: checkpoint before the session ends' ] },
	{ id: 'review', label: 'Focused review', ask: '“review this diff before I push”', mode: 'Single agent — one bounded delegation, one perspective', lines: [
		'ecc:swift-reviewer dispatched at sonnet · medium',
		'findings return schema-shaped, anchored file:line — never pasted code',
		'no CRITICAL/HIGH left unfixed before the push gate' ] },
	{ id: 'advisor', label: 'Worker + advisor', ask: '“convinced? call advisor before you commit”', mode: 'Single agent + advisor — worker builds, a stronger reviewer sees the full transcript', lines: [
		'worker executes at its own tier · sonnet 5 here, could be opus on a harder task',
		'advisor() forwards the whole transcript to the stronger model — no re-briefing needed',
		'called before substantive work and again before declaring done, not for a typo fix',
		'this page was built exactly this way: sonnet 5 executor, opus advisor throughout' ] },
	{ id: 'wave', label: '/fix BUG-004 · real wave', ask: '/fix BUG-004 — “barcode lookup silently overwrites the name”', mode: 'Workflow — plan → approval → phases land serially', lines: [
		'plan authored at planner tier · fable/opus · xhigh — then WAITS for approval',
		'implementation is TDD at executor · sonnet · med–high',
		'digests, checklists, sweeps at chore · haiku · low',
		'every phase: compile → whole CubbyTests → reviewer → push → docs: checkpoint' ] },
	{ id: 'audit', label: 'Adversarial audit', ask: '“score the harness against the actual config”', mode: 'Workflow + adversarial verify — the run that scored this page', lines: [
		'6 finder agents fan out · sonnet · medium · schema-shaped returns',
		'synthesis + scoring at planner · opus · high',
		'one hardest verification at fable · max — it refuted 2 draft findings',
		'the 79/100 below came from exactly this shape' ] },
	{ id: 'team', label: 'Agent team', ask: '“implementer + reviewer paired across a long wave”', mode: 'Agent team — long-lived roles, cross-talk, mid-flight steering', lines: [
		'implementer · sonnet · med–high — reviewer · sonnet · medium',
		'roles talk mid-flight; the orchestrator stays planner-tier',
		'reserved for work where interaction matters more than determinism' ] },
];

export default function RoutingCard() {
	const [scenario, setScenario] = useState<ScenarioId>('wave');
	const active = DEFS.find((d) => d.id === scenario) ?? DEFS[2];

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
			<div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
				{DEFS.map((d) => {
					const on = d.id === scenario;
					return (
						<button
							key={d.id}
							type="button"
							onClick={() => setScenario(d.id)}
							className="ds-micro"
							style={{
								cursor: 'pointer',
								padding: '9px 16px',
								borderRadius: 'var(--ds-radius-pill)',
								background: on ? 'color-mix(in srgb, var(--ds-accent) 14%, transparent)' : 'transparent',
								border: `1px solid ${on ? 'var(--ds-accent)' : 'var(--ds-line-strong)'}`,
								color: on ? 'var(--ds-accent)' : 'var(--ds-text-3)',
								letterSpacing: '0.1em',
								transition: 'border-color var(--ds-duration-base) var(--ds-ease-standard)',
							}}
						>
							{d.label}
						</button>
					);
				})}
			</div>
			<article style={{ background: 'var(--ds-surface)', border: '1px solid var(--ds-line)', borderRadius: 'var(--ds-radius-lg)', padding: 'clamp(14px,2.4vw,26px)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'baseline' }}>
					<span className="ds-micro" style={{ color: 'var(--ds-accent-hover)' }}>{active.mode}</span>
					<span className="ds-micro" style={{ color: 'var(--ds-text-faint)', fontStyle: 'italic' }}>{active.ask}</span>
				</div>
				<Switchyard scenario={scenario} />
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(250px,100%),1fr))', gap: '10px 24px', borderTop: '1px solid var(--ds-line)', paddingTop: '14px' }}>
					{active.lines.map((line, i) => (
						<div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
							<span aria-hidden="true" style={{ width: '14px', height: '2px', background: 'var(--ds-accent)', display: 'inline-block', flex: 'none', transform: 'translateY(-3px)' }} />
							<span className="ds-caption" style={{ color: 'var(--ds-text-2)' }}>{line}</span>
						</div>
					))}
				</div>
			</article>
			<p className="ds-caption" style={{ margin: 0, maxWidth: '80ch', color: 'var(--ds-text-3)' }}>
				The rule underneath: pick the cheapest mode that fits, escalate effort one step before tier, and never dispatch with both knobs implicit — an unset knob silently inherits the orchestrator's expensive defaults. Calibration point: one 26-agent review left on inherited defaults cost ~1.8M tokens; the same shape on the matrix runs at a fraction.
			</p>
		</div>
	);
}
