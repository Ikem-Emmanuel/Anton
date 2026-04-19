'use client';

import { useEffect, useState } from 'react';
import { Kbd } from '@/components/ui/primitives';

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

  useEffect(() => {
    if (!open) return;
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
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,13,11,0.5)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 100,
        zIndex: 999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 640,
          background: 'var(--bg-raised)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--r-panel)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span className="mono" style={{ color: 'var(--accent)' }}>
            ▸
          </span>
          <input
            placeholder="type a command…"
            autoFocus
            className="mono"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 16,
              color: 'var(--text-primary)',
            }}
          />
          <span className="mono small" style={{ color: 'var(--text-tertiary)' }}>
            mission control
          </span>
        </div>
        <div style={{ maxHeight: 420, overflow: 'auto' }}>
          {ROWS.map((r, i) => (
            <div
              key={i}
              onMouseEnter={() => setSelected(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 18px',
                background: i === selected ? 'var(--bg-hover)' : 'transparent',
                borderLeft: `2px solid ${i === selected ? 'var(--accent)' : 'transparent'}`,
                cursor: 'pointer',
              }}
            >
              <span className="mono" style={{ color: 'var(--text-tertiary)', width: 14 }}>
                {r.icon}
              </span>
              <span
                className="mono"
                style={{ fontSize: 14, color: i === selected ? 'var(--text-primary)' : 'var(--text-secondary)', flex: 1 }}
              >
                {r.text}
              </span>
              <span className="mono small" style={{ color: 'var(--text-tertiary)' }}>
                {r.hint}
              </span>
              {r.kbd && <Kbd>{r.kbd}</Kbd>}
            </div>
          ))}
        </div>
        <div
          style={{
            padding: '10px 18px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: 14,
          }}
        >
          <span className="mono small" style={{ color: 'var(--text-tertiary)' }}>
            <Kbd>↑↓</Kbd> navigate
          </span>
          <span className="mono small" style={{ color: 'var(--text-tertiary)' }}>
            <Kbd>⏎</Kbd> run
          </span>
          <span className="mono small" style={{ color: 'var(--text-tertiary)' }}>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd> scope
          </span>
          <span style={{ flex: 1 }} />
          <span className="mono small" style={{ color: 'var(--text-tertiary)' }}>
            @local · Cmd+L switch to @claude
          </span>
        </div>
      </div>
    </div>
  );
}
