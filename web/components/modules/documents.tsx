'use client';
// Documents — three-pane file browser: left folder nav, middle file list,
// right preview with Anton's summary above a rendered body. Every doc carries
// a tag (needs-review / draft / assembled / shared / canon / archived) that
// Anton sets based on state; the tag colour encodes urgency.

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { DOC_FOLDERS, DOCUMENTS, type DocFolder, type DocTagColor, type Document } from '@/lib/data';

const TAG_COLOR: Record<DocTagColor, string> = {
  work: 'text-work',
  tertiary: 'text-tertiary',
  info: 'text-info',
  accent: 'text-accent',
  ok: 'text-ok',
};

function FolderNav({ folder, onSelect }: { folder: DocFolder; onSelect: (f: DocFolder) => void }) {
  return (
    <nav className="w-[180px] border-r border-border-subtle p-2 overflow-y-auto">
      <div className="mono small caps text-tertiary px-2.5 pb-2 text-[9px]">FOLDERS</div>
      {DOC_FOLDERS.map((f) => (
        <button
          type="button"
          key={f}
          onClick={() => onSelect(f)}
          className={cn(
            'block w-full text-left px-2.5 py-1 rounded-md cursor-pointer text-xs mb-px',
            folder === f ? 'bg-hover text-primary' : 'bg-transparent text-secondary hover:bg-hover/40'
          )}
        >
          {f}
        </button>
      ))}
      <div className="mt-6 px-2.5">
        <div className="mono small caps text-tertiary mb-2 text-[9px]">ANTON KNOWS</div>
        <div className="mono small text-secondary leading-[1.6] text-[10px]">
          <div>{DOCUMENTS.length} docs indexed</div>
          <div>
            {DOCUMENTS.filter((d) => ['Marcus', 'Sarah', 'Alex', 'Priya', 'Anton'].includes(d.author)).length} authored
            by agents
          </div>
          <div>{DOCUMENTS.filter((d) => d.tag === 'needs review').length} need your review</div>
        </div>
      </div>
    </nav>
  );
}

function DocRow({ doc, selected, onSelect }: { doc: Document; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left px-3.5 py-2.5 cursor-pointer border-b border-border-subtle border-l-2',
        selected ? 'bg-hover border-l-accent' : 'bg-transparent border-l-transparent hover:bg-hover/40'
      )}
    >
      <div className="flex items-center gap-2 mb-0.5">
        <span className="mono small text-tertiary w-7 text-[9px]">{doc.kind}</span>
        <span className="flex-1 text-xs text-primary truncate">{doc.name}</span>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-tertiary">
        <span>
          {doc.author === 'Anton' ? '◎ ' : ''}
          {doc.author}
        </span>
        <span>·</span>
        <span>{doc.edited}</span>
        <span className="flex-1" />
        <span className={cn('mono small text-[9px]', TAG_COLOR[doc.tagColor])}>{doc.tag}</span>
      </div>
    </button>
  );
}

function DocPreview({ doc }: { doc: Document }) {
  return (
    <section className="flex-1 overflow-auto px-8 py-6">
      <div className="text-[22px] text-primary font-medium mb-2">{doc.name}</div>
      <div className="mono small text-tertiary mb-5 flex gap-2.5 flex-wrap">
        <span>by {doc.author}</span>
        <span>·</span>
        <span>{doc.edited} ago</span>
        <span>·</span>
        <span>{doc.size}</span>
        <span>·</span>
        <span className={TAG_COLOR[doc.tagColor]}>{doc.tag}</span>
      </div>

      <div className="px-3.5 py-3 bg-accent-soft border border-accent rounded-card mb-5">
        <div className="mono small caps text-accent mb-1.5 text-[9px]">◎ ANTON SUMMARY</div>
        <div className="text-xs text-primary leading-[1.6]">{doc.summary}</div>
      </div>

      <article className="text-[13px] text-secondary leading-[1.8] font-sans">
        <h2 className="text-[15px] text-primary font-medium mb-2">§1 · Goals</h2>
        <p className="mb-4">
          Reduce time-to-first-value for new Anton users from 14 minutes to under 4 minutes. Make it feel like meeting a
          capable assistant, not configuring software. Every step has a clear "this is why" from Anton.
        </p>
        <h2 className="text-[15px] text-primary font-medium mb-2">§2 · Flow</h2>
        <p className="mb-4">
          Unlock → short intro (voice or text) → three scoped trust questions → connect the most valuable integration
          (Gmail or Calendar) → first brief.
        </p>
        <h2 className="text-[15px] text-primary font-medium mb-2">
          §3 · Auth <span className="mono small text-work ml-2 text-[10px]">◆ OPEN QUESTION</span>
        </h2>
        <p className="mb-4">
          Passkey-first, with password as fallback? Or biometric required? Marcus leans passkey-first.
        </p>
      </article>
    </section>
  );
}

export default function Documents() {
  const [folder, setFolder] = useState<DocFolder>('all');
  const [selId, setSelId] = useState(0);
  const filtered = useMemo(() => DOCUMENTS.filter((d) => folder === 'all' || d.folder === folder), [folder]);
  const selected = DOCUMENTS.find((d) => d.id === selId) ?? DOCUMENTS[0];

  return (
    <div className="flex flex-1 min-h-0">
      <FolderNav folder={folder} onSelect={setFolder} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center px-6 py-4 border-b border-border-subtle">
          <div>
            <div className="text-xl text-primary font-medium">Documents</div>
            <div className="mono small text-tertiary mt-0.5">
              {filtered.length} in {folder}
            </div>
          </div>
          <span className="flex-1" />
          <Button size="sm" variant="primary">
            + new doc
          </Button>
        </header>
        <div className="flex-1 flex min-h-0">
          <div className="w-[360px] border-r border-border-subtle overflow-y-auto">
            {filtered.map((d) => (
              <DocRow key={d.id} doc={d} selected={selId === d.id} onSelect={() => setSelId(d.id)} />
            ))}
          </div>
          <DocPreview doc={selected} />
        </div>
      </div>
    </div>
  );
}
