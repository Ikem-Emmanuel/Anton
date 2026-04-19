'use client';
// useTweaks — loads persisted tweaks on mount, applies to the DOM, returns
// [tweaks, update] tuple. Patches through update() auto-save to
// localStorage and re-apply CSS vars.

import { useEffect, useState } from 'react';
import { applyAccent, applyDensity, applyTheme, DEFAULT_TWEAKS, type Tweaks } from '@/lib/theme';

const STORAGE_KEY = 'anton.tweaks';

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
