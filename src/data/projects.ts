// Project inventory — plan Task 3.4 / 3.4a. Copy transcribed verbatim from
// docs/design/handoff/src/Foundry 2A - Crucible Light.dc.html (lines
// 147-271). Link fields resolved per the Task 3.4a table (gh api + curl -I
// checks on 2026-07-11). Grouping matches the three group headers in the
// 2A source (Apps / AI tooling / Foundation), in source order.
//
// Deviation note (cartoon, claude-skills): the 3.4a table's prose says each
// project's Pages site should render "as the extraLink-style second link,
// same as sift" but leaves the extraLink label unspecified (table cell is
// "—"). Following the sift precedent (`digest ↗`), a `site ↗` label is used
// here as the most literal reading of "same as sift" — flagged as a
// deviation since the plan doesn't spell out the exact string.

import type { Project } from './projects.types';

export const appsProjects: Project[] = [
	{
		name: 'Cubby',
		status: 'active',
		blurb:
			"Inventory for garage and basement storage. NFC tags and QR labels on racks and bins — scan to see what's inside. On-device Vision suggests item names; 3D rack view, widgets, Siri. Zero backend, zero third-party dependencies.",
		tech: 'iOS · Swift 6 · SwiftUI · SwiftData',
		siteUrl: 'https://gotcubby.com',
		siteLabel: 'gotcubby.com ↗',
		private: false,
	},
	{
		name: 'Paperix',
		status: 'active',
		blurb:
			'Document scanner that makes searchable PDFs with on-device OCR. No cloud, no accounts, no subscription — built because PDF-scanner apps shouldn\'t be rent.',
		tech: 'iOS · Swift · Vision OCR',
		siteUrl: 'https://abhijitbansal.github.io/paperix-site/',
		siteLabel: 'paperix-site ↗',
		private: false,
	},
	{
		name: 'Floorprint',
		status: 'active',
		blurb:
			'Scan rooms with LiDAR and RoomPlan into editable 2D floor plans. Export PDF, DXF, USDZ, GLB, STEP; a macOS mini-CAD editor for the rest. Organize the whole home in 3D.',
		tech: 'iOS + macOS · RoomPlan · SceneKit',
		siteUrl: 'https://abhijitbansal.github.io/floorprint-site/',
		siteLabel: 'floorprint-site ↗',
		private: false,
	},
	{
		name: 'Folix',
		status: 'active',
		blurb:
			'Privacy-first wealth dashboard: local Plaid pulls, on-device storage, AI-augmented insights. The seed of a personal financial adviser.',
		tech: 'macOS · Swift · GRDB · Plaid',
		private: true,
	},
];

export const aiToolingProjects: Project[] = [
	{
		name: 'cartoon',
		status: 'active',
		blurb:
			'Token-optimized CLI output for AI agents — read 12 lines instead of 800, raw logs archived. Adapters for pytest, jest, eslint, tsc; ~70% token reduction.',
		tech: 'Rust · open source',
		repoUrl: 'https://github.com/abhijitbansal/cartoon',
		extraLink: { url: 'https://abhijitbansal.github.io/cartoon/', label: 'site ↗' },
		private: false,
	},
	{
		name: 'claude-skills',
		status: 'active',
		blurb:
			'Skills, plugins, and agent tooling for Claude Code: iOS build loops, PM automation, prompt refinement. Installable via marketplace or standalone CLI.',
		tech: 'Python · Shell · open source',
		repoUrl: 'https://github.com/abhijitbansal/claude-skills',
		extraLink: { url: 'https://abhijitbansal.github.io/claude-skills/', label: 'site ↗' },
		private: false,
	},
	{
		name: 'sift',
		status: 'active',
		blurb:
			'Weekly AI-news pipeline: RSS ingestion, local dedup, one Claude call to curate everything into an HTML digest and a Pages archive.',
		tech: 'Python · Claude API · open source',
		repoUrl: 'https://github.com/abhijitbansal/sift',
		extraLink: { url: 'https://abhijitbansal.github.io/sift/', label: 'digest ↗' },
		private: false,
	},
	{
		name: 'memekit',
		status: 'recently-active',
		blurb:
			'Deterministic ASCII meme reactions for CLIs, bots, and agents. 45 original formats, zero dependencies — library, CLI, and MCP server.',
		tech: 'TypeScript · MCP',
		private: true,
	},
];

export const foundationProjects: Project[] = [
	{
		name: 'design-system',
		status: 'active',
		blurb:
			'Cross-product design tokens: one source emitting CSS custom properties, SwiftUI tokens, and Tailwind presets for every app and site in the fleet — including this one.',
		tech: 'JSON tokens · CSS · Swift · Tailwind',
		private: true,
	},
];
