'use client';
// WebShell — Titlebar + LeftRail + route-driven center + ApprovalTray + CommandBar + Cmd+K palette.

import { useEffect, useState } from 'react';
import { APPROVALS } from '@/lib/data';
import ActivityTimeline from '@/components/modules/activity-timeline';
import Briefing from '@/components/modules/briefing';
import { CommandPalette } from '@/components/layout/command-palette';
import MemoryBrowser from '@/components/modules/memory-browser';
import MissionControl from '@/components/modules/mission-control';
import {
  ApprovalsHub,
  Calendar,
  Chat,
  Documents,
  Expenses,
  Inbox,
  IntegrationsHub,
  People,
  Research,
  Tasks,
  Travel,
  Usage,
} from '@/components/modules/placeholders';
import { DeptChip, Kbd, RiskPip } from '@/components/ui/primitives';
import Settings from '@/components/modules/settings';
import DeptChart from '@/components/modules/team';

export type Route =
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

const ROUTE_VIEWS: Record<Route, { render: React.ReactNode; tray: 'normal' | 'hidden' }> = {
  mc: { render: <MissionControl />, tray: 'normal' },
  brief: { render: <Briefing />, tray: 'normal' },
  pending: { render: <ApprovalsHub />, tray: 'hidden' },
  tasks: { render: <Tasks />, tray: 'hidden' },
  inbox: { render: <Inbox />, tray: 'hidden' },
  calendar: { render: <Calendar />, tray: 'hidden' },
  docs: { render: <Documents />, tray: 'hidden' },
  chat: { render: <Chat />, tray: 'hidden' },
  research: { render: <Research />, tray: 'hidden' },
  people: { render: <People />, tray: 'hidden' },
  memory: { render: <MemoryBrowser />, tray: 'normal' },
  expenses: { render: <Expenses />, tray: 'hidden' },
  travel: { render: <Travel />, tray: 'hidden' },
  usage: { render: <Usage />, tray: 'hidden' },
  team: { render: <DeptChart />, tray: 'normal' },
  log: { render: <ActivityTimeline />, tray: 'normal' },
  hands: { render: <IntegrationsHub />, tray: 'hidden' },
  settings: { render: <Settings />, tray: 'hidden' },
};

function Titlebar({ now, onOpenPalette }: { now: string; onOpenPalette: () => void }) {
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
      <button
        onClick={onOpenPalette}
        className="mono small"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <Kbd>⌘</Kbd> <Kbd>K</Kbd> <span style={{ marginLeft: 4 }}>command</span>
      </button>
    </div>
  );
}

function LeftRail({ active, onNav }: { active: Route; onNav: (r: Route) => void }) {
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
              <span className="mono small" style={{ color: 'var(--text-tertiary)', fontSize: 10 }}>
                {i.k}
              </span>
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
  const [expanded, setExpanded] = useState<number[]>([2]);
  const toggle = (id: number) =>
    setExpanded((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="mono caps" style={{ color: 'var(--text-primary)' }}>
            Pending
          </div>
          <div className="mono small" style={{ color: 'var(--work)' }}>
            {APPROVALS.length}
          </div>
        </div>
        <div className="mono small" style={{ color: 'var(--text-tertiary)', marginTop: 4 }}>
          sorted by risk · newest first
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 10px' }}>
        {APPROVALS.map((a) => {
          const isOpen = expanded.includes(a.id);
          return (
            <div
              key={a.id}
              style={{
                padding: '12px 12px 10px',
                marginBottom: 8,
                background: a.risk === 'H' ? 'var(--bg-hover)' : 'var(--bg-surface)',
                border: `1px solid ${a.risk === 'H' ? 'var(--error)' : 'var(--border-default)'}`,
                borderRadius: 'var(--r-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div
                  className="mono"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    background: 'var(--bg-raised)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {a.agent.slice(0, 2).toUpperCase()}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{a.agent}</span>
                <DeptChip id={a.dept} />
                <span style={{ flex: 1 }} />
                <RiskPip r={a.risk} />
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-primary)', marginBottom: 8 }}>
                {a.intent}
              </div>

              {isOpen && a.why && (
                <div
                  className="mono small"
                  style={{
                    padding: '8px 10px',
                    background: 'var(--bg-page)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 4,
                    color: 'var(--text-secondary)',
                    marginBottom: 8,
                  }}
                >
                  {a.why}
                </div>
              )}
              {isOpen && a.diff && (
                <div
                  style={{
                    padding: '8px 10px',
                    background: 'var(--bg-page)',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: 8,
                  }}
                >
                  {a.diff.map((row, i) => (
                    <div key={i} className="mono small" style={{ display: 'flex', gap: 8, padding: '2px 0' }}>
                      <span
                        style={{
                          color:
                            row[0] === '+'
                              ? 'var(--ok)'
                              : row[0] === '-'
                                ? 'var(--error)'
                                : 'var(--work)',
                          width: 12,
                        }}
                      >
                        {row[0]}
                      </span>
                      <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{row[1]}</span>
                      <span style={{ color: 'var(--text-tertiary)' }}>{row[2] || ''}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    background: 'var(--accent)',
                    color: 'var(--bg-page)',
                    border: 'none',
                    borderRadius: 'var(--r-chip)',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Approve <Kbd>A</Kbd>
                </button>
                <button
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--r-chip)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Reject <Kbd>R</Kbd>
                </button>
                <button
                  onClick={() => toggle(a.id)}
                  className="mono small"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                    padding: '6px',
                  }}
                >
                  {isOpen ? '−' : 'why?'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WebShell() {
  const [active, setActive] = useState<Route>('mc');
  const [now, setNow] = useState('');
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((x) => !x);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const view = ROUTE_VIEWS[active];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>
      <Titlebar now={now} onOpenPalette={() => setPaletteOpen(true)} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <LeftRail active={active} onNav={setActive} />
        <div style={{ flex: 1, minWidth: 0, background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
          {view.render}
        </div>
        {view.tray === 'normal' && (
          <div
            style={{
              width: 320,
              borderLeft: '1px solid var(--border-subtle)',
              background: 'var(--bg-page)',
            }}
          >
            <ApprovalTray />
          </div>
        )}
      </div>
      <CommandBar />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
