'use client';
// Trust tiers sub-tab — per-agent autonomy level selector.

import { DeptChip } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import { AGENTS } from '@/lib/data';

const TIERS = ['SUGGEST', 'DRAFT', 'EXECUTE', 'AUTO'];
const TIER_INDEX: Record<string, number> = { green: 3, amber: 1, red: 0 };

export default function TrustSettings() {
  return (
    <div className="max-w-[860px]">
      <h2 className="text-[20px] font-medium mb-2">Trust tiers</h2>
      <p className="text-secondary mb-7 max-w-[620px]">
        Each agent has an autonomy level. Green runs without asking. Amber confirms before acting. Red waits on you.
      </p>
      <div className="border border-border-default rounded-card overflow-hidden">
        <div
          className="mono caps grid px-4 py-2.5 border-b border-border-default bg-surface"
          style={{ gridTemplateColumns: '1fr 100px 260px 80px' }}
        >
          <span className="text-tertiary">Agent</span>
          <span className="text-tertiary">Team</span>
          <span className="text-tertiary">Autonomy</span>
          <span className="text-tertiary text-right">Last</span>
        </div>
        {AGENTS.slice(0, 10).map((a, i, arr) => {
          const active = TIER_INDEX[a.t];
          return (
            <div
              key={a.n}
              className={cn(
                'grid items-center px-4 py-2.5',
                i === arr.length - 1 ? '' : 'border-b border-border-subtle'
              )}
              style={{ gridTemplateColumns: '1fr 100px 260px 80px' }}
            >
              <div>
                <div className="text-sm">{a.n}</div>
                <div className="mono small text-tertiary">{a.r}</div>
              </div>
              <DeptChip id={a.d} />
              <div className="flex border border-border-default rounded-chip overflow-hidden">
                {TIERS.map((t, ti) => (
                  <button
                    type="button"
                    key={t}
                    className={cn(
                      'mono small flex-1 px-1 py-1 cursor-pointer',
                      ti === active ? 'bg-accent-soft text-accent' : 'bg-transparent text-secondary',
                      ti < TIERS.length - 1 ? 'border-r border-border-default' : ''
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <span className="mono small text-tertiary text-right">{a.last}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
