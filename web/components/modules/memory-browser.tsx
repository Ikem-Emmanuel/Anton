'use client';
// Memory browser — search + filter + scrollable list of memory cards.
// Each card deep-links into /memory/[id] for the detail view.

import Link from 'next/link';
import { useState } from 'react';
import { FilterChip } from '@/components/ui/filter-chip';
import { Kbd } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import { MEMORIES, type Memory } from '@/lib/data';

const HL_CLASS: Record<Memory['hl'], string> = {
  yellow: 'bg-[var(--hl-yellow)]',
  coral: 'bg-[var(--hl-coral)]',
  blue: 'bg-[var(--hl-blue)]',
};

const TYPE_GLYPH: Record<Memory['type'], string> = {
  preference: '◇',
  decision: '◆',
  fact: '■',
  conversation: '▷',
};

const FILTERS = ['All', 'Facts', 'Decisions', 'Preferences', 'Conversations'];

function MemoryCard({ m, id }: { m: Memory; id: number }) {
  return (
    <Link href={`/memory/${id}`} className="block">
      <div className="px-4 py-3.5 mb-2 cursor-pointer bg-surface border border-border-subtle rounded-card hover:bg-hover">
        <div className="flex items-center gap-2.5 mb-1.5">
          <span className="mono text-tertiary w-3.5 text-center">{TYPE_GLYPH[m.type]}</span>
          <span className="mono small caps text-tertiary">{m.type}</span>
          <span className="flex-1" />
          <span className="mono small text-tertiary">{m.src}</span>
          <span className="flex gap-0.5">
            {[1, 2, 3].map((n) => (
              <span key={n} className={cn('w-1 h-1 rounded-full', n <= m.conf ? 'bg-ok' : 'bg-border-default')} />
            ))}
          </span>
        </div>
        <div className="text-sm leading-[1.55]">
          <span
            className={cn(
              'px-1 py-px text-[#14120F] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]',
              HL_CLASS[m.hl]
            )}
          >
            {m.title}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function MemoryBrowser() {
  const [active, setActive] = useState(0);
  return (
    <div className="px-8 py-6 h-full overflow-auto">
      <div className="flex items-center gap-2.5 mb-3.5">
        <input
          placeholder="search memory — full-text or semantic"
          className="flex-1 px-3.5 py-2.5 bg-surface border border-border-default rounded-card text-sm text-primary outline-0"
        />
        <Kbd>⌘</Kbd>
        <Kbd>F</Kbd>
      </div>
      <div className="flex gap-1.5 mb-5 items-center">
        {FILTERS.map((c, i) => (
          <FilterChip key={c} active={i === active} onClick={() => setActive(i)}>
            {c}
          </FilterChip>
        ))}
        <span className="flex-1" />
        <span className="mono small text-tertiary">1,487 memories · 12 edited this week</span>
      </div>
      {MEMORIES.map((m, i) => (
        <MemoryCard key={m.title} m={m} id={i} />
      ))}
    </div>
  );
}
