'use client';
// Memory item detail — per-memory view with highlighted title, source
// quote, "used in" log, metadata sidebar, and related-memories list.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BackBar } from '@/components/ui/back-bar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { MEMORIES, type Memory } from '@/lib/data';

const TYPE_GLYPH: Record<Memory['type'], string> = {
  preference: '◇',
  decision: '◆',
  fact: '■',
  conversation: '▷',
};

const HL_CLASS: Record<Memory['hl'], string> = {
  yellow: 'bg-[color-mix(in_srgb,var(--hl-yellow)_33%,transparent)]',
  coral: 'bg-[color-mix(in_srgb,var(--hl-coral)_33%,transparent)]',
  blue: 'bg-[color-mix(in_srgb,var(--hl-blue)_33%,transparent)]',
};

const HL_TEXT: Record<Memory['hl'], string> = {
  yellow: 'text-[var(--hl-yellow)]',
  coral: 'text-[var(--hl-coral)]',
  blue: 'text-[var(--hl-blue)]',
};

const SAMPLE_QUOTE: Record<Memory['type'], string> = {
  preference: "Honestly, I just want the bullets. I read fast — pack the density in, don't fluff it.",
  decision: "Let's make the call here and move on. I don't want to keep relitigating this.",
  fact: 'Renewal hits the 14th. Put it in the ledger.',
  conversation: 'Okay, debriefing Q1 — honestly the creator tier is where our signal is.',
};

const USED_IN: Array<[string, string]> = [
  ['Apr 17 · Morning briefing', 'Applied formatting preference'],
  ['Apr 12 · Chat with Noel', 'Anton cited this when discussing model routing'],
  ['Apr 08 · Sarah reviewing copy', 'Blocked emoji in draft email'],
  ['Apr 02 · Anton weekly summary', 'Used as context for tone'],
];

function MetadataRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex py-1.5 border-b border-border-subtle text-xs">
      <span className="mono small caps text-tertiary w-20 text-[10px]">{k}</span>
      <span className="mono small text-primary">{v}</span>
    </div>
  );
}

function RelatedCard({ memory, id }: { memory: Memory; id: number }) {
  return (
    <Link href={`/memory/${id}`} className="block">
      <div className="p-2.5 mb-2 bg-page border border-border-default rounded-card cursor-pointer">
        <div className="flex gap-1.5 items-start">
          <span className="mono text-tertiary">{TYPE_GLYPH[memory.type]}</span>
          <span className="text-xs text-secondary leading-[1.4]">{memory.title}</span>
        </div>
      </div>
    </Link>
  );
}

export function MemoryDetail({ memoryId }: { memoryId: number }) {
  const m = MEMORIES[memoryId];
  if (!m) notFound();
  const related = MEMORIES.map((memory, i) => ({ memory, i }))
    .filter(({ i }) => i !== memoryId)
    .slice(0, 3);

  return (
    <div className="h-full flex flex-col">
      <BackBar
        label={`memory #${memoryId + 1}`}
        crumb="Memory"
        crumbHref="/memory"
        extras={
          <div className="flex gap-1.5">
            <Button size="sm" variant="secondary">
              edit
            </Button>
            <Button size="sm" variant="secondary" className="text-error">
              forget
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto grid" style={{ gridTemplateColumns: '1fr 320px' }}>
        <div className="px-8 py-6">
          <div className="flex items-center gap-2.5 mb-4">
            <span className={cn('mono text-lg', HL_TEXT[m.hl])}>{TYPE_GLYPH[m.type]}</span>
            <span className="mono small caps text-tertiary">{m.type}</span>
            <span className="w-px h-3 bg-border-subtle" />
            <span className="mono small text-tertiary">confidence {m.conf}/3</span>
          </div>

          <h1 className="text-[22px] leading-[1.35] text-primary m-0 mb-6 max-w-[640px]">
            <span className={cn('px-1', HL_CLASS[m.hl])}>{m.title}</span>
          </h1>

          <div className="mono caps small text-tertiary mb-2.5">Source</div>
          <div className="p-3.5 bg-surface border border-border-default rounded-card mb-6 max-w-[640px]">
            <div className="mono small text-tertiary mb-2">{m.src}</div>
            <div className="text-[13px] text-secondary italic leading-[1.6]">"{SAMPLE_QUOTE[m.type]}"</div>
          </div>

          <div className="mono caps small text-tertiary mb-2.5">Used in</div>
          <div className="max-w-[640px]">
            {USED_IN.map(([when, how]) => (
              <div key={when} className="py-2.5 border-b border-border-subtle flex justify-between gap-3.5">
                <span className="mono small text-secondary">{when}</span>
                <span className="mono small text-tertiary">{how}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="border-l border-border-subtle px-5 py-6 bg-surface">
          <div className="mono caps small text-tertiary mb-2.5">Metadata</div>
          <MetadataRow k="Created" v={m.src} />
          <MetadataRow k="Last used" v="2h ago" />
          <MetadataRow k="Uses" v="47 times" />
          <MetadataRow k="Scope" v="all agents" />
          <MetadataRow k="Sensitive" v="no" />

          <div className="mono caps small text-tertiary mt-5 mb-2.5">Related</div>
          {related.map(({ memory, i }) => (
            <RelatedCard key={i} memory={memory} id={i} />
          ))}
        </aside>
      </div>
    </div>
  );
}
