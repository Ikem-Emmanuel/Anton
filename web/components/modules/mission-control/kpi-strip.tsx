// Mission Control KPI strip — 8 compact metric cells across the top.

import { cn } from '@/lib/cn';

type KpiColor = 'work' | 'primary' | 'error' | 'secondary' | 'ok';

const COLOR: Record<KpiColor, string> = {
  work: 'text-work',
  primary: 'text-primary',
  error: 'text-error',
  secondary: 'text-secondary',
  ok: 'text-ok',
};

const KPIS: Array<{ label: string; val: string; sub: string; c: KpiColor }> = [
  { label: 'Active', val: '7', sub: 'of 15', c: 'work' },
  { label: 'Queue', val: '14', sub: 'tasks', c: 'primary' },
  { label: 'Approvals', val: '5', sub: 'pending', c: 'work' },
  { label: 'Handoffs', val: '23', sub: 'today', c: 'primary' },
  { label: 'Errors', val: '1', sub: 'Riley', c: 'error' },
  { label: 'Tokens', val: '142k', sub: '/day', c: 'secondary' },
  { label: 'Local', val: '89%', sub: 'routing', c: 'ok' },
  { label: 'Next brief', val: '27m', sub: '18:00', c: 'secondary' },
];

export function KpiStrip() {
  return (
    <div className="grid grid-cols-8 border-b border-border-subtle">
      {KPIS.map((k, i) => (
        <div key={k.label} className={cn('px-4 py-3', i < KPIS.length - 1 ? 'border-r border-border-subtle' : '')}>
          <div className="mono caps small text-tertiary text-[10px] mb-1">{k.label}</div>
          <div className="flex items-baseline gap-1.5">
            <span className={cn('text-xl mono', COLOR[k.c])}>{k.val}</span>
            <span className="mono small text-tertiary text-[10px]">{k.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
