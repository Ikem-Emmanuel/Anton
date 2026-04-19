'use client';
// Team — department org chart. Anton on top, 6 dept cards below with their
// agent rosters. Each agent row deep-links into /agent/[name]. Bottom panel
// shows the top handoff routes across the team for the last week.

import Link from 'next/link';
import { StatusGlow, TrustBadge } from '@/components/ui/primitives';
import { AGENTS, DEPARTMENTS } from '@/lib/data';

const HANDOFF_ROUTES: Array<[string, string, number, string]> = [
  ['Marcus', 'Ada', 34, 'UI review'],
  ['Sarah', 'Kai', 22, 'SEO pass'],
  ['James', 'Ben', 18, 'QA gate'],
  ['Alex', 'Marcus', 14, 'PRD → engineering'],
  ['Priya', 'Alex', 9, 'data → product'],
];

const MAX_HANDOFFS = 34;

function DeptCard({ deptId, deptName, deptColor }: { deptId: string; deptName: string; deptColor: string }) {
  const agents = AGENTS.filter((a) => a.d === deptId);
  const active = agents.filter((a) => a.s === 'working').length;
  return (
    <div
      className="bg-surface border border-border-subtle rounded-card px-4 py-4 flex flex-col gap-2.5"
      style={{ borderTop: `3px solid ${deptColor}` }}
    >
      <div className="flex items-baseline gap-2">
        <span className="text-base font-medium">{deptName}</span>
        <span className="flex-1" />
        <span className="mono small text-tertiary">{agents.length}</span>
      </div>
      <div className="flex gap-2 items-center">
        <span className="mono small caps text-tertiary text-[10px]">
          {active > 0 ? <span className="text-work">● {active} active</span> : <span>○ idle</span>}
        </span>
      </div>
      <div className="flex flex-col gap-1 mt-1">
        {agents.map((a) => (
          <Link
            key={a.n}
            href={`/agent/${encodeURIComponent(a.n)}`}
            className="flex items-center gap-2 px-2 py-1.5 cursor-pointer bg-page border border-border-subtle rounded-sm hover:bg-hover"
          >
            <StatusGlow s={a.s} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium">{a.n}</div>
              <div className="mono small text-tertiary text-[10px]">{a.r}</div>
            </div>
            <TrustBadge tier={a.t} />
          </Link>
        ))}
      </div>
    </div>
  );
}

function HandoffRow({ from, to, n, why }: { from: string; to: string; n: number; why: string }) {
  const pct = (n / MAX_HANDOFFS) * 100;
  return (
    <div className="flex items-center gap-2.5">
      <span className="mono small w-20 text-primary">{from}</span>
      <span className="mono text-tertiary">→</span>
      <span className="mono small w-20 text-primary">{to}</span>
      <div className="flex-1 h-1 bg-page rounded-sm relative">
        <div className="absolute left-0 top-0 h-full bg-accent rounded-sm" style={{ width: `${pct}%` }} />
      </div>
      <span className="mono small text-secondary w-7 text-right">{n}</span>
      <span className="mono small text-tertiary w-[120px]">{why}</span>
    </div>
  );
}

export default function DeptChart() {
  return (
    <div className="px-8 py-6 h-full overflow-auto">
      <div className="mono caps text-tertiary">TEAM / DEPARTMENTS</div>
      <h1 className="text-[26px] font-medium mt-1 mb-2">Departments</h1>
      <p className="text-secondary mt-0 mb-7 max-w-[720px]">
        15 agents across 6 departments. Anton sits above — routes work, holds context, enforces trust tiers.
      </p>

      <div className="flex justify-center mb-1.5">
        <div className="px-6 py-3.5 bg-surface border-2 border-accent rounded-panel text-center min-w-[240px]">
          <div className="mono small caps text-accent">CORE · ANTON</div>
          <div className="text-lg font-medium mt-1">◉ Anton</div>
          <div className="mono small text-tertiary mt-0.5">personal OS · 3d 14h uptime</div>
        </div>
      </div>
      <div className="flex justify-center mb-5">
        <div className="w-0.5 h-6 bg-border-strong" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {DEPARTMENTS.map((dept) => (
          <DeptCard key={dept.id} deptId={dept.id} deptName={dept.name} deptColor={dept.color} />
        ))}
      </div>

      <div className="mt-8">
        <div className="mono caps text-tertiary mb-2">TOP HAND-OFF ROUTES · LAST 7 DAYS</div>
        <div className="flex flex-col gap-1.5 bg-surface border border-border-subtle rounded-card p-3.5">
          {HANDOFF_ROUTES.map(([from, to, n, why]) => (
            <HandoffRow key={`${from}-${to}`} from={from} to={to} n={n} why={why} />
          ))}
        </div>
      </div>
    </div>
  );
}
