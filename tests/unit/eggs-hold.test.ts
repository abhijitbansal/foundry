import { describe, it, expect, vi, afterEach } from 'vitest';
import { wireHold } from '../../src/lib/eggs';

function press(target: Element): void {
	const ev = new Event('pointerdown', { bubbles: true, cancelable: true }) as Event & { pointerId: number };
	ev.pointerId = 1;
	target.dispatchEvent(ev);
}

describe('wireHold', () => {
	afterEach(() => {
		vi.useRealTimers();
		document.body.innerHTML = '';
	});

	function setup() {
		vi.useFakeTimers();
		document.body.innerHTML = '<div id="wrap"><span id="plain">x</span><dialog id="dlg"><span id="in">y</span></dialog></div>';
		const onComplete = vi.fn();
		wireHold(document.getElementById('wrap') as HTMLElement, 1000, onComplete);
		return onComplete;
	}

	it('completes after the hold on the plain surface', () => {
		const onComplete = setup();
		press(document.getElementById('plain')!);
		vi.advanceTimersByTime(1000);
		expect(onComplete).toHaveBeenCalledOnce();
	});

	it('ignores presses inside a dialog (the fullscreen yard)', () => {
		const onComplete = setup();
		press(document.getElementById('in')!);
		vi.advanceTimersByTime(2000);
		expect(onComplete).not.toHaveBeenCalled();
	});
});
