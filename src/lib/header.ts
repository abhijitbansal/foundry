// header.ts — plan Task 4.1. Ported from 2A source `_setupHeader`
// (Foundry 2A - Crucible Light.dc.html:544-554): toggles #fy-headerbg's
// opacity once window.scrollY crosses 14px, on scroll.

export function initHeaderBlur(): () => void {
	const bg = document.getElementById('fy-headerbg');
	if (!bg) return () => {};

	let last: boolean | null = null;
	const apply = () => {
		const s = window.scrollY > 14;
		if (s !== last) {
			last = s;
			bg.style.opacity = s ? '1' : '0';
		}
	};

	window.addEventListener('scroll', apply, { passive: true });
	apply();

	return () => window.removeEventListener('scroll', apply);
}
