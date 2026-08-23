// craft-content.ts — copy for "The New Craft" (/craft/), lifted verbatim from
// the approved design canvas (.scratch/craft-canvas/Main.dc.html). One entry
// per act; CraftAct.astro renders them. Vignette svg strings come from
// craft-svg.ts — content stays data, drawing stays code.
import {
	buildVigCuriosity,
	buildVigFirstPrinciples,
	buildVigHarness,
	buildVigLimits,
	buildVigOrgDesign,
	buildVigOutcome,
	buildVigSecurity,
	buildVigTester,
} from './craft-svg';

export interface CraftSkill {
	title: string;
	/** Body paragraphs, plain text with optional inline <em>/<a> HTML. */
	bodyHtml: string[];
	/** Italic "manager's margin" note. */
	margin: string;
	/** Pre-built vignette svg string. */
	vignette: string;
	/** Show the ds-micro "The manager's margin" label above the note. */
	showMarginLabel?: boolean;
}

export interface CraftAct {
	id: string;
	kicker: string;
	title: string;
	intro: string;
	skills: CraftSkill[];
}

export function buildCraftActs(harnessHref: string): CraftAct[] {
	return [
		{
			id: 'craft-direct',
			kicker: 'Act I · Direct',
			title: 'Know what right looks like.',
			intro: 'A manager who can’t tell good work from bad can only rubber-stamp. Direction comes before delegation.',
			skills: [
				{
					title: 'First principles',
					bodyHtml: [
						'Agents produce fluent, confident output whether it’s right or wrong. The only defense is understanding the problem from the ground up — the domain, the constraints, the physics of the system. If you can’t derive what the answer should look like, you can’t catch the moment your team drifts. This is the keystone; every other skill on this page leans on it.',
					],
					margin:
						'The leader who understands the business can direct specialists they couldn’t personally replace. The one who doesn’t gets snowed by every status report.',
					vignette: buildVigFirstPrinciples(),
					showMarginLabel: true,
				},
				{
					title: 'Owning the outcome',
					bodyHtml: [
						'Agents don’t carry pagers. Whatever ships, you shipped it. Product judgment — why the work matters, what failure costs, when a human must stay in the loop — can’t be delegated to something that doesn’t bear consequences.',
					],
					margin: 'Accountability is the one thing a manager can never hand down.',
					vignette: buildVigOutcome(),
				},
			],
		},
		{
			id: 'craft-delegate',
			kicker: 'Act II · Delegate',
			title: 'Build the team and its environment.',
			intro: 'Delegation isn’t handing over a task. It’s designing the conditions where the task can’t go quietly wrong.',
			skills: [
				{
					title: 'Design the org, not just the code',
					bodyHtml: [
						'System design now includes deciding what your team looks like: which components and agents exist, what each is responsible for, how work moves between them. Sharp interfaces and precise briefs — schemas, contracts, unambiguous specs — are job descriptions. Vague briefs get confident nonsense back.',
					],
					margin: 'Org design and role clarity. Most team failures are structure failures.',
					vignette: buildVigOrgDesign(),
				},
				{
					title: 'Harness engineering',
					bodyHtml: [
						'Most of what gets listed as separate AI skills — tool design, context quality, retries and timeouts, evals and tracing — is one discipline: engineering the environment your agents work in. Onboarding docs, feedback loops, guardrails, the right tool within reach, honest performance reviews. Metrics, not vibes. This is where the leverage lives.',
						`The harness behind this site is <a href="${harnessHref}" style="color:var(--ds-accent-hover)">documented in full →</a>`,
					],
					margin:
						'A manager’s output is the system around their people. You can’t buy an agent pizza — you can only make its environment better.',
					vignette: buildVigHarness(),
				},
				{
					title: 'Know your agents’ limits',
					bodyHtml: [
						'Delegate what the model is good at; keep what it isn’t; know the difference this month, not last. Limits tell you where to double-check, where to challenge, and where supervision is a waste of your attention.',
					],
					margin:
						'Knowing your people — who’s ready for the stretch assignment, who needs review on everything, who will confidently accept work they can’t do.',
					vignette: buildVigLimits(),
				},
			],
		},
		{
			id: 'craft-verify',
			kicker: 'Act III · Verify',
			title: 'Trust is a process, not a feeling.',
			intro: 'The failure mode of managing agents is the same as managing people: believing the confident report.',
			skills: [
				{
					title: 'Curiosity to challenge',
					bodyHtml: [
						'The best question in the room is still <em>why</em>. Probe the answer, ask for the reasoning, make the design defend itself. Confident output that can’t survive three follow-up questions wasn’t an answer — it was a guess.',
					],
					margin: 'Good managers don’t take the status update at face value. Probing isn’t distrust; it’s the job.',
					vignette: buildVigCuriosity(),
					showMarginLabel: true,
				},
				{
					title: 'The tester’s mindset',
					bodyHtml: [
						'You’re no longer primarily the builder — you’re the one who decides what <em>verified</em> means. Knowing which tests matter is the skill: a test existing proves nothing about whether the behavior is tested. And bad tests aren’t free — every low-quality test is a tax on every future agent run. Tokens burned, loops slowed, signal diluted.',
					],
					margin: 'Acceptance criteria, and inspecting what you expect. A manager who can’t evaluate work ends up managed by it.',
					vignette: buildVigTester(),
				},
				{
					title: 'Security as risk ownership',
					bodyHtml: [
						'Your agents can be socially engineered — that’s what prompt injection is. Input validation, output filtering, least-privilege permissions aren’t compliance chores; they’re the access-control calls any manager makes about who can touch what.',
					],
					margin: 'The manager holds the risk the team can’t. You decide what the intern gets prod access to.',
					vignette: buildVigSecurity(),
				},
			],
		},
	];
}
