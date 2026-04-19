'use client';
// Usage — telemetry dashboard. How hard Anton + agents worked this period.
// KPI cards at top (tokens / tool calls / wake time / cloud cost), daily
// bar chart + per-agent breakdown below, Anton narration at the bottom
// explaining the numbers in plain language.

import { cn } from '@/lib/cn';
import {
  USAGE_BY_AGENT,
  USAGE_DAYS,
  USAGE_METRICS,
  type UsageByAgent,
  type UsageDay,
  type UsageMetric,
} from '@/lib/data';

type Period = '24h' | '7d' | '30d' | '90d';

function PeriodTabs({ period, onPeriod }: { period: Period; onPeriod: (p: Period) => void }) {
  return (
    <div className="mono small flex gap-1">
      {(['24h', '7d', '30d', '90d'] as const).map((p) => (
        <button
          type="button"
          key={p}
          onClick={() => onPeriod(p)}
          className={cn(
            'px-2.5 py-0.5 text-[10px] border border-border-default rounded-chip cursor-pointer',
            p === period ? 'bg-hover text-primary' : 'bg-transparent text-secondary hover:bg-hover/40'
          )}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

function MetricCard({ m }: { m: UsageMetric }) {
  const trendUp = m.trend.startsWith('+');
  return (
    <div className="p-4 bg-surface border border-border-subtle rounded-card">
      <div className="mono small caps text-tertiary mb-2 text-[9px]">{m.k}</div>
      <div className="text-2xl text-primary font-medium mono mb-1">{m.v}</div>
      <div className="mono small text-tertiary text-[10px]">{m.sub}</div>
      <div className={cn('mono small mt-2 text-[10px]', trendUp ? 'text-work' : 'text-ok')}>{m.trend} vs prev</div>
    </div>
  );
}

function DailyChart({ days }: { days: UsageDay[] }) {
  const max = Math.max(...days.map((d) => d.v));
  return (
    <div className="p-6 border-r border-border-subtle">
      <div className="mono small caps text-tertiary mb-4 text-[9px]">DAILY TOKEN USE (thousands)</div>
      <div className="flex items-end gap-2.5 h-[160px] px-1">
        {days.map((d) => (
          <div key={d.d} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="mono small text-primary text-[10px]">{d.v}</div>
            <div className="w-full bg-accent rounded-t-sm min-h-1" style={{ height: `${(d.v / max) * 100}%` }} />
            <div className="mono small text-tertiary text-[10px]">{d.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentRow({ a }: { a: UsageByAgent }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-[60px] text-xs text-primary">{a.a}</div>
      <div className="flex-1 h-1.5 bg-surface rounded-sm overflow-hidden">
        <div className="h-full bg-accent" style={{ width: `${a.bar}%` }} />
      </div>
      <div className="mono small w-[70px] text-right text-secondary text-[11px]">{a.tok}K tok</div>
      <div className="mono small w-[70px] text-right text-tertiary text-[11px]">${a.cost.toFixed(2)}</div>
    </div>
  );
}

function ByAgent() {
  return (
    <div className="p-6">
      <div className="mono small caps text-tertiary mb-4 text-[9px]">BY AGENT</div>
      {USAGE_BY_AGENT.map((a) => (
        <AgentRow key={a.a} a={a} />
      ))}
    </div>
  );
}

function AntonNotes() {
  return (
    <div className="px-6 py-5 bg-surface border-t border-border-subtle">
      <div className="mono small caps text-accent mb-2 text-[9px]">◎ ANTON NOTES</div>
      <div className="text-[13px] text-primary leading-[1.7] max-w-[720px]">
        90% of LLM work stayed local (Qwen3 8B). Cloud usage up because Alex ran deeper creator-tier research. Thursday
        was the busiest day — launch sync and 3 parallel research threads. Total cloud cost: <b>$47.20</b>, well under
        the $150/mo budget you set.
      </div>
    </div>
  );
}

export default function Usage() {
  // Period is wired as state even though the mock data is period-agnostic —
  // lets us demo the UI cleanly without fake mocks per period.
  const period: Period = '7d';
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto">
      <header className="flex items-center px-6 py-4 border-b border-border-subtle">
        <div>
          <div className="text-xl text-primary font-medium mb-0.5">Usage</div>
          <div className="mono small text-tertiary">Last 7 days · Anton + 15 agents</div>
        </div>
        <span className="flex-1" />
        <PeriodTabs period={period} onPeriod={() => {}} />
      </header>
      <div className="p-6 grid grid-cols-4 gap-3 border-b border-border-subtle">
        {USAGE_METRICS.map((m) => (
          <MetricCard key={m.k} m={m} />
        ))}
      </div>
      <div className="grid grid-cols-2">
        <DailyChart days={USAGE_DAYS} />
        <ByAgent />
      </div>
      <AntonNotes />
    </div>
  );
}
