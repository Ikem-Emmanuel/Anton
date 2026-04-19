// Grid view — dense 5-wide card grid. Empty slots render as "+ delegate"
// placeholders so the grid always fills to at least 30 cells.

import Link from 'next/link';
import { StatusGlow, TrustBadge } from '@/components/ui/primitives';
import { type Agent, DEPARTMENTS } from '@/lib/data';

function AgentGridCard({ a }: { a: Agent }) {
  const dept = DEPARTMENTS.find((x) => x.id === a.d);
  return (
    <Link
      href={`/agent/${encodeURIComponent(a.n)}`}
      className="relative block p-3.5 bg-surface border border-border-default rounded-card min-h-[110px] cursor-pointer hover:border-border-strong hover:bg-hover"
    >
      <div className="absolute top-3 right-3">
        <StatusGlow s={a.s} />
      </div>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="w-1 h-1 rounded-[1px]" style={{ background: dept?.color }} />
        <span className="mono small text-tertiary uppercase tracking-[0.1em] text-[10px]">{dept?.name}</span>
      </div>
      <div className="text-[15px] mb-0.5">{a.n}</div>
      <div className="mono small text-tertiary mb-3 text-[11px]">{a.r}</div>
      <div className="flex items-center justify-between">
        <TrustBadge tier={a.t} />
        <span className={`mono small text-[11px] ${a.q ? 'text-work' : 'text-tertiary'}`}>
          {a.q ? `${a.q} queued` : a.last}
        </span>
      </div>
    </Link>
  );
}

export function ViewGrid({ agents }: { agents: Agent[] }) {
  const pad = Math.max(0, 30 - agents.length);
  return (
    <div className="flex-1 p-5 overflow-auto">
      <div className="grid grid-cols-5 gap-2.5">
        {agents.map((a) => (
          <AgentGridCard key={a.n} a={a} />
        ))}
        {Array.from({ length: pad }).map((_, i) => (
          <div
            key={`placeholder-${i}`}
            className="mono p-3.5 border border-dashed border-border-default rounded-card min-h-[110px] flex items-center justify-center text-disabled text-xs"
          >
            + delegate
          </div>
        ))}
      </div>
    </div>
  );
}
