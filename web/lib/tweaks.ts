'use client';
// Tweaks — runtime-adjustable theme / accent / density. Persists to
// localStorage so tweaks survive page reload. The panel UI lives in
// components/layout/tweaks-panel.tsx; this module owns the state, the
// CSS-var application logic, and the storage shape.

import { useEffect, useState } from 'react';

export type Theme = 'warm-dark' | 'true-dark' | 'light';
export type AccentKey = 'gold' | 'cyan' | 'violet' | 'coral' | 'green';
export type Density = 'compact' | 'comfortable' | 'spacious';

export type Tweaks = {
  theme: Theme;
  accent: AccentKey;
  density: Density;
};

const DEFAULT_TWEAKS: Tweaks = {
  theme: 'warm-dark',
  accent: 'gold',
  density: 'comfortable',
};

const STORAGE_KEY = 'anton.tweaks';

export const ACCENTS: Record<AccentKey, { dark: string; light: string; soft: string; softLight: string }> = {
  gold: { dark: '#C4943A', light: '#925E0B', soft: 'rgba(196,148,58,0.14)', softLight: 'rgba(146,94,11,0.12)' },
  cyan: { dark: '#5EC4C0', light: '#0E7C78', soft: 'rgba(94,196,192,0.14)', softLight: 'rgba(14,124,120,0.12)' },
  violet: { dark: '#A78BE8', light: '#6B4BC7', soft: 'rgba(167,139,232,0.14)', softLight: 'rgba(107,75,199,0.12)' },
  coral: { dark: '#E4938E', light: '#B14842', soft: 'rgba(228,147,142,0.14)', softLight: 'rgba(177,72,66,0.12)' },
  green: { dark: '#7BC195', light: '#2F7554', soft: 'rgba(123,193,149,0.14)', softLight: 'rgba(47,117,84,0.12)' },
};

function applyAccent(key: AccentKey, theme: Theme): void {
  const a = ACCENTS[key];
  const isLight = theme === 'light';
  const root = document.documentElement;
  root.style.setProperty('--accent', isLight ? a.light : a.dark);
  root.style.setProperty('--accent-soft', isLight ? a.softLight : a.soft);
}

function applyDensity(d: Density): void {
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

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

function loadTweaks(): Tweaks {
  if (typeof window === 'undefined') return DEFAULT_TWEAKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TWEAKS;
    const parsed = JSON.parse(raw) as Partial<Tweaks>;
    return { ...DEFAULT_TWEAKS, ...parsed };
  } catch {
    return DEFAULT_TWEAKS;
  }
}

function saveTweaks(tweaks: Tweaks): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tweaks));
  } catch {
    // localStorage quota or disabled — non-fatal, just won't persist.
  }
}

/**
 * useTweaks — reads persisted tweaks on mount, applies them to the DOM,
 * and returns a [tweaks, update] tuple. `update` accepts a partial patch.
 */
export function useTweaks(): [Tweaks, (patch: Partial<Tweaks>) => void] {
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULT_TWEAKS);

  useEffect(() => {
    const loaded = loadTweaks();
    setTweaks(loaded);
    applyTheme(loaded.theme);
    applyAccent(loaded.accent, loaded.theme);
    applyDensity(loaded.density);
  }, []);

  const update = (patch: Partial<Tweaks>) => {
    setTweaks((prev) => {
      const next = { ...prev, ...patch };
      applyTheme(next.theme);
      applyAccent(next.accent, next.theme);
      applyDensity(next.density);
      saveTweaks(next);
      return next;
    });
  };

  return [tweaks, update];
}
