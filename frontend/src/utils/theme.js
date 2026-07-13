const THEME_KEY = 'vibe_todo_theme';

/** Apply a theme by toggling the `dark` class on <html>. */
export function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
}

/** Resolve the initial theme: stored preference, else the OS setting. */
export function initTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  const theme =
    stored ||
    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light');
  applyTheme(theme);
  return theme;
}

export function isDark() {
  return document.documentElement.classList.contains('dark');
}

/** Flip the theme, persist it, and return the new value. */
export function toggleTheme() {
  const next = isDark() ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
  return next;
}
