'use client';
// WebShell — Titlebar + LeftRail + CommandBar + ApprovalTray.
// Ported from Design/anton/project/shell.jsx. Client component because it
// owns nav state and keyboard handlers.

import { useEffect, useState } from 'react';
import { Kbd, DeptChip, RiskPip } from './primitives';
import { APPROVALS } from '../lib/data';

type Route =
  | 'mc'
  | 'brief'
  | 'pending'
  | 'tasks'
  | 'inbox'
  | 'calendar'
  | 'docs'
  | 'chat'
  | 'research'
  | 'people'
  | 'memory'
  | 'expenses'
  | 'travel'
  | 'usage'
  | 'team'
  | 'log'
  | 'hands'
  | 'settings';

const NAV_ITEMS: Array<
  { sec: string } | { id: Route; label: string; glyph: string; k: string; badge?: number }
> = [
  { sec: 'OVERVIEW' },
  { id: 'mc', label: 'Mission Control', glyph: '◎', k: 'G A' },
  { id: 'brief', label: 'Briefing', glyph: '☰', k: 'G B' },
  { id: 'pending', label: 'Approvals', glyph: '✓', k: 'G P', badge: APPROVALS.length },

  { sec: 'DO' },
  { id: 'tasks', label: 'Tasks', glyph: '▤', k: 'G K', badge: 3 },
  { id: 'inbox', label: 'Inbox', glyph: '▥', k: 'G I', badge: 4 },
  { id: 'calendar', label: 'Calendar', glyph: '▦', k: 'G D' },
  { id: 'docs', label: 'Documents', glyph: '◨', k: 'G O' },
  { id: 'chat', label: 'Chat', glyph: '◇', k: 'G C' },

  { sec: 'KNOW' },
  { id: 'research', label: 'Research', glyph: '❃', k: 'G R' },
  { id: 'people', label: 'People', glyph: '◉', k: 'G E' },
  { id: 'memory', label: 'Memory', glyph: '■', k: 'G M' },

  { sec: 'RUN' },
  { id: 'expenses', label: 'Expenses', glyph: '$', k: 'G X' },
  { id: 'travel', label: 'Travel', glyph: '✈', k: 'G V' },
  { id: 'usage', label: 'Usage', glyph: '◐', k: 'G U' },

  { sec: 'MIND' },
  { id: 'team', label: 'Team', glyph: '⚏', k: 'G T' },
  { id: 'log', label: 'Log', glyph: '◌', k: 'G L' },
  { id: 'hands', label: 'Hands', glyph: '◈', k: 'G H' },

  { sec: 'SYSTEM' },
  { id: 'settings', label: 'Settings', glyph: '⋯', k: 'G S' },
];

function Titlebar({ now }: { now: string }) {
  return (
    <div
      style={{
        height: 32,
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '0 14px',
        background: 'var(--bg-page)',
      }}
    >
      <div className="mono" style={{ fontSize: 12, color: 'var(--accent)', letterSpacing: '0.08em' }}>
        ◉ ANTON
      </div>
      <div style={{ width: 1, height: 14, background: 'var(--border-default)' }} />
      <span className="mono small" style={{ color: 'var(--text-tertiary)' }}>
        noel · personal OS
      </span>
      <span style={{ flex: 1 }} />
      <span className="mono small" style={{ color: 'var(--text-tertiary)' }}>
        {now} · 3d 14h
      </span>
      <span style={{ width: 1, height: 14, background: 'var(--border-default)' }} />
      <span className="mono small" style={{ color: 'var(--text-secondary)' }}>
        <Kbd>⌘</Kbd> <Kbd>K</Kbd> <span style={{ marginLeft: 4 }}>command</span>
      </span>
    </div>
  );
}

