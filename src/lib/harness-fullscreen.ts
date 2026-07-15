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
	const rotateHint = document.getElementById('harness-fs-rotate-hint');
	const rotateHintDismissBtn = document.getElementById('harness-fs-rotate-hint-dismiss');
	const barCollapsible = document.getElementById('harness-fs-bar-collapsible');
	const figures = Array.from(document.querySelectorAll<HTMLElement>('[data-harness-figure]'));
	if (!overlay || !stage || !tabsEl || !closeBtn || !zoomOutBtn || !zoomInBtn || !zoomLevelEl || !barCollapsible || figures.length === 0) return;

	const placeholders = new Map<HTMLElement, Comment>();
	const triggers = new Map<HTMLElement, HTMLButtonElement>();
	let activeIndex: number | null = null;
	let zoomIndex = 0;
	let rotateHintDismissed = false;

	// iOS Safari never implements screen.orientation.lock() (and this overlay
	// is deliberately not the native Fullscreen API, so even Android's
	// Chrome-only lock support wouldn't apply here — see file header). A hint
	// works identically on every browser instead of doing nothing on most of
	// them. (hover: none) and (pointer: coarse) scope it to touch devices so
	// a narrow desktop window doesn't trigger it.
	const portraitTouchQuery = window.matchMedia('(orientation: portrait) and (hover: none) and (pointer: coarse)');

	function updateRotateHint(): void {
		if (!rotateHint) return;
		rotateHint.hidden = !(activeIndex !== null && portraitTouchQuery.matches && !rotateHintDismissed);
	}

	portraitTouchQuery.addEventListener('change', updateRotateHint);
	rotateHintDismissBtn?.addEventListener('click', () => {
		rotateHintDismissed = true;
		updateRotateHint();
	});

	// Landscape on a phone is short — the bar (tabs/zoom), left in normal
	// flow, was never given back that height, so it ate a real chunk of the
	// one orientation this page's zoom feature exists for. Nothing caught it
	// before because prior verification passes only tested 390x844 portrait
	// and desktop widths, never physical landscape rotation. Compact mode:
	// on touch devices in landscape, tabs+zoom float over the stage and
	// collapse by default so the diagram reclaims the space; tapping the
	// stage (or the now-transparent bar strip, but not one of the figure's
	// own interactive controls) reveals them again. Close deliberately stays
	// OUTSIDE the collapsible group and always visible/focusable — without an
	// always-reachable close, tap-to-reveal would be the ONLY way out of
	// fullscreen on a device with no Escape key, i.e. a trap.
	const landscapeTouchQuery = window.matchMedia('(orientation: landscape) and (hover: none) and (pointer: coarse)');
	let barCollapsed = false;

	function setBarCollapsed(collapsed: boolean): void {
		barCollapsed = collapsed;
		barCollapsible!.classList.toggle('harness-fs-bar-hidden', collapsed);
		barCollapsible!.toggleAttribute('inert', collapsed);
	}

	function updateCompactClass(): void {
		overlay!.classList.toggle('harness-fs-compact', landscapeTouchQuery.matches);
	}

	// Covers both directions: rotating while already open, AND opening while
	// the device is already in landscape (open() calls this too) — a fixed
	// hide-on-rotate-event-only would miss the latter entirely.
	landscapeTouchQuery.addEventListener('change', (e) => {
		updateCompactClass();
		if (activeIndex === null) return;
		setBarCollapsed(e.matches);
	});

	stage.addEventListener('click', (e) => {
		if (!overlay!.classList.contains('harness-fs-compact')) return;
		const target = e.target as HTMLElement;
		if (target.closest('button, a, [role="button"]')) return;
		setBarCollapsed(!barCollapsed);
	});

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
		rotateHintDismissed = false;
		updateRotateHint();
		updateCompactClass();
		setBarCollapsed(landscapeTouchQuery.matches);
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
		updateRotateHint();
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
