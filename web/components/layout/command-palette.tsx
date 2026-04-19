'use client';

import { useEffect, useRef, useState } from 'react';
import { Kbd } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';

type Row = { kind: string; icon: string; text: string; hint: string; kbd?: string };

const ROWS: Row[] = [
  { kind: 'action', icon: '▸', text: 'Delegate task to agent', hint: '/delegate', kbd: 'D' },
  { kind: 'action', icon: '✓', text: 'Approve all low-risk pending', hint: '5 items', kbd: '⇧A' },
  { kind: 'nav', icon: '◎', text: 'Go to Mission Control', hint: 'home', kbd: 'G A' },
  { kind: 'nav', icon: '◎', text: 'Go to Briefing', hint: '', kbd: 'G B' },
  { kind: 'agent', icon: '●', text: 'Marcus · Lead engineer', hint: 'Engineering', kbd: '⏎' },
  { kind: 'agent', icon: '●', text: 'Sarah · Copy & campaigns', hint: 'Marketing', kbd: '⏎' },
  { kind: 'memory', icon: '■', text: 'Search memory for "onboarding"', hint: '14 results' },
  { kind: 'system', icon: '◌', text: 'Toggle autonomy: all to DRAFT', hint: 'reversible' },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, ROWS.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      }
      if (e.key === 'Enter') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <button
      type="button"
      aria-label="Close command palette"
      onClick={onClose}
      className="fixed inset-0 z-[999] flex items-start justify-center pt-[100px] bg-black/50 backdrop-blur-md cursor-default"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        className="w-[640px] bg-raised border border-border-strong rounded-panel overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.5)] cursor-default text-left"
      >
        <div className="flex items-center gap-2.5 px-[18px] py-3.5 border-b border-border-subtle">
          <span className="mono text-accent">▸</span>
          <input
            ref={inputRef}
            placeholder="type a command…"
            className="mono flex-1 bg-transparent border-0 outline-0 text-base text-primary"
          />
          <span className="mono small text-tertiary">mission control</span>
        </div>
        <ul role="listbox" aria-label="Commands" className="max-h-[420px] overflow-auto list-none m-0 p-0">
          {ROWS.map((r, i) => (
            <li
              key={`${r.kind}-${r.text}`}
              role="option"
              aria-selected={i === selected}
              onMouseEnter={() => setSelected(i)}
              className={cn(
                'flex items-center gap-3 px-[18px] py-2.5 cursor-pointer border-l-2',
                i === selected ? 'bg-hover border-l-accent' : 'bg-transparent border-l-transparent'
              )}
            >
              <span className="mono text-tertiary w-3.5">{r.icon}</span>
              <span className={cn('mono text-sm flex-1', i === selected ? 'text-primary' : 'text-secondary')}>
                {r.text}
              </span>
              <span className="mono small text-tertiary">{r.hint}</span>
              {r.kbd && <Kbd>{r.kbd}</Kbd>}
            </li>
          ))}
        </ul>
        <div className="flex gap-3.5 px-[18px] py-2.5 border-t border-border-subtle">
          <span className="mono small text-tertiary">
            <Kbd>↑↓</Kbd> navigate
          </span>
          <span className="mono small text-tertiary">
            <Kbd>⏎</Kbd> run
          </span>
          <span className="mono small text-tertiary">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd> scope
          </span>
          <span className="flex-1" />
          <span className="mono small text-tertiary">@local · Cmd+L switch to @claude</span>
        </div>
      </div>
    </button>
  );
}
