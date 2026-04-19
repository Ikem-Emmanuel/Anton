'use client';
// Inbox — triage surface. Anton has already decided what each thread is
// (drafted/filed/approval/review/flagged/archived). The user scans the left
// list, pops open the right detail, and either confirms Anton's move or
// overrides it. Filters at top narrow the left list.

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/ui/filter-chip';
import { cn } from '@/lib/cn';
import { INBOX, type InboxKind, type InboxThread } from '@/lib/data';

const KIND_STYLE: Record<InboxKind, { className: string; label: string }> = {
  drafted: { className: 'text-accent', label: 'DRAFTED' },
  filed: { className: 'text-tertiary', label: 'FILED' },
  approval: { className: 'text-work', label: 'APPROVAL' },
  review: { className: 'text-info', label: 'REVIEW' },
  read: { className: 'text-tertiary', label: 'READ' },
  archived: { className: 'text-tertiary', label: 'ARCHIVED' },
  flagged: { className: 'text-error', label: 'FLAGGED' },
};

type Filter = 'all' | 'unread' | 'approval' | 'drafted';
const FILTERS: Filter[] = ['all', 'unread', 'approval', 'drafted'];

function matchesFilter(thread: InboxThread, filter: Filter): boolean {
  if (filter === 'all') return true;
  if (filter === 'unread') return thread.unread;
  if (filter === 'approval') return thread.k === 'approval';
  if (filter === 'drafted') return thread.k === 'drafted';
  return true;
}

function ThreadRow({ t, selected, onSelect }: { t: InboxThread; selected: boolean; onSelect: () => void }) {
  const ks = KIND_STYLE[t.k];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left px-4 py-2.5 cursor-pointer border-b border-border-subtle border-l-2',
        selected ? 'bg-hover border-l-accent' : 'bg-transparent border-l-transparent hover:bg-hover/40'
      )}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        {t.unread && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
        <span className={cn('flex-1 text-xs text-primary truncate', t.unread ? 'font-medium' : 'font-normal')}>
          {t.from}
        </span>
        <span className="mono text-[10px] text-tertiary">{t.t}</span>
      </div>
      <div className="text-xs text-secondary truncate mb-1">{t.subj}</div>
      <div className="text-[11px] text-tertiary leading-[1.4] line-clamp-2 mb-1.5">{t.summary}</div>
      <div className={cn('mono text-[9px] tracking-[0.08em]', ks.className)}>
        {t.k === 'drafted' && '◎ '}
        {ks.label}
      </div>
    </button>
  );
}

function ThreadDetail({ thread }: { thread: InboxThread }) {
  const ks = KIND_STYLE[thread.k];
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <header className="px-6 py-4 border-b border-border-subtle">
        <div className="text-base text-primary mb-1.5">{thread.subj}</div>
        <div className="flex items-center gap-2.5 text-xs text-secondary">
          <span>{thread.from}</span>
          <span className="text-tertiary">·</span>
          <span className="mono small text-tertiary">{thread.t} ago</span>
          <span className="flex-1" />
          {thread.tags.map((tag) => (
            <span
              key={tag}
              className="mono text-[9px] px-1.5 py-0.5 bg-surface text-secondary border border-border-subtle rounded-chip"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>
      <div className="flex-1 overflow-auto px-6 py-5 flex flex-col gap-4">
        {thread.body && (
          <section className="p-4 bg-surface border border-border-subtle rounded-card">
            <div className="mono small caps text-tertiary mb-2">ORIGINAL MESSAGE</div>
            <div className="text-[13px] text-primary leading-[1.6] whitespace-pre-wrap">{thread.body}</div>
          </section>
        )}

        <section className="p-4 border border-accent rounded-card bg-accent-soft">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-accent">◎</span>
            <span className="mono small caps text-accent tracking-[0.1em]">ANTON — {ks.label}</span>
          </div>
          <div className="text-[13px] text-primary leading-[1.6] mb-3">{thread.summary}</div>

          {thread.draft && (
            <div className="p-3 bg-page border border-border-default rounded-card mb-3">
              <div className="mono small text-tertiary mb-1.5">Draft reply</div>
              <div className="text-[13px] text-primary leading-[1.6] italic whitespace-pre-wrap">{thread.draft}</div>
            </div>
          )}

          <DetailActions kind={thread.k} />
        </section>
      </div>
    </div>
  );
}

function DetailActions({ kind }: { kind: InboxKind }) {
  if (kind === 'drafted') {
    return (
      <div className="flex gap-1.5">
        <Button size="sm" variant="primary">
          send as is
        </Button>
        <Button size="sm" variant="secondary">
          edit
        </Button>
        <Button size="sm" variant="secondary">
          write yourself
        </Button>
      </div>
    );
  }
  if (kind === 'approval') {
    return (
      <div className="flex gap-1.5">
        <Button size="sm" variant="primary">
          approve & send
        </Button>
        <Button size="sm" variant="secondary">
          open in approvals
        </Button>
        <Button size="sm" variant="secondary">
          reject
        </Button>
      </div>
    );
  }
  if (kind === 'filed') {
    return (
      <div className="flex gap-1.5">
        <Button size="sm" variant="secondary">
          view file
        </Button>
        <Button size="sm" variant="secondary">
          unfile
        </Button>
      </div>
    );
  }
  if (kind === 'archived') {
    return (
      <div className="flex gap-1.5">
        <Button size="sm" variant="secondary">
          restore
        </Button>
        <Button size="sm" variant="secondary">
          why archived?
        </Button>
      </div>
    );
  }
  // review | flagged | read
  return (
    <div className="flex gap-1.5">
      <Button size="sm" variant="primary">
        reply
      </Button>
      <Button size="sm" variant="secondary">
        ask Anton to handle
      </Button>
      <Button size="sm" variant="secondary">
        archive
      </Button>
    </div>
  );
}

function ThreadList({
  threads,
  selectedId,
  onSelect,
  filter,
  onFilter,
}: {
  threads: InboxThread[];
  selectedId: number;
  onSelect: (id: number) => void;
  filter: Filter;
  onFilter: (f: Filter) => void;
}) {
  const unread = INBOX.filter((t) => t.unread).length;
  const triaged = INBOX.length - INBOX.filter((t) => t.k === 'approval' || t.k === 'review').length;
  return (
    <div className="w-[380px] border-r border-border-subtle flex flex-col min-h-0">
      <header className="px-4 py-3 border-b border-border-subtle">
        <div className="flex items-baseline mb-2.5">
          <span className="text-base text-primary font-medium">Inbox</span>
          <span className="mono small text-tertiary ml-2.5">
            {unread} unread · Anton triaged {triaged}
          </span>
        </div>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <FilterChip key={f} active={filter === f} onClick={() => onFilter(f)}>
              {f}
            </FilterChip>
          ))}
        </div>
      </header>
      <div className="flex-1 overflow-auto">
        {threads.map((t) => (
          <ThreadRow key={t.id} t={t} selected={selectedId === t.id} onSelect={() => onSelect(t.id)} />
        ))}
      </div>
    </div>
  );
}

export default function Inbox() {
  const [selId, setSelId] = useState(0);
  const [filter, setFilter] = useState<Filter>('all');
  const threads = INBOX.filter((t) => matchesFilter(t, filter));
  const selected = INBOX.find((t) => t.id === selId) ?? INBOX[0];
  return (
    <div className="flex flex-1 min-h-0">
      <ThreadList threads={threads} selectedId={selId} onSelect={setSelId} filter={filter} onFilter={setFilter} />
      <ThreadDetail thread={selected} />
    </div>
  );
}
