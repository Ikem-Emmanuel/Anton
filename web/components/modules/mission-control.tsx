'use client';
// Mission Control — default landing screen. List-view only in this initial
// port. The design has 5 variants (list / dept / grid / orbit / terminal);
// those will land in a follow-up. Ported from
// Design/anton/project/mission-control.jsx (the MC_List + MCKpiStrip paths).

import { AGENTS } from '@/lib/data';
import { DeptChip, StatusGlow, TrustBadge } from '@/components/ui/primitives';

const KPIS: Array<{ label: string; val: string; sub: string; c: string }> = [
  { label: 'Active', val: '7', sub: 'of 15', c: 'var(--work)' },
  { label: 'Queue', val: '14', sub: 'tasks', c: 'var(--text-primary)' },
  { label: 'Approvals', val: '5', sub: 'pending', c: 'var(--work)' },
  { label: 'Handoffs', val: '23', sub: 'today', c: 'var(--text-primary)' },
  { label: 'Errors', val: '1', sub: 'Riley', c: 'var(--error)' },
  { label: 'Tokens', val: '142k', sub: '/day', c: 'var(--text-secondary)' },
  { label: 'Local', val: '89%', sub: 'routing', c: 'var(--ok)' },
  { label: 'Next brief', val: '27m', sub: '18:00', c: 'var(--text-secondary)' },
];

function KpiStrip() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${KPIS.length}, 1fr)`,
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {KPIS.map((k, i) => (
        <div
          key={k.label}
          style={{
            padding: '12px 16px',
            borderRight: i < KPIS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
          }}
        >
          <div className="mono caps small" style={{ color: 'var(--text-tertiary)', fontSize: 10, marginBottom: 4 }}>
            {k.label}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 20, color: k.c, fontFamily: 'var(--font-mono)' }}>{k.val}</span>
            <span className="mono small" style={{ color: 'var(--text-tertiary)', fontSize: 10 }}>
              {k.sub}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AgentRow({ a, i }: { a: (typeof AGENTS)[number]; i: number }) {
  const barW =
    a.s === 'working'
      ? 40 + ((i * 13) % 50)
      : a.s === 'complete'
        ? 72
        : a.s === 'error'
          ? 18
          : 8 + ((i * 7) % 12);
  const task =
    a.s === 'working'
      ? `running: ${['draft_prd', 'read_file', 'run_sql', 'search', 'plan'][i % 5]}`
      : a.s === 'complete'
        ? 'complete · awaiting review'
        : a.s === 'error'
          ? 'error · needs attention'
          : 'idle';
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '28px 120px 100px 1fr 100px 60px 60px',
        gap: 12,
        alignItems: 'center',
        padding: '10px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        cursor: 'pointer',
        transition: 'background var(--t-fast)',
      }}
    >
      <StatusGlow s={a.s} />
      <div>
        <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{a.n}</div>
        <div className="mono small" style={{ color: 'var(--text-tertiary)', fontSize: 10 }}>
          {a.k}
        </div>
      </div>
      <DeptChip id={a.d} />
      <div>
        <div className="mono small" style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>
          {task}
        </div>
        <div
          style={{
            height: 4,
            background: 'var(--bg-hover)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${barW}%`,
              height: '100%',
              background:
                a.s === 'working'
                  ? 'var(--work)'
                  : a.s === 'complete'
                    ? 'var(--ok)'
                    : a.s === 'error'
                      ? 'var(--error)'
                      : 'var(--text-tertiary)',
            }}
          />
        </div>
      </div>
      <TrustBadge tier={a.t} />
      <span className="mono small" style={{ color: 'var(--text-tertiary)', fontSize: 11, textAlign: 'right' }}>
        {a.q > 0 ? `${a.q} queued` : '—'}
      </span>
      <span className="mono small" style={{ color: 'var(--text-tertiary)', fontSize: 11, textAlign: 'right' }}>
        {a.last}
      </span>
    </div>
  );
}

function ToolbarInfo() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '10px 20px',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="mono small caps" style={{ color: 'var(--text-tertiary)' }}>
        Agents · list view
      </div>
      <span style={{ flex: 1 }} />
      <span
        className="mono small"
        style={{
          color: 'var(--text-tertiary)',
          fontSize: 11,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span
          className="pulse"
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'var(--ok)',
            display: 'inline-block',
          }}
        />
        live · sorted by activity
      </span>
    </div>
  );
}

export default function MissionControl() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <KpiStrip />
      <ToolbarInfo />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {AGENTS.map((a, i) => (
          <AgentRow key={a.n} a={a} i={i} />
        ))}
      </div>
    </div>
  );
}
