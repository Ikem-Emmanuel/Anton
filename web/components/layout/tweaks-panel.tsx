'use client';
// TweaksPanel — floating dev panel (bottom-right) for live theme / accent /
// density switching. Toggle with ⌘;.

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { ACCENTS, type AccentKey, type Density, type Theme, type Tweaks, useTweaks } from '@/lib/tweaks';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-2 border-b border-border-subtle last:border-b-0">
      <div className="mono small text-tertiary mb-1.5 text-[10px] caps">{label}</div>
      {children}
    </div>
  );
}

function BtnRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ key: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1">
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            type="button"
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={cn(
              'mono small flex-1 px-2 py-1 text-[11px] rounded-chip cursor-pointer border',
              active
                ? 'bg-accent-soft text-accent border-accent'
                : 'bg-transparent text-secondary border-border-default hover:bg-hover'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function AccentSwatches({
  value,
  theme,
  onChange,
}: {
  value: AccentKey;
  theme: Theme;
  onChange: (k: AccentKey) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {(Object.entries(ACCENTS) as Array<[AccentKey, (typeof ACCENTS)[AccentKey]]>).map(([k, v]) => {
        const active = k === value;
        return (
          <button
            type="button"
            key={k}
            onClick={() => onChange(k)}
            title={k}
            className={cn(
              'flex-1 aspect-square rounded-chip cursor-pointer',
              active ? 'border-2 border-primary' : 'border border-border-default'
            )}
            style={{ backgroundColor: theme === 'light' ? v.light : v.dark }}
          />
        );
      })}
    </div>
  );
}

export function TweaksPanel() {
  const [tweaks, update] = useTweaks();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ';') {
        e.preventDefault();
        setVisible((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!visible) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[1000] bg-raised border border-border-strong rounded-panel p-4 w-[280px] shadow-[0_8px_24px_rgba(0,0,0,0.5)] font-sans max-h-[calc(100vh-40px)] overflow-auto">
      <div className="mono caps text-primary mb-3 text-[11px] flex items-center gap-1.5">
        <span className="text-accent">◉</span> TWEAKS
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Close tweaks panel"
          className="text-tertiary hover:text-primary cursor-pointer"
        >
          ×
        </button>
      </div>

      <Row label="Theme">
        <BtnRow<Theme>
          value={tweaks.theme}
          onChange={(v) => update({ theme: v })}
          options={[
            { key: 'warm-dark', label: 'warm' },
            { key: 'true-dark', label: 'black' },
            { key: 'light', label: 'light' },
          ]}
        />
      </Row>

      <Row label="Accent">
        <AccentSwatches value={tweaks.accent} theme={tweaks.theme} onChange={(v) => update({ accent: v })} />
      </Row>

      <Row label="Density">
        <BtnRow<Density>
          value={tweaks.density}
          onChange={(v) => update({ density: v })}
          options={[
            { key: 'compact', label: 'compact' },
            { key: 'comfortable', label: 'normal' },
            { key: 'spacious', label: 'spacious' },
          ]}
        />
      </Row>

      <div className="mono small text-tertiary text-[10px] pt-3 mt-1 border-t border-border-subtle">
        ⌘; to toggle · persists locally
      </div>
    </div>
  );
}

// Static export of Tweaks type for anyone who wants to read/store preferences
// from outside the panel.
export type { Tweaks };
