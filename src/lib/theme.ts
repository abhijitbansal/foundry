export const THEME_KEY = 'fy-theme';
export type Theme = 'light' | 'dark';

// A stored choice wins; otherwise the OS preference decides.
export function noFlashInlineScript(): string {
  return `
    var t = null;
    try { t = localStorage.getItem('${THEME_KEY}'); } catch (e) {}
    if (t !== 'light' && t !== 'dark') {
      t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', t);
  `;
}

export function readTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

export function setTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
}

export function toggleTheme(): Theme {
  const next: Theme = readTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}
