// Harness page v2 delta dataset — plan docs/plans/2026-07-18-harness-page-v2.md Task 1.1.
// Refreshed by hand from cubby docs/harness + AGENTS.md, s56/s57 wave 2026-07-18.
// Private repo — see AGENTS.md content-exception. No runtime fetch.

import type { DeltaItem, HarnessScalars } from './harness.types';

export const SCALARS: HarnessScalars = {
	score: 79,
	scorePrev: 73,
	scoreAsOf: '2026-07-12',
	agentsKb: '67.3 KB',
	agentsLines: 332,
	plugins: 17,
	skills: 114,
	agents: 81,
	hooks: 43,
	skillsInstalled: '~360+',
	deltaWaveDate: '2026-07-18',
};

export const DELTA_ITEMS: DeltaItem[] = [
	{
		badge: 'NEW',
		wave: 's56',
		title: 'A commit-on-main reminder that knows when to shut up.',
		body: "bash-guard.sh now block-once-reminds on git commit to main/master; an identical retry passes — because /release legitimately commits on main.",
		ref: 'bash-guard.sh',
	},
	{
		badge: 'NEW',
		wave: 's56',
		title: 'Catches the chained command that silently did nothing.',
		body: "guard-push-gate.sh now warns when a chained add && commit && push didn't actually run — the s48 silent-commit-loss bug class, now caught.",
		ref: 'guard-push-gate.sh',
	},
	{
		badge: 'RULE',
		wave: 's56',
		title: 'Claim your session number before you touch anything.',
		body: 'New protocol: fetch origin, scan every branch for higher session numbers, push the session-log stub as the first commit — after parallel worktrees raced the naive counter and collided at least 8 times. Ironically the wave that shipped the fix collided too (55→56) — the protocol landed mid-wave, too late for its own claim.',
	},
	{
		badge: 'RETIRED',
		wave: 's45→s56',
		title: 'The metrics rig came out; a new anti-pattern went in.',
		body: 'The whole s45 token/metrics-capture hook system was deleted; the design doc is now a record of a retired system. Canonical example of "instrument-now-mine-later" — any new capture system now needs a stated mining plan and a decision date before it gets built.',
		ref: 'HARNESS_METRICS.md',
	},
	{
		badge: 'CLOSED',
		wave: 's57',
		title: 'A plausible idea, turned down on the record.',
		body: "A probe confirmed Claude Code's native path-scoped rule frontmatter does reach specialist reviewer subagents — but a reviewer flagged the probe rule itself as a prompt-injection vector. Decision: close, no migration, no mirroring. The harness catching a good-looking-but-risky idea and declining it.",
	},
	{
		badge: 'APPLIED',
		wave: 's56',
		title: 'The repo now carries its own rulebook.',
		body: "Every Cubby-relevant rule was mirrored from the operator's global config into the project's own AGENTS.md, verbatim — a fresh clone now enforces the full ruleset without depending on a home-directory config.",
	},
	{
		badge: 'NEW',
		wave: 's56',
		title: 'Reviews that widen where the risk is.',
		body: 'Wave-end review now adds a design-vs-original-brief comparison pass, escalating review rounds for anything touching the data model or save-sync path, and a final pass scoped to the whole wave’s diff rather than per-phase.',
	},
	{
		badge: 'RULE',
		wave: 's56',
		title: 'Two hook facts, now written down.',
		body: "Hooks must live committed in the repo — a fresh worktree silently loses enforcement otherwise. And hook edits don't hot-reload mid-session; the running session keeps the pre-edit version until restart.",
	},
	{
		badge: 'CHANGED',
		wave: 's56',
		title: 'The arsenal grew and got counted honestly.',
		body: "The source repo's own banner now reads 17 plugins · 114 skills · 81 agents · 43 hooks — with the explicit caveat that this is the enabled subset of a much larger installed surface. Plugins moved 13→17 since this page was built.",
	},
	{
		badge: 'CHANGED',
		wave: 's56',
		title: 'The backlog got some real housekeeping.',
		body: 'The tracker’s archive pipeline was fixed and actually run — 63 stuck items archived, the active ledger down to 649 lines. The ledger figure below still draws the frozen 07-13 backlog snapshot — the cleanup happened after that drawing was made.',
		ref: 'TRACKER.md',
	},
	{
		badge: 'NOTE',
		wave: 's56',
		title: 'Even the source doc has the bug this page warns about.',
		body: 'The reference explainer’s own hero still hardcodes an old date and score while its body carries newer edits — a datestamp that quietly stopped matching its content. It’s the exact staleness trap this section exists to avoid, which is why this copy carries no "current as of" date.',
	},
];
