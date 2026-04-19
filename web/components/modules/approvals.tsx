'use client';
// Approvals hub — full-screen decision surface. An approval is a question
// Anton (or an agent) is asking Noel to answer. This page renders the
// current question with three proposed answers side-by-side, each with
// stats, flow preview, and tradeoffs. The right rail shows the selected
// option + what Anton will do on approve.
//
// For now this renders the single "onboarding v3" question from the
// prototype. When we wire approval data live, this becomes the detail
// view for the active approval and a list view appears above it.

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import { APPROVAL_OPTIONS, type ApprovalOption, type ApprovalStat, type ApprovalStatColor } from '@/lib/data';

const STAT_COLOR: Record<ApprovalStatColor, string> = {
  ok: 'text-ok',
  work: 'text-work',
  error: 'text-error',
  secondary: 'text-secondary',
};

function StatCell({ stat }: { stat: ApprovalStat }) {
  const [label, value, color] = stat;
  return (
    <div className="px-2 py-1.5 bg-page rounded-sm">
      <div className="mono small text-tertiary text-[10px]">{label}</div>
      <div className={cn('mono small mt-px text-xs', STAT_COLOR[color])}>{value}</div>
    </div>
  );
}

function FlowPreview({ preview, selected }: { preview: ApprovalOption['preview']; selected: boolean }) {
  return (
    <div className="p-2.5 bg-page border border-border-subtle rounded-sm mb-3.5">
      <div className="mono small caps text-tertiary text-[10px] mb-1.5">FLOW PREVIEW</div>
      <div className="flex gap-1.5 flex-wrap">
        {preview.map((s) => (
          <div
            key={s.t}
            className={cn(
              'flex-1 min-w-0 px-2 py-1.5 border rounded-sm',
              selected ? 'bg-accent-soft border-accent' : 'bg-surface border-border-subtle'
            )}
          >
            <div className={cn('mono small text-[9px]', selected ? 'text-accent' : 'text-tertiary')}>{s.t}</div>
            <div className="mono small text-[10px] text-secondary mt-0.5 leading-[1.3] truncate">{s.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OptionCard({ o, isSelected, onSelect }: { o: ApprovalOption; isSelected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left p-5 rounded-panel cursor-pointer transition-[border,box-shadow] duration-[120ms] bg-surface border-2',
        isSelected ? 'border-accent shadow-[0_6px_18px_rgba(0,0,0,0.25)]' : 'border-border-subtle shadow-none'
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center mono text-xs shrink-0',
            isSelected ? 'bg-accent border-accent text-page' : 'bg-transparent border-border-strong'
          )}
        >
          {isSelected ? '✓' : ''}
        </div>
        <div className="flex-1">
          <div className="mono small caps text-tertiary text-[10px]">OPTION {o.id}</div>
          <div className="text-base font-medium mt-0.5 leading-[1.3]">{o.label}</div>
        </div>
      </div>
      <p className="mb-3.5 text-[13px] text-secondary leading-[1.55]">{o.pitch}</p>
      <div className="grid grid-cols-2 gap-1 mb-3.5">
        {o.stats.map((stat) => (
          <StatCell key={stat[0]} stat={stat} />
        ))}
      </div>
      <FlowPreview preview={o.preview} selected={isSelected} />
      <ul className="flex flex-col gap-1">
        {o.tradeoffs.map((x) => (
          <li key={x} className="mono small text-secondary text-[11px] flex gap-1.5">
            <span className="text-tertiary">—</span>
            {x}
          </li>
        ))}
      </ul>
    </button>
  );
}

function ContextPanel() {
  return (
    <div className="mt-6 px-[18px] py-3.5 bg-surface border border-border-subtle rounded-card">
      <div className="mono caps text-tertiary mb-2.5">CONTEXT</div>
      <div className="grid grid-cols-3 gap-5">
        <div>
          <div className="mono small text-tertiary mb-1">why now</div>
          <div className="text-[13px] leading-[1.5]">
            Launch is locked for May 2. Engineering needs a decision today to hit timeline.
          </div>
        </div>
        <div>
          <div className="mono small text-tertiary mb-1">affected agents</div>
          <div className="flex gap-1.5 flex-wrap">
            {['Marcus', 'Ada', 'Felix', 'Ben', 'Alex'].map((n) => (
              <span
                key={n}
                className="mono small px-2 py-0.5 bg-page border border-border-subtle rounded-chip text-[11px]"
              >
                {n}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="mono small text-tertiary mb-1">linked memory</div>
          <div className="mono small text-[11px] text-secondary leading-[1.6]">
            <div>◆ Noel prefers fewer forced steps · Mar 3</div>
            <div>◆ Claude fallback budget &lt; 20% · Feb 19</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DecisionRail({ chosen }: { chosen: ApprovalOption }) {
  return (
    <aside className="w-[340px] border-l border-border-subtle p-5 flex flex-col bg-page">
      <div className="mono caps text-tertiary mb-2">YOUR SELECTION</div>
      <div className="px-4 py-3.5 bg-accent-soft border border-accent rounded-card mb-4">
        <div className="mono small caps text-accent text-[10px]">OPTION {chosen.id} · SELECTED</div>
        <div className="text-[15px] font-medium mt-1 leading-[1.3]">{chosen.label}</div>
        <div className="text-xs text-secondary mt-2 leading-[1.5]">{chosen.pitch}</div>
      </div>

      <div className="mono caps text-tertiary mb-2 text-[11px]">COMPARED TO ALTERNATIVES</div>
      <div className="mb-[18px] flex flex-col gap-1.5">
        {chosen.stats.map((stat) => (
          <div key={stat[0]} className="flex items-center gap-2">
            <span className="mono small w-[110px] text-tertiary text-[11px]">{stat[0]}</span>
            <span className={cn('mono small flex-1 text-[11px]', STAT_COLOR[stat[2]])}>{stat[1]}</span>
          </div>
        ))}
      </div>

      <div className="mono caps text-tertiary mb-2 text-[11px]">ON APPROVE, ANTON WILL</div>
      <ol className="mb-[18px] pl-[18px] text-secondary text-xs leading-[1.7]">
        <li>Lock the decision to memory · decisions table</li>
        <li>Assign tickets to Marcus, Ada, Felix (Jira)</li>
        <li>Ping #engineering with rationale</li>
        <li>Schedule follow-up briefing Mon 08:00</li>
      </ol>

      <div className="flex-1" />

      <div className="flex flex-col gap-1.5">
        <Button variant="primary" className="text-[13px] py-2.5 px-3.5 font-medium">
          Approve option {chosen.id} · <Kbd>⌘</Kbd>
          <Kbd>⏎</Kbd>
        </Button>
        <Button variant="secondary" className="text-[13px] py-2.5 px-3.5">
          Request an edit…
        </Button>
        <Button variant="ghost" className="text-xs py-2 px-3.5">
          Ask Marcus to propose a 4th option
        </Button>
      </div>

      <div className="mono small text-tertiary mt-3.5 text-[10px] flex gap-3 justify-center">
        <span>A B C · pick</span>
        <span>⌘⏎ · approve</span>
        <span>R · request edit</span>
      </div>
    </aside>
  );
}

export default function ApprovalsHub() {
  const [selectedId, setSelectedId] = useState<string>('A');
  const chosen = APPROVAL_OPTIONS.find((o) => o.id === selectedId) ?? APPROVAL_OPTIONS[0];
  return (
    <div className="flex flex-col h-full">
      <header className="px-8 pt-4 pb-3.5 border-b border-border-subtle">
        <div className="flex items-baseline gap-2.5 mb-1">
          <span className="mono caps text-tertiary">APPROVALS / ONBOARDING V3</span>
          <span className="mono small text-work">● PENDING · MED RISK</span>
        </div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-[22px] font-medium leading-tight tracking-[-0.01em] mt-1">
            Pick an onboarding approach.
          </h1>
          <span className="mono small text-tertiary">requested by Marcus · 13:58 · ref PRD §4.1</span>
        </div>
      </header>
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 overflow-auto px-8 py-5">
          <p className="mb-5 text-secondary text-[13px] max-w-[760px] leading-[1.55]">
            Marcus drafted three approaches to the onboarding v3 flow. Pick one to unblock engineering — or request an
            edit and he'll revise.
          </p>
          <div className="grid grid-cols-3 gap-3.5">
            {APPROVAL_OPTIONS.map((o) => (
              <OptionCard key={o.id} o={o} isSelected={selectedId === o.id} onSelect={() => setSelectedId(o.id)} />
            ))}
          </div>
          <ContextPanel />
        </div>
        <DecisionRail chosen={chosen} />
      </div>
    </div>
  );
}