function LeftRail({
  active,
  onNav,
  showHints = true,
}: {
  active: Route;
  onNav: (r: Route) => void;
  showHints?: boolean;
}) {
  return (
    <div
      style={{
        width: 220,
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-page)',
        minHeight: 0,
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {NAV_ITEMS.map((i, idx) => {
          if ('sec' in i) {
            return (
              <div
                key={`sec-${idx}`}
                className="mono small caps"
                style={{
                  color: 'var(--text-tertiary)',
                  letterSpacing: '0.1em',
                  fontSize: 9,
                  padding: idx === 0 ? '2px 10px 6px' : '12px 10px 4px',
                }}
              >
                {i.sec}
              </div>
            );
          }
          const activeItem = active === i.id;
          return (
            <button
              key={i.id}
              onClick={() => onNav(i.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '5px 10px',
                background: activeItem ? 'var(--bg-hover)' : 'transparent',
                color: activeItem ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 13,
                fontFamily: 'var(--font-sans)',
              }}
            >
              <span
                className="mono"
                style={{ width: 16, color: activeItem ? 'var(--accent)' : 'var(--text-tertiary)' }}
              >
                {i.glyph}
              </span>
              <span style={{ flex: 1 }}>{i.label}</span>
              {i.badge ? (
                <span className="mono small" style={{ color: 'var(--work)' }}>
                  {i.badge}
                </span>
              ) : null}
              {showHints && (
                <span className="mono small" style={{ color: 'var(--text-tertiary)', fontSize: 10 }}>
                  {i.k}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <div className="mono small" style={{ color: 'var(--text-secondary)', lineHeight: 1.5, fontSize: 10 }}>
          <div>
            qwen3:8b <span style={{ color: 'var(--ok)' }}>●</span> · mem 1,487
          </div>
          <div style={{ color: 'var(--text-tertiary)' }}>claude ● fallback</div>
        </div>
      </div>
    </div>
  );
}

function CommandBar() {
  return (
    <div
      style={{
        height: 48,
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
        background: 'var(--bg-page)',
      }}
    >
      <span className="mono" style={{ color: 'var(--accent)' }}>
        ▸
      </span>
      <input
        placeholder="delegate, ask, or just type…"
        className="mono"
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--text-primary)',
          fontSize: 14,
        }}
      />
      <span className="mono small" style={{ color: 'var(--text-tertiary)' }}>
        @local
      </span>
      <button
        className="mono small"
        style={{
          background: 'transparent',
          border: '1px solid var(--border-default)',
          color: 'var(--text-secondary)',
          padding: '3px 8px',
          borderRadius: 'var(--r-chip)',
          cursor: 'pointer',
        }}
      >
        mic
      </button>
      <Kbd>⌘</Kbd>
      <Kbd>⏎</Kbd>
    </div>
  );
}

function ApprovalTray() {
  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, height: '100%', overflowY: 'auto' }}>
      <div className="mono caps small" style={{ color: 'var(--text-tertiary)', marginBottom: 2 }}>
        PENDING · {APPROVALS.length}
      </div>
      {APPROVALS.map((a) => (
        <div
          key={a.id}
          style={{
            padding: 12,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--r-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="mono small" style={{ color: 'var(--text-primary)' }}>
              {a.agent}
            </span>
            <DeptChip id={a.dept} />
            <span style={{ flex: 1 }} />
            <RiskPip r={a.risk} />
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.4 }}>{a.intent}</div>
          {a.why && (
            <div className="small" style={{ color: 'var(--text-tertiary)' }}>
              {a.why}
            </div>
          )}
          <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
            <button
              className="mono small"
              style={{
                padding: '4px 10px',
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                border: '1px solid var(--accent)',
                borderRadius: 'var(--r-chip)',
                cursor: 'pointer',
                fontSize: 11,
                flex: 1,
              }}
            >
              Approve
            </button>
            <button
              className="mono small"
              style={{
                padding: '4px 10px',
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--r-chip)',
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function WebShell({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<Route>('mc');
  const [now, setNow] = useState('');

  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>
      <Titlebar now={now} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <LeftRail active={active} onNav={setActive} />
        <div style={{ flex: 1, minWidth: 0, background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
        <div
          style={{
            width: 320,
            borderLeft: '1px solid var(--border-subtle)',
            background: 'var(--bg-page)',
          }}
        >
          <ApprovalTray />
        </div>
      </div>
      <CommandBar />
    </div>
  );
}
