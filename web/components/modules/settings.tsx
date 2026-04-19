'use client';

import { AGENTS } from '@/lib/data';
import { DeptChip } from '@/components/ui/primitives';

const TIERS = ['SUGGEST', 'DRAFT', 'EXECUTE', 'AUTO'];
const TIER_INDEX: Record<string, number> = { green: 3, amber: 1, red: 0 };

const INTEGRATIONS = [
  'Slack · connected',
  'Ollama · qwen3-8b',
  'Claude · fallback',
  'Stripe · api-key expired',
  'GitHub · connected',
  'Calendar · connected',
];

export default function Settings() {
  return (
    <div style={{ padding: '24px 32px', height: '100%', overflow: 'auto', maxWidth: 860 }}>
      <div className="mono caps" style={{ color: 'var(--text-tertiary)' }}>
        SETTINGS
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 500, margin: '4px 0 28px' }}>Trust tiers</h1>
      <p style={{ color: 'var(--text-secondary)', marginTop: 0, marginBottom: 28, maxWidth: 620 }}>
        Each agent has an autonomy level. Green runs without asking. Amber confirms before acting. Red waits on you.
      </p>

      <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--r-card)', overflow: 'hidden' }}>
        <div
          className="mono caps"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 100px 260px 80px',
            padding: '10px 16px',
            borderBottom: '1px solid var(--border-default)',
            background: 'var(--bg-surface)',
          }}
        >
          <span style={{ color: 'var(--text-tertiary)' }}>Agent</span>
          <span style={{ color: 'var(--text-tertiary)' }}>Team</span>
          <span style={{ color: 'var(--text-tertiary)' }}>Autonomy</span>
          <span style={{ color: 'var(--text-tertiary)', textAlign: 'right' }}>Last</span>
        </div>
        {AGENTS.slice(0, 10).map((a, i) => {
          const active = TIER_INDEX[a.t];
          return (
            <div
              key={a.n}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 100px 260px 80px',
                padding: '10px 16px',
                alignItems: 'center',
                borderBottom: i === 9 ? 'none' : '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <div style={{ fontSize: 14 }}>{a.n}</div>
                <div className="mono small" style={{ color: 'var(--text-tertiary)' }}>
                  {a.r}
                </div>
              </div>
              <DeptChip id={a.d} />
              <div
                style={{
                  display: 'flex',
                  gap: 0,
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--r-chip)',
                  overflow: 'hidden',
                }}
              >
                {TIERS.map((t, ti) => (
                  <button
                    key={t}
                    className="mono small"
                    style={{
                      flex: 1,
                      padding: '5px 4px',
                      background: ti === active ? 'var(--accent-soft)' : 'transparent',
                      color: ti === active ? 'var(--accent)' : 'var(--text-secondary)',
                      border: 'none',
                      cursor: 'pointer',
                      borderRight: ti < 3 ? '1px solid var(--border-default)' : 'none',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <span className="mono small" style={{ color: 'var(--text-tertiary)', textAlign: 'right' }}>
                {a.last}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 36 }}>
        <div className="mono caps" style={{ color: 'var(--text-tertiary)', marginBottom: 10 }}>
          Integrations
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {INTEGRATIONS.map((s, i) => {
            const err = s.includes('expired');
            return (
              <div
                key={i}
                style={{
                  padding: '14px 16px',
                  background: 'var(--bg-surface)',
                  border: `1px solid ${err ? 'var(--error)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--r-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{ width: 8, height: 8, borderRadius: '50%', background: err ? 'var(--error)' : 'var(--ok)' }}
                  />
                  <span className="mono small" style={{ color: 'var(--text-secondary)' }}>
                    {s}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
