'use client';
// Voice sub-tab — pipeline stages + latency budget + capture mode.

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { VOICE_BUDGETS, VOICE_MODES, VOICE_STAGES } from '@/lib/data';

export default function VoiceSettings() {
  const [mode, setMode] = useState<(typeof VOICE_MODES)[number]>('Push to talk (default)');
  return (
    <div className="max-w-[820px]">
      <h2 className="text-[20px] font-medium mb-5">Voice pipeline</h2>

      <div className="grid grid-cols-4 gap-2.5 mb-6">
        {VOICE_STAGES.map((s) => (
          <div key={s.k} className="px-3.5 py-3 bg-surface border border-border-subtle rounded-card">
            <div className="mono small text-tertiary">{s.k}</div>
            <div className="mono text-[13px] text-primary mt-0.5">{s.impl}</div>
            <div className="mono small text-tertiary mt-0.5">{s.note}</div>
          </div>
        ))}
      </div>

      <h3 className="mono caps text-sm font-medium mb-2.5">Latency budget · measured p50</h3>
      <div className="p-3.5 bg-surface border border-border-subtle rounded-card">
        {VOICE_BUDGETS.map(([stage, budget, actual]) => {
          const pct = Math.min(100, (actual / 1600) * 100);
          const over = actual > budget;
          return (
            <div key={stage} className="mb-2.5">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="mono small text-secondary w-[160px]">{stage}</span>
                <span className="mono small text-tertiary">budget {budget}ms</span>
                <span className="flex-1" />
                <span className={cn('mono small', over ? 'text-error' : 'text-ok')}>{actual}ms</span>
              </div>
              <div className="h-1 bg-page rounded-sm">
                <div
                  className={cn('h-full rounded-sm', over ? 'bg-error' : 'bg-accent')}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <h3 className="mono caps text-sm font-medium mt-7 mb-2.5">Mode</h3>
      <div className="flex gap-2">
        {VOICE_MODES.map((m) => {
          const active = m === mode;
          return (
            <button
              type="button"
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'mono small flex-1 p-3 rounded-card cursor-pointer text-xs border',
                active
                  ? 'bg-accent-soft text-accent border-accent'
                  : 'bg-transparent text-secondary border-border-default'
              )}
            >
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
}
