// harness-fullscreen.ts — figure-agnostic fullscreen for The Harness page.
// Moves the real DOM node (not a clone) into #harness-fs-overlay so the
// Switchyard's live React island survives the trip; the four static SVG
// figures move through the same code path. CSS overlay, not
// Element.requestFullscreen — that API is historically unsupported for
// non-video elements on iOS Safari, which would silently no-op on exactly
// the mobile case this exists for. Markup for the overlay lives in
// harness.astro (#harness-fs-overlay/#harness-fs-stage/#harness-fs-tabs);
// this only wires it up.

const ZOOM_LEVELS = [1, 1.5, 2, 2.5, 3];

export function initHarnessFullscreen(): void {
	const overlay = document.getElementById('harness-fs-overlay');
	const stage = document.getElementById('harness-fs-stage');
	const tabsEl = document.getElementById('harness-fs-tabs');
	const closeBtn = document.getElementById('harness-fs-close');
	const zoomOutBtn = document.getElementById('harness-fs-zoom-out') as HTMLButtonElement | null;
	const zoomInBtn = document.getElementById('harness-fs-zoom-in') as HTMLButtonElement | null;
	const zoomLevelEl = document.getElementById('harness-fs-zoom-level');
	const figures = Array.from(document.querySelectorAll<HTMLElement>('[data-harness-figure]'));
	if (!overlay || !stage || !tabsEl || !closeBtn || !zoomOutBtn || !zoomInBtn || !zoomLevelEl || figures.length === 0) return;

	const placeholders = new Map<HTMLElement, Comment>();
	const triggers = new Map<HTMLElement, HTMLButtonElement>();
	let activeIndex: number | null = null;
	let zoomIndex = 0;

	function applyZoom(): void {
		const level = ZOOM_LEVELS[zoomIndex];
		stage!.style.setProperty('--harness-fs-zoom', String(level));
		zoomLevelEl!.textContent = `${Math.round(level * 100)}%`;
		zoomOutBtn!.disabled = zoomIndex === 0;
		zoomInBtn!.disabled = zoomIndex === ZOOM_LEVELS.length - 1;
	}

	function resetZoom(): void {
		zoomIndex = 0;
		applyZoom();
	}

	function moveOut(i: number): void {
		const fig = figures[i];
		const placeholder = document.createComment('harness-fs-placeholder');
		fig.before(placeholder);
		placeholders.set(fig, placeholder);
		fig.classList.add('harness-fs-active');
		stage!.appendChild(fig);
	}

	function moveBack(i: number): void {
		const fig = figures[i];
		fig.classList.remove('harness-fs-active');
		placeholders.get(fig)?.replaceWith(fig);
		placeholders.delete(fig);
	}

	// aria-modal="true" is a contract, not just a label — without this, Tab
	// walks straight out of the overlay into the rest of the page (the other
	// 4 figures' own fullscreen triggers, Nav, Footer), which a screen-reader
	// user has no way to know happened. inert is the modern, native way to
	// enforce it: everything outside the dialog becomes unfocusable and
	// unreachable by assistive tech, no manual Tab-cycle-trapping needed.
	function setBackgroundInert(value: boolean): void {
		Array.from(document.body.children).forEach((child) => {
			if (child === overlay) return;
			if (value) child.setAttribute('inert', '');
			else child.removeAttribute('inert');
		});
	}

	function open(i: number): void {
		if (activeIndex !== null) moveBack(activeIndex);
		moveOut(i);
		activeIndex = i;
		tabs.forEach((t, ti) => t.setAttribute('aria-current', String(ti === i)));
		resetZoom();
		overlay!.hidden = false;
		setBackgroundInert(true);
		document.body.style.overflow = 'hidden';
		stage!.scrollTop = 0;
		stage!.scrollLeft = 0;
		closeBtn!.focus();
	}

	function close(): void {
		if (activeIndex === null) return;
		const trigger = triggers.get(figures[activeIndex]);
		moveBack(activeIndex);
		activeIndex = null;
		overlay!.hidden = true;
		setBackgroundInert(false);
		document.body.style.overflow = '';
		trigger?.focus();
	}

	figures.forEach((fig, i) => {
		const trigger = document.createElement('button');
		trigger.type = 'button';
		trigger.className = 'harness-fs-trigger';
		trigger.setAttribute('aria-label', `View ${fig.dataset.harnessFigure} fullscreen — easier to read`);
		trigger.textContent = '⤢ Fullscreen — easier to read';
		trigger.addEventListener('click', () => open(i));
		fig.appendChild(trigger);
		triggers.set(fig, trigger);

		const tab = document.createElement('button');
		tab.type = 'button';
		tab.className = 'harness-fs-tab';
		tab.textContent = fig.dataset.harnessFigure ?? `Figure ${i + 1}`;
		tab.addEventListener('click', () => open(i));
		tabsEl!.appendChild(tab);
	});
	const tabs = Array.from(tabsEl.children) as HTMLButtonElement[];

	closeBtn.addEventListener('click', close);
	overlay.addEventListener('click', (e) => {
		if (e.target === overlay) close();
	});
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && activeIndex !== null) close();
	});
	zoomInBtn.addEventListener('click', () => {
		zoomIndex = Math.min(zoomIndex + 1, ZOOM_LEVELS.length - 1);
		applyZoom();
	});
	zoomOutBtn.addEventListener('click', () => {
		zoomIndex = Math.max(zoomIndex - 1, 0);
		applyZoom();
	});
	applyZoom();
}
