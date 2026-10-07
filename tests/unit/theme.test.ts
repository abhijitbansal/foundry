import { describe, it, expect, beforeEach } from 'vitest';
import { THEME_KEY, noFlashInlineScript, readTheme, setTheme, toggleTheme } from '../../src/lib/theme';

describe('theme.ts', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
  });

  it('toggleTheme flips the data-theme attribute and persists it to localStorage', () => {
    document.documentElement.setAttribute('data-theme', 'light');

    const next = toggleTheme();

    expect(next).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');

    const back = toggleTheme();

    expect(back).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem(THEME_KEY)).toBe('light');
  });

  it('readTheme defaults to light when data-theme is absent or unrecognized', () => {
    expect(readTheme()).toBe('light');

    document.documentElement.setAttribute('data-theme', 'something-else');
    expect(readTheme()).toBe('light');

    document.documentElement.setAttribute('data-theme', 'dark');
    expect(readTheme()).toBe('dark');
  });

  it('noFlashInlineScript: a stored choice wins, otherwise the OS preference decides', () => {
    const originalMatchMedia = window.matchMedia;
    const run = (stored: string | null, osDark: boolean) => {
      document.documentElement.removeAttribute('data-theme');
      localStorage.clear();
      if (stored) localStorage.setItem(THEME_KEY, stored);
      window.matchMedia = ((q: string) => ({ matches: osDark && q.includes('dark') })) as unknown as typeof window.matchMedia;
      new Function(noFlashInlineScript())();
      return document.documentElement.getAttribute('data-theme');
    };
    try {
      expect(run(null, true)).toBe('dark');
      expect(run(null, false)).toBe('light');
      expect(run('light', true)).toBe('light');
      expect(run('dark', false)).toBe('dark');
      expect(run('garbage', true)).toBe('dark');
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it('noFlashInlineScript resolves to light when matchMedia is absent and nothing is stored', () => {
    const originalMatchMedia = window.matchMedia;
    try {
      (window as unknown as { matchMedia: unknown }).matchMedia = undefined;
      new Function(noFlashInlineScript())();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it('setTheme swallows a localStorage throw (private-browsing Safari) without crashing', () => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('QuotaExceededError: private browsing');
    };

    try {
      expect(() => setTheme('dark')).not.toThrow();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    } finally {
      Storage.prototype.setItem = originalSetItem;
    }
  });
});
