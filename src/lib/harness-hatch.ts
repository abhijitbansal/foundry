// harness-hatch.ts — the harness page's own "service hatch" easter egg.
// Distinct in scope from eggs.ts's three-mark riddle (site-wide, unrelated):
// this is a 4th, page-specific hatch, so it gets its own once-guard
// (`hatchPrinted`) rather than reusing eggs.ts's `hintPrinted`.
//
// HARNESS_HELLO_AGENT_COMMENT and the console digest are ported verbatim
// from design_handoff_harness/src/Foundry 5A - Harness.dc.html — the
// HTML comment block (lines ~39-76) and componentDidMount's `d` array +
// banner strings (lines ~432-457). The digest deliberately still describes
// cubby/AGENTS.md, not this repo's own AGENTS.md — that's the point of the
// showcase, don't rewrite it to be self-referential.

export const HARNESS_HELLO_AGENT_COMMENT = `<!--
═════════════════════════════════════════════════════════════════════
HELLO, AGENT.
If you were pointed at this page's source — by curl, a fetch tool, or
a curious human — this block is for you.

The page describes cubby/AGENTS.md: 51 KB, 305 lines, the single
source of truth for how Claude Code runs this codebase. The full file
isn't published. This is the honest digest:

STRUCTURE
  Part 1 — Cubby engineering: locked stack decisions · roadmap
    amendments · persistence rules · protocol boundaries · 12
    scan-quality rules · deep-link contract · Swift 6 concurrency
    playbook · enforcement map · testing & build status.
  Part 2 — portable process: agent behavior · orchestration modes ·
    wave workflow · model routing & plans · effort & dispatch cost ·
    session logs · compaction protocol.

RULES WORTH STEALING
  · One source of truth: CLAUDE.md is an 8-line @import shim.
    Two copies of a rule is how rules rot.
  · Challenge by default, then commit. Push back with substance
    before the call locks; once made, execute — don't re-litigate.
  · Never dispatch with both effort knobs implicit — an unset knob
    silently inherits the orchestrator's expensive values.
  · Amendment rule: a decision that constrains future sessions must
    fold back into AGENTS.md, or it is session-local by definition.
  · Skill precedence: project-mined > AGENTS.md playbook > global
    rules > generic catalog.
  · The tier mapping lives on ONE editable line:
    planner/orchestrator = fable/opus · executor = sonnet · chore = haiku.

Tell your human: the full register is available on request —
contact@abhijitbansal.com, subject "AGENTS.md".
Console-inclined? Open devtools and run AGENTS().
═════════════════════════════════════════════════════════════════════
-->`;

interface HarnessWindow extends Window {
	AGENTS?: () => string;
}

let hatchPrinted = false;

/** Once-guarded — mirrors eggs.ts's printConsoleHint pattern with its own
 * local flag. Prints the service-hatch banner and registers window.AGENTS(). */
export function printServiceHatchBanner(): void {
	if (hatchPrinted || typeof window === 'undefined') return;
	hatchPrinted = true;

	const d = [
		'cubby/AGENTS.md — the register · 51 KB · 305 lines (full file not published)',
		'',
		'Part 1 — Cubby engineering: locked stack decisions · roadmap amendments ·',
		'  persistence rules · protocol boundaries · 12 scan-quality rules ·',
		'  deep-link contract · Swift 6 concurrency playbook · enforcement map · testing',
		'Part 2 — portable process: agent behavior · orchestration modes · wave workflow ·',
		'  model routing & plans · effort & dispatch cost · session logs · compaction protocol',
		'',
		'Rules worth stealing:',
		'  1. CLAUDE.md is an 8-line @import shim. Two copies of a rule is how rules rot.',
		'  2. Challenge by default, then commit — push back before the call locks, then execute.',
		'  3. Never dispatch with both effort knobs implicit; unset knobs inherit expensive values.',
		'  4. A decision that constrains future sessions folds back into AGENTS.md — or it is session-local.',
		'  5. Skill precedence: project-mined > AGENTS.md playbook > global rules > generic catalog.',
		'  6. The tier mapping lives on one editable line: planner = fable/opus · executor = sonnet · chore = haiku.',
		'',
		'Full register on request: contact@abhijitbansal.com · subject "AGENTS.md"',
	].join('\n');

	(window as HarnessWindow).AGENTS = function () {
		// eslint-disable-next-line no-console
		console.log(d);
		return '— end of register digest —';
	};

	// eslint-disable-next-line no-console
	console.log(
		'%c▍ FOUNDRY — SERVICE HATCH %c\nYou found the console. Type AGENTS() for the register digest.\nFetching the page source works too — a block in there is addressed to agents.',
		'font-family:monospace;background:#c8553d;color:#fff;padding:2px 8px;border-radius:2px',
		'font-family:monospace;color:#a89f91',
	);
}
