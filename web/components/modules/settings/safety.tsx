'use client';
// Safety sub-tab — threat surface status + destructive actions allowlist.

import { cn } from '@/lib/cn';
import { SAFETY_DESTRUCTIVE_ACTIONS, SAFETY_ROWS, type SafetyStatus } from '@/lib/data';

const STATUS_COLOR: Record<SafetyStatus, string> = {
  ok: 'text-ok',
  warn: 'text-work',
  error: 'text-error',
};

export default function SafetySettings() {
  return (
    <div className="max-w-[900px]">
      <h2 className="text-[20px] font-medium mb-5">Safety &amp; data</h2>

      <h3 className="mono caps text-secondary text-sm font-medium mb-2.5">Threat surface</h3>
      <div className="border border-border-default rounded-card overflow-hidden mb-7">
        {SAFETY_ROWS.map(([label, detail, status], i, arr) => (
          <div
            key={label}
            className={cn('grid items-center px-4 py-3', i === arr.length - 1 ? '' : 'border-b border-border-subtle')}
            style={{ gridTemplateColumns: '220px 1fr 80px' }}
          >
            <span className="text-[13px]">{label}</span>
            <span className="mono small text-secondary">{detail}</span>
            <span className={cn('mono small text-right', STATUS_COLOR[status])}>{status.toUpperCase()}</span>
          </div>
        ))}
      </div>

      <h3 className="mono caps text-secondary text-sm font-medium mb-2.5">Destructive actions · always ask</h3>
      <div className="grid grid-cols-2 gap-2">
        {SAFETY_DESTRUCTIVE_ACTIONS.map((x) => (
          <label
            key={x}
            className="flex items-center gap-2.5 px-3.5 py-2.5 bg-surface border border-border-subtle rounded-card cursor-pointer"
          >
            <input type="checkbox" defaultChecked className="accent-[var(--accent)]" />
            <span className="text-[13px]">{x}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
