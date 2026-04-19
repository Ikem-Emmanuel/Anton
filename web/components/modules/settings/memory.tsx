'use client';
// Memory sub-tab — distillation / retrieval / consolidation toggles and
// per-agent scope summary.

import { cn } from '@/lib/cn';
import { MEMORY_STATS, MEMORY_TOGGLES, type MemoryToggle } from '@/lib/data';

function Toggle({ on }: { on: boolean }) {
  return (
    <div className={cn('w-[34px] h-5 rounded-[10px] relative cursor-pointer', on ? 'bg-accent' : 'bg-border-default')}>
      <div
        className={cn(
          'absolute top-0.5 w-4 h-4 rounded-full bg-page transition-[left] duration-[120ms]',
          on ? 'left-4' : 'left-0.5'
        )}
      />
    </div>
  );
}

function ToggleRow({ t }: { t: MemoryToggle }) {
  return (
    <div className="flex items-center px-4 py-3.5 bg-surface border border-border-subtle rounded-card mb-2">
      <div className="flex-1">
        <div className="text-sm font-medium">{t.t}</div>
        <div className="mono small text-tertiary mt-0.5">{t.s}</div>
      </div>
      <Toggle on={t.on} />
    </div>
  );
}

export default function MemorySettings() {
  return (
    <div className="max-w-[880px]">
      <h2 className="text-[20px] font-medium mb-5">Memory</h2>

      <div className="grid grid-cols-4 gap-2.5 mb-6">
        {MEMORY_STATS.map(([label, value]) => (
          <div key={label} className="px-3.5 py-3 bg-surface border border-border-subtle rounded-card">
            <div className="mono small text-tertiary">{label}</div>
            <div className="text-lg font-medium mt-0.5">{value}</div>
          </div>
        ))}
      </div>

      {MEMORY_TOGGLES.map((t) => (
        <ToggleRow key={t.t} t={t} />
      ))}

      <h3 className="text-base font-medium mt-7 mb-2.5">Scope controls</h3>
      <div className="mono small text-secondary leading-[1.7] p-3.5 bg-surface border border-border-subtle rounded-card">
        <div>✓ engineering agents can read: engineering decisions, PRDs, codebase index</div>
        <div>✗ engineering agents cannot read: finance, personal, health</div>
        <div>✓ finance agents can read: finance, shared facts</div>
        <div>✓ anton core can read: all scopes</div>
      </div>
    </div>
  );
}
