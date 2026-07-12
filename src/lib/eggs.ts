// eggs.ts — shared runtime for the three hidden easter eggs (touchmark,
// working drawings, night whistle). Synth functions are ported verbatim
// from design_handoff_eggs/src/Foundry 4A - Easter Eggs.dc.html — the
// frequencies/gains/envelopes are tuned, don't touch them. Everything here
// is client-only (imported from inline <script> modules); there is no
// server/build-time usage.

type HoldChange = (holding: boolean) => void;
type DrawingsListener = (open: boolean) => void;

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
	if (typeof window === 'undefined') return null;
	const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
	if (!AC) return null;
	if (!ctx) ctx = new AC();
	if (ctx.state === 'suspended') ctx.resume();
	return ctx;
}

let noiseBuffer: AudioBuffer | null = null;
let noiseBufferCtx: AudioContext | null = null;

function noise(c: AudioContext): AudioBuffer {
	if (!noiseBuffer || noiseBufferCtx !== c) {
		const buf = c.createBuffer(1, Math.floor(c.sampleRate * 0.3), c.sampleRate);
		const data = buf.getChannelData(0);
		for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
		noiseBuffer = buf;
		noiseBufferCtx = c;
	}
	return noiseBuffer;
}

/** Egg 1 — one hammer-blow ring, step 0/1/2 rising in pitch. */
export function tink(step: number): void {
	const c = audio();
	if (!c) return;
	const t = c.currentTime + 0.01;
	const base = [1568, 1760, 1976][Math.min(step, 2)];
	([
		[base, 0.09],
		[base * 1.503, 0.045],
		[base * 2.39, 0.025],
	] as const).forEach(([f, v], i) => {
		const o = c.createOscillator();
		const g = c.createGain();
		o.type = 'sine';
		o.frequency.value = f;
		g.gain.setValueAtTime(0.0001, t);
		g.gain.exponentialRampToValueAtTime(v, t + 0.006);
		g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26 + i * 0.06);
		o.connect(g);
		g.connect(c.destination);
		o.start(t);
		o.stop(t + 0.5);
	});
	const ns = c.createBufferSource();
	ns.buffer = noise(c);
	const hp = c.createBiquadFilter();
	hp.type = 'highpass';
	hp.frequency.value = 4000;
	const ng = c.createGain();
	ng.gain.setValueAtTime(0.04, t);
	ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
	ns.connect(hp);
	hp.connect(ng);
	ng.connect(c.destination);
	ns.start(t);
	ns.stop(t + 0.05);
}

/** Egg 1 — the third-strike stamp thud. */
export function stampThud(): void {
	const c = audio();
	if (!c) return;
	const t = c.currentTime + 0.01;
	const o = c.createOscillator();
	const g = c.createGain();
	o.type = 'sine';
	o.frequency.setValueAtTime(120, t);
	o.frequency.exponentialRampToValueAtTime(48, t + 0.22);
	g.gain.setValueAtTime(0.0001, t);
	g.gain.exponentialRampToValueAtTime(0.28, t + 0.012);
	g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
	o.connect(g);
	g.connect(c.destination);
	o.start(t);
	o.stop(t + 0.4);
	const ns = c.createBufferSource();
	ns.buffer = noise(c);
	const f = c.createBiquadFilter();
	f.type = 'lowpass';
	f.frequency.value = 260;
	const ng = c.createGain();
	ng.gain.setValueAtTime(0.16, t);
	ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
	ns.connect(f);
	f.connect(ng);
	ng.connect(c.destination);
	ns.start(t);
	ns.stop(t + 0.15);
}

/** Egg 2 — pencil-slide open/close toggle. */
export function shhk(open: boolean): void {
	const c = audio();
	if (!c) return;
	const t = c.currentTime + 0.01;
	const ns = c.createBufferSource();
	ns.buffer = noise(c);
	const f = c.createBiquadFilter();
	f.type = 'bandpass';
	f.Q.value = 0.9;
	f.frequency.setValueAtTime(open ? 900 : 2200, t);
	f.frequency.exponentialRampToValueAtTime(open ? 2600 : 700, t + 0.22);
	const g = c.createGain();
	g.gain.setValueAtTime(0.0001, t);
	g.gain.exponentialRampToValueAtTime(0.055, t + 0.03);
	g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
	ns.connect(f);
	f.connect(g);
	g.connect(c.destination);
	ns.start(t);
	ns.stop(t + 0.3);
}

/** Egg 3 — two-tone steam whistle; `dusk` true = night falls, false = dawn. */
export function whistle(dusk: boolean): void {
	const c = audio();
	if (!c) return;
	const t = c.currentTime + 0.02;
	const master = c.createGain();
	master.gain.value = 1;
	const lp = c.createBiquadFilter();
	lp.type = 'lowpass';
	lp.frequency.value = 1500;
	master.connect(lp);
	lp.connect(c.destination);
	const dly = c.createDelay(0.6);
	dly.delayTime.value = 0.23;
	const fb = c.createGain();
	fb.gain.value = 0.32;
	const wet = c.createGain();
	wet.gain.value = 0.45;
	lp.connect(dly);
	dly.connect(fb);
	fb.connect(dly);
	dly.connect(wet);
	wet.connect(c.destination);
	const o = c.createOscillator();
	o.type = 'triangle';
	const lfo = c.createOscillator();
	lfo.frequency.value = 5.2;
	const lg = c.createGain();
	lg.gain.value = 6;
	lfo.connect(lg);
	lg.connect(o.frequency);
	const g = c.createGain();
	o.connect(g);
	g.connect(master);
	if (dusk) {
		o.frequency.setValueAtTime(740, t);
		g.gain.setValueAtTime(0.0001, t);
		g.gain.exponentialRampToValueAtTime(0.08, t + 0.09);
		o.frequency.setValueAtTime(740, t + 0.5);
		o.frequency.exponentialRampToValueAtTime(587, t + 0.58);
		g.gain.setValueAtTime(0.08, t + 0.75);
		g.gain.exponentialRampToValueAtTime(0.0001, t + 1.25);
		o.start(t);
		o.stop(t + 1.35);
		lfo.start(t);
		lfo.stop(t + 1.35);
	} else {
		o.frequency.setValueAtTime(784, t);
		g.gain.setValueAtTime(0.0001, t);
		g.gain.exponentialRampToValueAtTime(0.075, t + 0.06);
		g.gain.setValueAtTime(0.075, t + 0.32);
		g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
		o.start(t);
		o.stop(t + 0.7);
		lfo.start(t);
		lfo.stop(t + 0.7);
	}
}

