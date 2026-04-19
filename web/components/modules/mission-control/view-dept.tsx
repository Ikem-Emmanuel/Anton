// Dept view — one horizontal rail per department, agent cards within.

import Link from 'next/link';
import { StatusGlow, TrustBadge } from '@/components/ui/primitives';
import { type Agent, DEPARTMENTS } from '@/lib/data';

function AgentCard({ a, deptColor }: { a: Agent; deptColor: string }) {
  const statusText =
    a.s === 'working' ? '● running' : a.s === 'complete' ? '✓ done' : a.s === 'error' ? '✕ blocked' : '○ idle';
  return (
    <Link
      href={`/agent/${encodeURIComponent(a.n)}`}
      className="block px-3.5 py-3 bg-surface border border-border-default rounded-card cursor-pointer hover:bg-hover"
      style={{ borderLeft: `2px solid ${deptColor}` }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <StatusGlow s={a.s} />
          <span className="text-sm">{a.n}</span>
        </div>
        <TrustBadge tier={a.t} />
      </div>
      <div className="mono small text-tertiary mb-2">{a.r}</div>
      <div className="mono small text-secondary">
        {statusText}
        {a.q ? ` · ${a.q} queued` : ` · ${a.last} ago`}
      </div>
    </Link>
  );
}

export function ViewDept({ agents }: { agents: Agent[] }) {
  const byDept = DEPARTMENTS.map((d) => ({ d, list: agents.filter((a) => a.d === d.id) })).filter((x) => x.list.length);
  return (
    <div className="flex-1 overflow-auto">
      {byDept.map(({ d, list }) => (
        <div key={d.id} className="border-b border-border-subtle px-5 py-4">
          <div className="flex items-baseline gap-2.5 mb-3">
            <span className="w-2 h-2 rounded-sm" style={{ background: d.color }} />
            <span className="mono caps text-primary text-[11px]">{d.name}</span>
            <span className="h-px bg-border-subtle flex-1" />
            <span className="mono small text-tertiary">
              {list.length} agents · {list.filter((x) => x.s === 'working').length} active ·{' '}
              {list.reduce((sum, a) => sum + (a.q || 0), 0)} queued
            </span>
          </div>
          <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
            {list.map((a) => (
              <AgentCard key={a.n} a={a} deptColor={d.color} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
