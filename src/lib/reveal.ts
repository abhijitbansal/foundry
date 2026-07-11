// reveal.ts — plan Task 4.2. Ported from 2A source `_setupReveals`
// (Foundry 2A - Crucible Light.dc.html:573-603), minus the
// `setInterval(check, 400)` safety net dropped per Global Constraints.
// Keeps the reduced-motion early return, the initial pending-set
// computation, and the scroll/resize-driven `check()`.

export function initReveals(): void {
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (reduced) return;

	const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
	const pending = new Set<HTMLElement>();

	els.forEach((el) => {
		const r = el.getBoundingClientRect();
		if (r.top < window.innerHeight * 0.96) return;
		el.style.opacity = '0';
		el.style.transform = 'translateY(16px)';
		pending.add(el);
	});

	const reveal = (el: HTMLElement) => {
		el.style.transition = 'opacity 0.75s var(--ds-ease-entrance), transform 0.75s var(--ds-ease-entrance)';
		const done = () => {
			el.style.transition = '';
			el.removeEventListener('transitionend', done);
		};
		el.addEventListener('transitionend', done);
		setTimeout(() => {
			el.style.opacity = '1';
			el.style.transform = 'none';
		}, 20);
	};

	const check = () => {
		if (!pending.size) return;
		const vh = window.innerHeight;
		for (const el of Array.from(pending)) {
			const r = el.getBoundingClientRect();
			if (r.top < vh * 0.92 && r.bottom > 0) {
				pending.delete(el);
				reveal(el);
			}
		}
	};

	window.addEventListener('scroll', check, { passive: true });
	window.addEventListener('resize', check);
	check();
}
