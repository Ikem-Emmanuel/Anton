'use client';

import { useState } from 'react';
import { Kbd } from '@/components/ui/primitives';
import { MEMORIES } from '@/lib/data';

const HL_COLOR: Record<string, string> = {
  yellow: 'var(--hl-yellow)',
  coral: 'var(--hl-coral)',
  blue: 'var(--hl-blue)',
};

const TYPE_ICON: Record<string, string> = {
  preference: '◇',
  decision: '◆',
  fact: '■',
  conversation: '▷',
};

export default function MemoryBrowser() {
  const [active, setActive] = useState(0);
  const filters = ['All', 'Facts', 'Decisions', 'Preferences', 'Conversations'];

  return (
    <div style={{ padding: '24px 32px', height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <input
          placeholder="search memory — full-text or semantic"
          style={{
            flex: 1,
            padding: '10px 14px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--r-card)',
            fontSize: 14,
            color: 'var(--text-primary)',
          }}
        />
        <Kbd>⌘</Kbd>
        <Kbd>F</Kbd>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {filters.map((c, i) => {
          const isActive = i === active;
          return (
            <button
              key={c}
              onClick={() => setActive(i)}
              className="mono small"
              style={{
                padding: '4px 10px',
                background: isActive ? 'var(--accent-soft)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border-default)'}`,
                borderRadius: 'var(--r-chip)',
                cursor: 'pointer',
              }}
            >
              {c}
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <span className="mono small" style={{ color: 'var(--text-tertiary)' }}>
          1,487 memories · 12 edited this week
        </span>
      </div>

      {MEMORIES.map((m, i) => (
        <div
          key={i}
          style={{
            padding: '14px 16px',
            marginBottom: 8,
            cursor: 'pointer',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--r-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span className="mono" style={{ color: 'var(--text-tertiary)', width: 14, textAlign: 'center' }}>
              {TYPE_ICON[m.type]}
            </span>
            <span className="mono small caps" style={{ color: 'var(--text-tertiary)' }}>
              {m.type}
            </span>
            <span style={{ flex: 1 }} />
            <span className="mono small" style={{ color: 'var(--text-tertiary)' }}>
              {m.src}
            </span>
            <span style={{ display: 'flex', gap: 2 }}>
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: n <= m.conf ? 'var(--ok)' : 'var(--border-default)',
                  }}
                />
              ))}
            </span>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.55 }}>
            <span
              style={{
                background: HL_COLOR[m.hl],
                color: '#14120F',
                padding: '1px 3px',
                boxDecorationBreak: 'clone',
                WebkitBoxDecorationBreak: 'clone',
              }}
            >
              {m.title}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
