// tilt.ts — plan Task 4.3. Verbatim-logic port of 2A source `_setupTilt`
// (Foundry 2A - Crucible Light.dc.html:605-632): reduced-motion + fine-pointer
// guards, rAF-throttled perspective tilt transform, 380ms spring-back on leave.

export function initTilt(): void {
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (reduced) return;
	if (!window.matchMedia('(pointer: fine)').matches) return;

	const cards = Array.from(document.querySelectorAll<HTMLElement>('.fy-tilt'));

	cards.forEach((card) => {
		let raf = 0;

		const move = (e: PointerEvent) => {
			const r = card.getBoundingClientRect();
			const px = (e.clientX - r.left) / r.width - 0.5;
			const py = (e.clientY - r.top) / r.height - 0.5;
			if (raf) return;
			raf = requestAnimationFrame(() => {
				raf = 0;
				card.style.transition = 'border-color var(--ds-duration-base) var(--ds-ease-standard)';
				card.style.transform =
					'perspective(760px) rotateX(' +
					(py * -3).toFixed(2) +
					'deg) rotateY(' +
					(px * 3.6).toFixed(2) +
					'deg) translateY(-2px)';
			});
		};

		const leave = () => {
			if (raf) {
				cancelAnimationFrame(raf);
				raf = 0;
			}
			card.style.transition = 'transform 380ms var(--ds-ease-entrance), border-color var(--ds-duration-base) var(--ds-ease-standard)';
			card.style.transform = '';
		};

		card.addEventListener('pointermove', move);
		card.addEventListener('pointerleave', leave);
	});
}
