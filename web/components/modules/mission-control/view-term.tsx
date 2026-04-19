// Terminal view — ps-like listing. Status char + name + dept + trust + role
// + queue/idle, monospace throughout, blinking cursor at the end.

import { cn } from '@/lib/cn';
import { type Agent, DEPARTMENTS } from '@/lib/data';

const STATUS_CHAR: Record<Agent['s'], string> = {
  working: '●',
  complete: '✓',
  error: '✕',
  idle: '○',
};

const STATUS_COLOR: Record<Agent['s'], string> = {
  working: 'text-work',
  complete: 'text-ok',
  error: 'text-error',
  idle: 'text-tertiary',
};

const TRUST_COLOR: Record<Agent['t'], string> = {
  green: 'text-ok',
  amber: 'text-work',
  red: 'text-error',
};

export function ViewTerm({ agents }: { agents: Agent[] }) {
  return (
    <div className="flex-1 overflow-auto px-5 py-4 mono text-[13px] leading-[1.7]">
      <div className="text-tertiary"># anton status · 2026-04-18 14:02:17 · up 3d 14h</div>
      <div className="text-tertiary mb-2"># {agents.length} agents matching filter · ctrl-c to exit</div>
      {agents.map((a) => {
        const dept = DEPARTMENTS.find((x) => x.id === a.d);
        return (
          <div key={a.n} className="flex gap-3 items-baseline">
            <span className={cn('w-3.5', STATUS_COLOR[a.s])}>{STATUS_CHAR[a.s]}</span>
            <span className="text-primary w-20">{a.n.padEnd(8, ' ')}</span>
            <span className="w-[70px]" style={{ color: dept?.color }}>
              [{a.d}]
            </span>
            <span className={cn('w-[90px]', TRUST_COLOR[a.t])}>{`trust:${a.t}`}</span>
            <span className="text-secondary flex-1">{a.r.toLowerCase()}</span>
            <span className={a.q ? 'text-work' : 'text-tertiary'}>{a.q ? `q:${a.q}` : `idle ${a.last}`}</span>
          </div>
        );
      })}
      <div className="mt-4 text-accent">▊</div>
    </div>
  );
}
