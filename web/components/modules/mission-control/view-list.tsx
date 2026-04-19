// List view — dense row per agent with status glow, current task, load bar,
// trust tier, and last-seen.

import Link from 'next/link';
import { DeptChip, StatusGlow, TrustBadge } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import type { Agent } from '@/lib/data';

const COLUMNS = '28px 140px 170px 1fr 170px 80px 70px';

function agentTask(a: Agent, i: number): string {
  if (a.s === 'working') {
    const tasks = ['draft_prd', 'read_file', 'run_sql', 'search', 'plan'];
    return `running: ${tasks[i % tasks.length]}`;
  }
  if (a.s === 'complete') return `last: committed ${1 + (i % 4)} change${i % 4 ? 's' : ''}`;
  if (a.s === 'error') return 'blocked: mcp.tool timeout';
  return 'clear';
}

function barWidth(a: Agent, i: number): number {
  if (a.s === 'working') return 40 + ((i * 13) % 50);
  if (a.s === 'complete') return 72;
  if (a.s === 'error') return 18;
  return 8 + ((i * 7) % 12);
}

function barColor(a: Agent): string {
  if (a.s === 'error') return 'bg-error';
  if (a.s === 'complete') return 'bg-ok';
  if (a.s === 'working') return 'bg-accent';
  return 'bg-text-disabled';
}

function AgentRow({ a, i }: { a: Agent; i: number }) {
  return (
    <Link
      href={`/agent/${encodeURIComponent(a.n)}`}
      className="grid items-center gap-4 px-5 py-2.5 border-b border-border-subtle cursor-pointer hover:bg-hover"
      style={{ gridTemplateColumns: COLUMNS }}
    >
      <StatusGlow s={a.s} />
      <div>
        <div className="text-sm text-primary">{a.n}</div>
        <div className="mono small text-tertiary">{a.r}</div>
      </div>
      <DeptChip id={a.d} />
      <div className="mono small text-secondary">{agentTask(a, i)}</div>
      <div className="relative h-2 bg-border-subtle rounded-sm overflow-hidden">
        <div
          className={cn('absolute top-0 left-0 bottom-0', barColor(a), a.s === 'idle' ? 'opacity-40' : '')}
          style={{ width: `${barWidth(a, i)}%` }}
        />
      </div>
      <TrustBadge tier={a.t} />
      <div className="mono small text-tertiary text-right">
        {a.q > 0 ? <span className="text-work">{a.q} queued</span> : `${a.last} ago`}
      </div>
    </Link>
  );
}

export function ViewList({ agents }: { agents: Agent[] }) {
  return (
    <div className="flex-1 overflow-auto">
      <div
        className="grid gap-4 px-5 py-2.5 border-b border-border-default mono caps"
        style={{ gridTemplateColumns: COLUMNS }}
      >
        <span />
        <span className="text-tertiary text-[10px]">agent</span>
        <span className="text-tertiary text-[10px]">team</span>
        <span className="text-tertiary text-[10px]">now</span>
        <span className="text-tertiary text-[10px]">load</span>
        <span className="text-tertiary text-[10px]">trust</span>
        <span className="text-tertiary text-[10px] text-right">seen</span>
      </div>
      {agents.map((a, i) => (
        <AgentRow key={a.n} a={a} i={i} />
      ))}
    </div>
  );
}