/** Computed once at module load — matches the reference's mount-time read. */
export const reducedMotion: boolean =
	typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let hintPrinted = false;

/** The riddle — printed once per page load regardless of how many eggs call it. */
export function printConsoleHint(): void {
	if (hintPrinted || typeof window === 'undefined') return;
	hintPrinted = true;
	// eslint-disable-next-line no-console
	console.log(
		'%c⚒ THE FOUNDRY %c— three marks are hidden in these works.%c\n\n   I.   the smith strikes thrice, where the metal is teal\n   II.  the working drawings are filed under P·L·A·N·S\n   III. hold the yard until the whistle blows\n',
		'font-family:monospace;font-weight:700;color:#0E8FB0',
		'font-family:monospace;color:#736A59',
		'font-family:monospace;color:#B07A18',
	);
}

export function readFlag(key: string): boolean {
	if (typeof window === 'undefined') return false;
	try {
		return window.sessionStorage.getItem(key) === '1';
	} catch {
		return false;
	}
}

export function writeFlag(key: string, value: boolean): void {
	if (typeof window === 'undefined') return;
	try {
		window.sessionStorage.setItem(key, value ? '1' : '0');
	} catch {
		// Private-mode sessionStorage can throw on write — the egg still
		// works for the tab's lifetime, it just won't survive a reload.
	}
}

/** Long-press helper — pointerdown/up/leave/cancel + contextmenu guard,
 * matching the reference's startHold/cancelHold. One instance per hold
 * target (footer anvil has none; the pill and the yard each get their own),
 * so concurrent holds on different elements never interfere. */
export function wireHold(el: HTMLElement, ms: number, onComplete: () => void, onHoldChange?: HoldChange): () => void {
	let timer: ReturnType<typeof setTimeout> | null = null;
	const end = () => {
		if (timer === null) return;
		clearTimeout(timer);
		timer = null;
		onHoldChange?.(false);
	};
	const start = (e: PointerEvent) => {
		e.preventDefault();
		onHoldChange?.(true);
		timer = setTimeout(() => {
			timer = null;
			onHoldChange?.(false);
			onComplete();
		}, ms);
	};
	const prevent = (e: Event) => e.preventDefault();
	el.addEventListener('pointerdown', start);
	el.addEventListener('pointerup', end);
	el.addEventListener('pointerleave', end);
	el.addEventListener('pointercancel', end);
	el.addEventListener('contextmenu', prevent);
	return () => {
		end();
		el.removeEventListener('pointerdown', start);
		el.removeEventListener('pointerup', end);
		el.removeEventListener('pointerleave', end);
		el.removeEventListener('pointercancel', end);
		el.removeEventListener('contextmenu', prevent);
	};
}

/** Site-wide `plans` key buffer + Esc — 5-key window, 2.2s timeout, ignores
 * inputs/contenteditable/modified keys, matching the reference's _onKey. */
export function wireGlobalHotkeys(onPlans: () => void, onEscape: () => void): () => void {
	let buf = '';
	let lastKey = 0;
	const handler = (e: KeyboardEvent) => {
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		const target = e.target as HTMLElement | null;
		const tag = target?.tagName ?? '';
		if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
		if (e.key === 'Escape') {
			onEscape();
			return;
		}
		if (typeof e.key === 'string' && e.key.length === 1) {
			const now = Date.now();
			if (now - lastKey > 2200) buf = '';
			lastKey = now;
			buf = (buf + e.key.toLowerCase()).slice(-5);
			if (buf === 'plans') {
				buf = '';
				onPlans();
			}
		}
	};
	window.addEventListener('keydown', handler);
	return () => window.removeEventListener('keydown', handler);
}

/** Egg 2 shared state — the pill (Hero.astro) and the site-wide keydown
 * buffer (BaseLayout) both need to flip the same overlay, so the toggle and
 * its "is it open" state live here instead of in either component. Modules
 * are singletons per page load, so every importer sees the same state. */
let drawingsOpen = false;
const drawingsListeners = new Set<DrawingsListener>();

export function isDrawingsOpen(): boolean {
	return drawingsOpen;
}

export function onDrawingsChange(fn: DrawingsListener): () => void {
	drawingsListeners.add(fn);
	return () => drawingsListeners.delete(fn);
}

export function toggleDrawings(): void {
	drawingsOpen = !drawingsOpen;
	shhk(drawingsOpen);
	writeFlag('fy-drawings', drawingsOpen);
	drawingsListeners.forEach((fn) => fn(drawingsOpen));
}

export function closeDrawings(): void {
	if (drawingsOpen) toggleDrawings();
}

/** Instant restore on load — no sound, no animation, it's a resume not a trigger. */
export function restoreDrawings(): void {
	drawingsOpen = readFlag('fy-drawings');
	drawingsListeners.forEach((fn) => fn(drawingsOpen));
}
