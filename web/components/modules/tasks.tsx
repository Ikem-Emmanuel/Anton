'use client';
// Tasks — four-column kanban tied to the agent state machine: FOR YOU (Noel
// owns the next move), IN FLIGHT (an agent is working, progress visible), DONE
// TODAY (shipped), BLOCKED (stalled, reason surfaced). Not a todo list —
// every card has an owner, an actor, and a why.

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { TASKS, type Task, type TaskColumn } from '@/lib/data';

type Column = { id: TaskColumn; label: string; dotClass: string };

const COLUMNS: Column[] = [
  { id: 'incoming', label: 'FOR YOU', dotClass: 'bg-work' },
  { id: 'flight', label: 'IN FLIGHT', dotClass: 'bg-accent' },
  { id: 'done', label: 'DONE TODAY', dotClass: 'bg-ok' },
  { id: 'blocked', label: 'BLOCKED', dotClass: 'bg-error' },
];

function RiskBadge({ r }: { r: 'L' | 'M' | 'H' }) {
  const color =
    r === 'H' ? 'text-error border-error' : r === 'M' ? 'text-work border-work' : 'text-tertiary border-border-default';
  return <span className={cn('mono text-[9px] px-1 border rounded-[3px]', color)}>{r}</span>;
}

function TaskCard({ t }: { t: Task }) {
  const isAnton = t.actor === 'Anton';
  const isNoel = t.owner === 'Noel';
  const leftClass = isNoel ? 'border-l-work' : isAnton ? 'border-l-accent' : 'border-l-border-strong';
  return (
    <article
      className={cn(
        'px-3 py-2.5 bg-surface border border-border-subtle rounded-card cursor-pointer border-l-2',
        leftClass
      )}
    >
      <div className="text-xs text-primary leading-[1.4] mb-1.5">{t.title}</div>
      <div className={cn('flex items-center gap-1.5', t.pct != null || t.why ? 'mb-2' : '')}>
        <span className="mono text-[10px] text-tertiary">
          {isAnton ? '◎ ' : ''}
          {t.actor}
        </span>
        <span className="flex-1" />
        <span className="mono text-[10px] text-tertiary">{t.age}</span>
        {t.risk && <RiskBadge r={t.risk} />}
      </div>
      {t.pct != null && (
        <>
          <div className="h-[3px] bg-raised rounded-sm overflow-hidden mb-1.5">
            <div className={cn('h-full', t.pct === 100 ? 'bg-ok' : 'bg-accent')} style={{ width: `${t.pct}%` }} />
          </div>
          <div className="mono text-[10px] text-secondary">
            {t.step} · <span className="text-tertiary">{t.pct}%</span>
          </div>
        </>
      )}
      {t.why && t.pct == null && <div className="mono text-[10px] text-tertiary leading-[1.5]">{t.why}</div>}
    </article>
  );
}

function ColumnPane({ col, items }: { col: Column; items: Task[] }) {
  return (
    <div className="flex flex-col border-r border-border-subtle min-h-0">
      <header className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle">
        <span className={cn('w-1.5 h-1.5 rounded-full', col.dotClass)} />
        <span className="mono small caps text-secondary tracking-[0.1em] flex-1">{col.label}</span>
        <span className="mono small text-tertiary">{items.length}</span>
      </header>
      <div className="flex-1 overflow-auto p-2.5 flex flex-col gap-2">
        {items.map((t) => (
          <TaskCard key={t.id} t={t} />
        ))}
      </div>
    </div>
  );
}

function TaskHeader() {
  const waiting = TASKS.filter((t) => t.col === 'incoming').length;
  const flight = TASKS.filter((t) => t.col === 'flight').length;
  const blocked = TASKS.filter((t) => t.col === 'blocked').length;
  return (
    <div className="flex items-center px-6 py-4 border-b border-border-subtle">
      <div>
        <div className="text-xl text-primary font-medium">Tasks</div>
        <div className="mono small text-tertiary mt-0.5">
          {waiting} waiting on you · {flight} agents working · {blocked} blocked
        </div>
      </div>
      <span className="flex-1" />
      <Button size="sm" variant="primary">
        + delegate task
      </Button>
    </div>
  );
}

export default function Tasks() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TaskHeader />
      <div className="flex-1 grid grid-cols-4 overflow-hidden min-h-0">
        {COLUMNS.map((col) => (
          <ColumnPane key={col.id} col={col} items={TASKS.filter((t) => t.col === col.id)} />
        ))}
      </div>
    </div>
  );
}
