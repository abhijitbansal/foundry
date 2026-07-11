export const THEME_KEY = 'fy-theme';
export type Theme = 'light' | 'dark';

// Dark is the site default: only an explicit stored 'light' opts out.
export function noFlashInlineScript(): string {
  return `
    var t = null;
    try { t = localStorage.getItem('${THEME_KEY}'); } catch (e) {}
    document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
  `;
}

export function readTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
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
