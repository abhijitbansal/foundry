import { describe, it, expect, beforeEach } from 'vitest';
import { THEME_KEY, readTheme, setTheme, toggleTheme } from '../../src/lib/theme';

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
