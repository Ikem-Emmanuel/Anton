'use client';

import { useState } from 'react';
import { ACTIVITY, type ActivityType } from '@/lib/data';

const TYPE_COLOR: Record<ActivityType, string> = {
  tool: 'var(--info)',
  think: 'var(--text-secondary)',
  write: 'var(--accent)',
  search: 'var(--hl-blue)',
  handoff: 'var(--work)',
  complete: 'var(--ok)',
  approval: 'var(--work)',
  system: 'var(--text-tertiary)',
};

const VERBOSITY_LABEL = ['Summary', 'Normal', 'Full trace'];

export default function ActivityTimeline() {
  const [verbosity, setVerbosity] = useState(1);

  return (
    <div style={{ padding: '24px 32px', height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div className="mono caps" style={{ color: 'var(--text-tertiary)' }}>
            ACTIVITY
          </div>
          <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em' }}>247 events today</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="mono small" style={{ color: 'var(--text-tertiary)' }}>
            verbosity
          </span>
          {[0, 1, 2].map((v) => (
            <button
              key={v}
              onClick={() => setVerbosity(v)}
              className="mono small"
              style={{
                padding: '4px 10px',
                background: verbosity === v ? 'var(--accent-soft)' : 'transparent',
                color: verbosity === v ? 'var(--accent)' : 'var(--text-secondary)',
                border: `1px solid ${verbosity === v ? 'var(--accent)' : 'var(--border-default)'}`,
                borderRadius: 'var(--r-chip)',
                cursor: 'pointer',
              }}
            >
              {VERBOSITY_LABEL[v]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {['Marcus', 'James', 'Ada', 'Kai', 'Priya', 'Sarah'].map((n) => (
          <button
            key={n}
            className="mono small"
            style={{
              padding: '3px 9px',
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--r-chip)',
              cursor: 'pointer',
            }}
          >
            {n} ×
          </button>
        ))}
      </div>

      {ACTIVITY.map((a, i) => (
        <div
          key={i}
          style={{
            padding: '10px 14px',
            marginBottom: 4,
            cursor: 'pointer',
            border: '1px solid var(--border-subtle)',
            borderLeft: `2px solid ${TYPE_COLOR[a.type]}`,
            borderRadius: 0,
            background: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="mono small" style={{ color: 'var(--text-tertiary)', width: 60 }}>
              {a.t}
            </span>
            <span className="mono small caps" style={{ color: TYPE_COLOR[a.type], width: 64 }}>
              {a.type}
            </span>
            <span style={{ fontSize: 13, width: 72 }}>{a.agent}</span>
            <span className="mono small" style={{ color: 'var(--text-secondary)', flex: 1 }}>
              {a.text}
            </span>
            {verbosity >= 1 && a.detail && (
              <span className="mono small" style={{ color: 'var(--text-tertiary)' }}>
                {a.detail}
              </span>
            )}
          </div>
          {verbosity >= 2 && (
            <div
              className="mono small"
              style={{
                marginTop: 8,
                paddingTop: 8,
                borderTop: '1px dashed var(--border-subtle)',
                color: 'var(--text-tertiary)',
                paddingLeft: 72,
              }}
            >
              reasoning: evaluated 3 candidate files · chose specs/onboarding.md based on recency
              <br />
              tokens: in 412 · out 128 · cost $0.0003 · model qwen3-8b-local
              <br />
              parent: &lt;delegate #abc7&gt; · permalink /activity/e-{14852 + i}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
