'use client';
// People — CRM surface. Contacts in a flat table (tag filter at top),
// detail pane on the right with Anton's note and recent thread history.
// Warmth dot encodes engagement: hot/warm/cold.

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/ui/filter-chip';
import { cn } from '@/lib/cn';
import { PEOPLE, type Person, type PersonTag, type Warmth } from '@/lib/data';

const WARMTH_CLASS: Record<Warmth, string> = {
  hot: 'bg-error',
  warm: 'bg-work',
  cold: 'bg-tertiary',
};

type FilterValue = 'all' | PersonTag;
const FILTERS: FilterValue[] = ['all', 'investor', 'candidate', 'peer', 'press', 'personal'];

function PersonRow({ p, selected, onSelect }: { p: Person; selected: boolean; onSelect: () => void }) {
  return (
    <tr
      onClick={onSelect}
      className={cn(
        'cursor-pointer border-b border-border-subtle',
        selected ? 'bg-hover' : 'bg-transparent hover:bg-hover/40'
      )}
    >
      <td className="px-4 py-2.5">
        <div className="text-[13px] text-primary">{p.name}</div>
      </td>
      <td className="px-4 py-2.5 text-xs text-secondary">{p.org}</td>
      <td className="px-4 py-2.5 text-xs text-secondary">{p.role}</td>
      <td className="px-4 py-2.5">
        <span className="mono small text-[9px] px-1.5 py-px bg-surface text-secondary border border-border-subtle rounded-[3px]">
          {p.tag}
        </span>
      </td>
      <td className="px-4 py-2.5 text-xs text-secondary">
        <span className="inline-flex items-center gap-1.5">
          <span className={cn('w-1.5 h-1.5 rounded-full', WARMTH_CLASS[p.warmth])} />
          {p.warmth}
        </span>
      </td>
      <td className="px-4 py-2.5 text-xs text-secondary">{p.last}</td>
    </tr>
  );
}

function PersonDetail({ p }: { p: Person }) {
  return (
    <div className="p-5">
      <div className="text-[22px] text-primary mb-0.5 font-medium">{p.name}</div>
      <div className="mono small text-tertiary mb-4">
        {p.role} at {p.org}
      </div>
      <div className="flex gap-1.5 mb-5">
        <Button size="sm" variant="primary">
          message
        </Button>
        <Button size="sm" variant="secondary">
          schedule
        </Button>
        <Button size="sm" variant="secondary">
          ask Anton
        </Button>
      </div>
      <div className="p-3 bg-accent-soft border border-accent rounded-card mb-4">
        <div className="mono small caps text-accent mb-1.5 text-[9px]">◎ ANTON NOTE</div>
        <div className="text-xs text-primary leading-[1.6]">{p.notes}</div>
      </div>
      <div className="mono small caps text-tertiary mb-2 text-[9px]">RECENT THREAD</div>
      {p.history.map(([when, what], i) => (
        <div key={`${when}-${i}`} className="flex gap-2.5 py-2 border-b border-border-subtle text-xs text-secondary">
          <span className="mono small text-tertiary text-[10px] w-10">{when}</span>
          <span className="flex-1">{what}</span>
        </div>
      ))}
    </div>
  );
}

function Header({ tag, onTag }: { tag: FilterValue; onTag: (t: FilterValue) => void }) {
  const hot = PEOPLE.filter((p) => p.warmth === 'hot').length;
  return (
    <header className="px-6 py-4 border-b border-border-subtle">
      <div className="flex items-baseline mb-2.5">
        <span className="text-xl text-primary font-medium">People</span>
        <span className="mono small text-tertiary ml-2.5">
          {PEOPLE.length} tracked · {hot} hot
        </span>
      </div>
      <div className="flex gap-1">
        {FILTERS.map((f) => (
          <FilterChip key={f} active={tag === f} onClick={() => onTag(f)}>
            {f}
          </FilterChip>
        ))}
      </div>
    </header>
  );
}

export default function People() {
  const [selId, setSelId] = useState(0);
  const [tag, setTag] = useState<FilterValue>('all');
  const selected = PEOPLE.find((p) => p.id === selId) ?? PEOPLE[0];
  const filtered = PEOPLE.filter((p) => tag === 'all' || p.tag === tag);

  return (
    <div className="flex flex-1 min-h-0">
      <div className="flex-1 flex flex-col min-w-0">
        <Header tag={tag} onTag={setTag} />
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border-subtle">
                {['name', 'org', 'role', 'tag', 'warmth', 'last'].map((col) => (
                  <th
                    key={col}
                    className="mono small caps text-tertiary text-[10px] tracking-[0.08em] font-normal text-left px-4 py-2"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <PersonRow key={p.id} p={p} selected={selId === p.id} onSelect={() => setSelId(p.id)} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <aside className="w-[340px] border-l border-border-subtle overflow-auto">
        <PersonDetail p={selected} />
      </aside>
    </div>
  );
}
