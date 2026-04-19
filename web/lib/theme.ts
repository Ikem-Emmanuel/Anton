// Theme primitives — types, accent palette, CSS-variable application.
// Pure module, no React. The useTweaks hook (hooks/use-tweaks.ts) wraps
// these to drive the TweaksPanel; other code can import ACCENTS or the
// types here without pulling the hook along.

export type Theme = 'warm-dark' | 'true-dark' | 'light';
export type AccentKey = 'gold' | 'cyan' | 'violet' | 'coral' | 'green';
export type Density = 'compact' | 'comfortable' | 'spacious';

export type Tweaks = {
  theme: Theme;
  accent: AccentKey;
  density: Density;
};

export const DEFAULT_TWEAKS: Tweaks = {
  theme: 'warm-dark',
  accent: 'gold',
  density: 'comfortable',
};

export const ACCENTS: Record<AccentKey, { dark: string; light: string; soft: string; softLight: string }> = {
  gold: { dark: '#C4943A', light: '#925E0B', soft: 'rgba(196,148,58,0.14)', softLight: 'rgba(146,94,11,0.12)' },
  cyan: { dark: '#5EC4C0', light: '#0E7C78', soft: 'rgba(94,196,192,0.14)', softLight: 'rgba(14,124,120,0.12)' },
  violet: { dark: '#A78BE8', light: '#6B4BC7', soft: 'rgba(167,139,232,0.14)', softLight: 'rgba(107,75,199,0.12)' },
  coral: { dark: '#E4938E', light: '#B14842', soft: 'rgba(228,147,142,0.14)', softLight: 'rgba(177,72,66,0.12)' },
  green: { dark: '#7BC195', light: '#2F7554', soft: 'rgba(123,193,149,0.14)', softLight: 'rgba(47,117,84,0.12)' },
};

export function applyAccent(key: AccentKey, theme: Theme): void {
  const a = ACCENTS[key];
  const isLight = theme === 'light';
  const root = document.documentElement;
  root.style.setProperty('--accent', isLight ? a.light : a.dark);
  root.style.setProperty('--accent-soft', isLight ? a.softLight : a.soft);
}

export function applyDensity(d: Density): void {
  const root = document.documentElement;
  if (d === 'compact') {
    root.style.setProperty('--r-card', '6px');
    root.style.setProperty('--r-panel', '8px');
    root.style.fontSize = '13px';
  } else if (d === 'spacious') {
    root.style.setProperty('--r-card', '10px');
    root.style.setProperty('--r-panel', '14px');
    root.style.fontSize = '15px';
  } else {
    root.style.setProperty('--r-card', '8px');
    root.style.setProperty('--r-panel', '12px');
    root.style.fontSize = '14px';
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}
