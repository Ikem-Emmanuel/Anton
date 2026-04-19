'use client';
// Activity timeline — scrollable event feed. Verbosity toggle expands each
// row into a reasoning/token detail block. Agent chips filter the list
// (visual only in this pass). Each row deep-links to /event/[id].

import Link from 'next/link';
import { useState } from 'react';
import { FilterChip } from '@/components/ui/filter-chip';
import { useEvents } from '@/hooks/use-events';
import { cn } from '@/lib/cn';
import type { ActivityType } from '@/lib/data';

const TYPE_COLOR: Record<ActivityType, string> = {
  tool: 'text-info border-l-info',
  think: 'text-secondary border-l-secondary',
  write: 'text-accent border-l-accent',
  search: 'text-info border-l-info',
  handoff: 'text-work border-l-work',
  complete: 'text-ok border-l-ok',
  approval: 'text-work border-l-work',
  system: 'text-tertiary border-l-tertiary',
};

const VERBOSITY_LABEL = ['Summary', 'Normal', 'Full trace'];
const AGENT_FILTERS = ['Marcus', 'James', 'Ada', 'Kai', 'Priya', 'Sarah'];

export default function ActivityTimeline() {
  const [verbosity, setVerbosity] = useState(1);
  const { events, loading, error } = useEvents();

  const status = error
    ? `offline · showing cached · ${events.length} events`
    : loading
      ? 'loading…'
      : `${events.length} events`;

  return (
    <div className="px-8 py-6 h-full overflow-auto">
      <div className="flex items-center justify-between mb-[18px]">
        <div>
          <div className="mono caps text-tertiary">ACTIVITY</div>
          <div className="text-[22px] font-medium tracking-[-0.01em]">{status}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="mono small text-tertiary">verbosity</span>
          {[0, 1, 2].map((v) => (
            <FilterChip key={v} active={verbosity === v} onClick={() => setVerbosity(v)}>
              {VERBOSITY_LABEL[v]}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="flex gap-1.5 mb-4 flex-wrap">
        {AGENT_FILTERS.map((n) => (
          <button
            type="button"
            key={n}
            className="mono small px-2.5 py-1 bg-transparent text-secondary border border-border-default rounded-chip cursor-pointer hover:bg-hover/40"
          >
            {n} ×
          </button>
        ))}
      </div>

      {events.map((a, i) => {
        const colorClass = TYPE_COLOR[a.type];
        const [textClass, borderClass] = colorClass.split(' ');
        const key = `${a.t}-${a.agent}-${i}`;
        return (
          <Link key={key} href={`/event/${i}`} className="block">
            <div
              className={cn(
                'px-3.5 py-2.5 mb-1 border border-border-subtle border-l-2 bg-surface cursor-pointer hover:bg-hover',
                borderClass
              )}
            >
              <div className="flex items-center gap-3">
                <span className="mono small text-tertiary w-[60px]">{a.t}</span>
                <span className={cn('mono small caps w-16', textClass)}>{a.type}</span>
                <span className="text-[13px] w-[72px]">{a.agent}</span>
                <span className="mono small text-secondary flex-1">{a.text}</span>
                {verbosity >= 1 && a.detail && <span className="mono small text-tertiary">{a.detail}</span>}
              </div>
              {verbosity >= 2 && (
                <div className="mono small mt-2 pt-2 border-t border-dashed border-border-subtle text-tertiary pl-[72px]">
                  reasoning: evaluated 3 candidate files · chose specs/onboarding.md based on recency
                  <br />
                  tokens: in 412 · out 128 · cost $0.0003 · model qwen3-8b-local
                  <br />
                  parent: &lt;delegate #abc7&gt; · permalink /activity/e-{14852 + i}
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
