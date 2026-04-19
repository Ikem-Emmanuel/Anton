'use client';

import { ACTIVITY } from '@/lib/data';

const SECTIONS: Array<{ title: string; items: string[] }> = [
  {
    title: 'Overnight',
    items: [
      'Felix completed rate-limit middleware (3 commits, tests green).',
      'Kai drafted 4 SEO articles; 2 awaiting review.',
      'James flagged a flaky test in checkout/webhook.spec.ts — isolated, not blocking.',
    ],
  },
  {
    title: 'Today',
    items: [
      'v1.2 deploy ready — awaits your approval (James, high risk).',
      'Launch email to 2,340 contacts ready to send (Sarah, medium).',
      'Q1 retention cohort rebuild — Priya, routine.',
    ],
  },
  {
    title: 'Flagged',
    items: [
      'Diana: Stripe reconciliation blocked. API key expired 2h ago.',
      'Riley: scheduled post failed — rate limit on X API.',
    ],
  },
];

export default function Briefing() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%', gap: 0 }}>
      <div style={{ padding: '24px 32px', borderRight: '1px solid var(--border-subtle)', overflow: 'auto' }}>
        <div className="mono caps" style={{ color: 'var(--text-tertiary)', marginBottom: 4 }}>
          MORNING BRIEF · FRI 18 APR
        </div>
        <h1 style={{ fontSize: 28, letterSpacing: '-0.02em', margin: '0 0 24px', fontWeight: 500 }}>
          Good morning. <span style={{ color: 'var(--text-secondary)' }}>3 things need you today.</span>
        </h1>
        {SECTIONS.map((s) => (
          <div key={s.title} style={{ marginBottom: 28 }}>
            <div
              className="mono caps"
              style={{
                color: 'var(--text-secondary)',
                marginBottom: 10,
                paddingBottom: 6,
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              {s.title}
            </div>
            {s.items.map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', cursor: 'pointer' }}>
                <span className="mono small" style={{ color: 'var(--text-tertiary)', width: 22, paddingTop: 2 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div style={{ flex: 1, fontSize: 14, lineHeight: 1.55 }}>{it}</div>
                <span className="mono small" style={{ color: 'var(--text-tertiary)' }}>
                  ¶
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ padding: '24px 32px', background: 'var(--bg-page)', overflow: 'auto' }}>
        <div className="mono caps" style={{ color: 'var(--text-tertiary)', marginBottom: 4 }}>
          LIVE ACTIVITY
        </div>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 18, color: 'var(--text-secondary)' }}>
          7 agents active now.
        </div>
        {ACTIVITY.slice(0, 7).map((a, i) => (
          <div
            key={i}
            style={{
              padding: '12px 14px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--r-card)',
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span className="mono small" style={{ color: 'var(--text-tertiary)' }}>
                {a.t}
              </span>
              <span style={{ fontSize: 13 }}>{a.agent}</span>
              <span className="mono small" style={{ color: 'var(--text-tertiary)' }}>
                {a.type}
              </span>
            </div>
            <div className="mono small" style={{ color: 'var(--text-secondary)' }}>
              {a.text}
            </div>
            {a.detail && (
              <div className="mono small" style={{ color: 'var(--text-tertiary)', marginTop: 2 }}>
                {a.detail}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
