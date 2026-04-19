'use client';

import { StatusGlow, TrustBadge } from '@/components/ui/primitives';
import { AGENTS, DEPARTMENTS } from '@/lib/data';

const HANDOFF_ROUTES: Array<[string, string, number, string]> = [
  ['Marcus', 'Ada', 34, 'UI review'],
  ['Sarah', 'Kai', 22, 'SEO pass'],
  ['James', 'Ben', 18, 'QA gate'],
  ['Alex', 'Marcus', 14, 'PRD → engineering'],
  ['Priya', 'Alex', 9, 'data → product'],
];

export default function DeptChart() {
  const deptAgents = (id: string) => AGENTS.filter((a) => a.d === id);
  return (
    <div style={{ padding: '24px 32px', height: '100%', overflow: 'auto' }}>
      <div className="mono caps" style={{ color: 'var(--text-tertiary)' }}>
        TEAM / DEPARTMENTS
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 500, margin: '4px 0 8px' }}>Departments</h1>
      <p style={{ color: 'var(--text-secondary)', marginTop: 0, marginBottom: 28, maxWidth: 720 }}>
        15 agents across 6 departments. Anton sits above — routes work, holds context, enforces trust tiers.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
        <div
          style={{
            padding: '14px 24px',
            background: 'var(--bg-surface)',
            border: '2px solid var(--accent)',
            borderRadius: 'var(--r-panel)',
            textAlign: 'center',
            minWidth: 240,
          }}
        >
          <div className="mono small caps" style={{ color: 'var(--accent)' }}>
            CORE · ANTON
          </div>
          <div style={{ fontSize: 18, fontWeight: 500, marginTop: 4 }}>◉ Anton</div>
          <div className="mono small" style={{ color: 'var(--text-tertiary)', marginTop: 2 }}>
            personal OS · 3d 14h uptime
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <div style={{ width: 2, height: 24, background: 'var(--border-strong)' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {DEPARTMENTS.map((dept) => {
          const agents = deptAgents(dept.id);
          const active = agents.filter((a) => a.s === 'working').length;
          return (
            <div
              key={dept.id}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderTop: `3px solid ${dept.color}`,
                borderRadius: 'var(--r-card)',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 500 }}>{dept.name}</span>
                <span style={{ flex: 1 }} />
                <span className="mono small" style={{ color: 'var(--text-tertiary)' }}>
                  {agents.length}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="mono small caps" style={{ color: 'var(--text-tertiary)', fontSize: 10 }}>
                  {active > 0 ? <span style={{ color: 'var(--work)' }}>● {active} active</span> : <span>○ idle</span>}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                {agents.map((a) => (
                  <div
                    key={a.n}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 8px',
                      cursor: 'pointer',
                      background: 'var(--bg-page)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 4,
                    }}
                  >
                    <StatusGlow s={a.s} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{a.n}</div>
                      <div className="mono small" style={{ color: 'var(--text-tertiary)', fontSize: 10 }}>
                        {a.r}
                      </div>
                    </div>
                    <TrustBadge tier={a.t} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 32 }}>
        <div className="mono caps" style={{ color: 'var(--text-tertiary)', marginBottom: 8 }}>
          TOP HAND-OFF ROUTES · LAST 7 DAYS
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--r-card)',
            padding: 14,
          }}
        >
          {HANDOFF_ROUTES.map(([from, to, n, why], i) => {
            const pct = (n / 34) * 100;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="mono small" style={{ width: 80, color: 'var(--text-primary)' }}>
                  {from}
                </span>
                <span className="mono" style={{ color: 'var(--text-tertiary)' }}>
                  →
                </span>
                <span className="mono small" style={{ width: 80, color: 'var(--text-primary)' }}>
                  {to}
                </span>
                <div
                  style={{ flex: 1, height: 4, background: 'var(--bg-page)', borderRadius: 2, position: 'relative' }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: `${pct}%`,
                      background: 'var(--accent)',
                      borderRadius: 2,
                    }}
                  />
                </div>
                <span className="mono small" style={{ color: 'var(--text-secondary)', width: 28, textAlign: 'right' }}>
                  {n}
                </span>
                <span className="mono small" style={{ color: 'var(--text-tertiary)', width: 120 }}>
                  {why}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
