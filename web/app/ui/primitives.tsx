// Primitive UI components — ported from Design/anton/project/shared.jsx.
// Inline styles match the prototype; tokens from globals.css drive all colors.

import { DEPARTMENTS, type AgentStatus, type Risk, type TrustTier } from '../lib/data';

export function DeptChip({ id, size = 'sm' }: { id: string; size?: 'sm' | 'md' }) {
  const d = DEPARTMENTS.find((x) => x.id === id);
  if (!d) return null;
  const pad = size === 'sm' ? '2px 6px' : '3px 8px';
  const fs = size === 'sm' ? 10 : 11;
  return (
    <span
      className="mono"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: pad,
        fontSize: fs,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--r-chip)',
        color: 'var(--text-secondary)',
        background: 'transparent',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 2, background: d.color }} />
      {d.name}
    </span>
  );
}

export function TrustBadge({ tier }: { tier: TrustTier }) {
  const map: Record<TrustTier, { c: string; l: string }> = {
    green: { c: 'var(--ok)', l: 'AUTO' },
    amber: { c: 'var(--work)', l: 'CONFIRM' },
    red: { c: 'var(--error)', l: 'MANUAL' },
  };
  const s = map[tier];
  return (
    <span
      className="mono"
      title={`Trust tier: ${s.l}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 10,
        color: s.c,
        letterSpacing: '0.12em',
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 2, background: s.c, opacity: 0.9 }} />
      {s.l}
    </span>
  );
}

export function StatusGlow({ s }: { s: AgentStatus }) {
  const map: Record<AgentStatus, { c: string; pulse: boolean }> = {
    idle: { c: 'var(--text-tertiary)', pulse: false },
    working: { c: 'var(--work)', pulse: true },
    complete: { c: 'var(--ok)', pulse: false },
    error: { c: 'var(--error)', pulse: false },
  };
  const st = map[s];
  return (
    <span
      className={st.pulse ? 'pulse' : ''}
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: st.c,
        boxShadow: `0 0 8px ${st.c}`,
        opacity: st.pulse ? 0.9 : 0.75,
      }}
    />
  );
}

export function RiskPip({ r }: { r: Risk }) {
  const m: Record<Risk, { c: string; l: string }> = {
    L: { c: 'var(--text-secondary)', l: 'LOW' },
    M: { c: 'var(--work)', l: 'MED' },
    H: { c: 'var(--error)', l: 'HIGH' },
  };
  const s = m[r];
  return (
    <span className="mono" style={{ fontSize: 10, color: s.c, letterSpacing: '0.1em' }}>
      {s.l}
    </span>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="mono"
      style={{
        display: 'inline-block',
        padding: '1px 5px',
        fontSize: 11,
        lineHeight: 1.3,
        background: 'var(--bg-hover)',
        border: '1px solid var(--border-default)',
        borderRadius: 4,
        color: 'var(--text-secondary)',
        minWidth: 16,
        textAlign: 'center',
      }}
    >
      {children}
    </kbd>
  );
}
