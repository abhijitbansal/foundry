// init.ts — plan Task 6.2. Lazy-load orchestration for the hero scene:
// reduced-motion check (bail, leave the CSS poster), then wait for
// whichever fires first — an idle callback (requestIdleCallback, with a
// setTimeout fallback for Safari) or the hero's first intersection — before
// dynamically importing the self-hosted `three` package (not the CDN URL
// the 2A prototype used) and building the scene. The returned HeroScene is
// stored on `window.__foundryScene` so Nav.astro's theme-toggle handler can
// call `.setTheme()` without a module-scope import cycle.
//
// Canvas fade-in (opacity 0→1, 1400ms) and poster-ring fade-out on first
// rendered frame are handled inside scene.ts's `shownOnce` flag — no
// additional wiring needed here.
//
// No-WebGL / load-failure: both the dynamic `import('three')` and the
// `createHeroScene(...)` call are wrapped in try/catch (the WebGLRenderer
// construction failure is already caught inside `createHeroScene`, which
// returns `null` rather than throwing). On any failure the poster SVG is
// left at full opacity and a `console.warn` is logged — never throws.

import { createHeroScene, type HeroScene } from './scene';

declare global {
	interface Window {
		__foundryScene?: HeroScene;
	}
}

function waitForIdleOrIntersection(hero: Element): Promise<void> {
	return new Promise((resolve) => {
		let settled = false;
		const finish = () => {
			if (settled) return;
			settled = true;
			cancelIdle();
			io.disconnect();
			resolve();
		};

		const w = window as unknown as {
			requestIdleCallback?: (cb: IdleRequestCallback) => number;
			cancelIdleCallback?: (id: number) => void;
		};
		let cancelIdle: () => void;
		if (typeof w.requestIdleCallback === 'function') {
			const id = w.requestIdleCallback(() => finish());
			cancelIdle = () => w.cancelIdleCallback?.(id);
		} else {
			const id = window.setTimeout(finish, 1);
			cancelIdle = () => window.clearTimeout(id);
		}

		const io = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) finish();
			},
			{ threshold: 0 }
		);
		io.observe(hero);
	});
}

export async function initHeroScene(): Promise<void> {
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (reducedMotion) return;

	const mount = document.getElementById('fy-canvas-mount');
	const hero = document.getElementById('top');
	if (!mount || !hero) return;

	await waitForIdleOrIntersection(hero);

	let THREE: typeof import('three');
	try {
		THREE = await import('three');
	} catch (e) {
		console.warn('[foundry] three.js failed to load — poster fallback stays', e);
		return;
	}

	try {
		const scene = createHeroScene(THREE, mount, hero, { reducedMotion });
		if (scene) window.__foundryScene = scene;
	} catch (e) {
		console.warn('[foundry] scene init failed — poster fallback stays', e);
	}
}
