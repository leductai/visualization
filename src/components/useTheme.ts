import { useCallback, useEffect, useState } from 'react';

export type ThemeId = 'light' | 'dark' | 'ocean' | 'sunset';

export const THEMES: { id: ThemeId; label: string }[] = [
  { id: 'light', label: 'Sáng' },
  { id: 'dark', label: 'Tối' },
  { id: 'ocean', label: 'Đại dương' },
  { id: 'sunset', label: 'Hoàng hôn' },
];

const KEY = 'algo-theme';

function initialTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(KEY) as ThemeId | null;
    if (saved && THEMES.some(t => t.id === saved)) return saved;
  } catch { /* storage optional */ }
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(initialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(KEY, theme); } catch { /* ignore */ }
  }, [theme]);
  const setTheme = useCallback((next: ThemeId) => setThemeState(next), []);
  const cycle = useCallback(() => setThemeState(prev => {
    const i = THEMES.findIndex(t => t.id === prev);
    return THEMES[(i + 1) % THEMES.length].id;
  }), []);
  return { theme, setTheme, cycle };
}
