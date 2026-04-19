'use client';
// Research — deep-research threads Anton has run. Left pane lists studies
// with depth badge + status; right pane renders the answer + reasoning chain
// + sources grid. "Running" studies show a progress bar inline.

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { STUDIES, type Study, type StudyStatus } from '@/lib/data';

const STATUS_COLOR: Record<StudyStatus, string> = {
  done: 'text-ok',
  running: 'text-accent',
  'needs review': 'text-work',
};

function StudyRow({ s, selected, onSelect }: { s: Study; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left px-5 py-3 cursor-pointer border-b border-border-subtle border-l-2',
        selected ? 'bg-hover border-l-accent' : 'bg-transparent border-l-transparent hover:bg-hover/40'
      )}
    >
      <div className="text-[13px] text-primary leading-[1.4] mb-1.5">{s.q}</div>
      <div className="flex items-center gap-2 text-[10px]">
        <span
          className={cn(
            'mono px-1.5 py-px rounded-[3px] text-[9px] border',
            s.depth === 'deep' ? 'border-accent text-accent' : 'border-border-default text-tertiary'
          )}
        >
          {s.depth}
        </span>
        <span className="mono small text-tertiary">{s.who}</span>
        <span className="mono small text-tertiary">·</span>
        <span className="mono small text-tertiary">{s.t}</span>
        <span className="flex-1" />
        <span className={cn('mono small text-[9px]', STATUS_COLOR[s.status])}>{s.status.toUpperCase()}</span>
      </div>
      {s.pct != null && (
        <div className="h-0.5 bg-raised mt-2 rounded-sm overflow-hidden">
          <div className="h-full bg-accent" style={{ width: `${s.pct}%` }} />
        </div>
      )}
    </button>
  );
}

function StudyDetail({ s }: { s: Study }) {
  return (
    <div className="flex-1 overflow-auto px-8 py-6">
      <div className="text-[22px] text-primary leading-[1.4] mb-2 font-medium">{s.q}</div>
      <div className="mono small text-tertiary mb-6 flex gap-3 flex-wrap">
        <span>requested by {s.who}</span>
        <span>·</span>
        <span>{s.t} ago</span>
        <span>·</span>
        <span>{s.depth} research</span>
        <span>·</span>
        <span>{s.runtime}</span>
        <span>·</span>
        <span>{s.sources} sources</span>
      </div>

      <section className="px-[18px] py-4 bg-surface border border-border-subtle rounded-card mb-5">
        <div className="mono small caps text-tertiary mb-2.5 text-[9px]">ANSWER</div>
        <div className="text-sm text-primary leading-[1.7]">{s.answer}</div>
      </section>

      <h2 className="text-sm text-primary mb-2.5 font-medium">Reasoning</h2>
      <section className="px-4 py-3.5 bg-surface border border-border-subtle rounded-card mb-5">
        {s.reasoning.map((step, i) => (
          <div key={step} className="flex gap-2.5 py-1">
            <span className="mono small text-tertiary w-5 text-[10px]">{(i + 1).toString().padStart(2, '0')}</span>
            <span className="text-xs text-secondary leading-[1.6]">{step}</span>
          </div>
        ))}
      </section>

      <h2 className="text-sm text-primary mb-2.5 font-medium">
        Sources <span className="mono small text-tertiary ml-1.5 text-[10px]">{s.sources}</span>
      </h2>
      <div className="grid grid-cols-2 gap-1.5">
        {s.sourceList.map((source, i) => (
          <div
            key={source}
            className="px-3 py-2 bg-surface border border-border-subtle rounded-card text-[11px] text-secondary"
          >
            <span className="mono small text-tertiary mr-1.5 text-[9px]">[{i + 1}]</span>
            {source}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Research() {
  const [selId, setSelId] = useState(0);
  const selected = STUDIES.find((s) => s.id === selId) ?? STUDIES[0];
  const running = STUDIES.filter((s) => s.status === 'running').length;
  const review = STUDIES.filter((s) => s.status === 'needs review').length;
  return (
    <div className="flex flex-1 min-h-0">
      <div className="w-[400px] border-r border-border-subtle flex flex-col">
        <header className="px-5 py-4 border-b border-border-subtle">
          <div className="text-xl text-primary font-medium mb-0.5">Research</div>
          <div className="mono small text-tertiary">
            {STUDIES.length} studies · {running} running · {review} needs review
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          {STUDIES.map((s) => (
            <StudyRow key={s.id} s={s} selected={selId === s.id} onSelect={() => setSelId(s.id)} />
          ))}
        </div>
      </div>
      <StudyDetail s={selected} />
    </div>
  );
}
