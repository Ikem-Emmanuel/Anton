'use client';
// Activity event detail — per-event trace + context + safety checks.
// Reached via /event/[id] from the Activity timeline.

import { notFound } from 'next/navigation';
import { BackBar } from '@/components/ui/back-bar';
import { Button } from '@/components/ui/button';
import { ACTIVITY } from '@/lib/data';

function KvRow({ k, v, checked }: { k: string; v: string; checked?: boolean }) {
  return (
    <div className="flex py-1.5 border-b border-border-subtle items-center">
      {checked && <span className="text-ok mr-2">✓</span>}
      <span className="mono small caps text-tertiary w-[100px] text-[10px]">{k}</span>
      <span className="mono small text-primary">{v}</span>
    </div>
  );
}

export function EventDetail({ eventId }: { eventId: number }) {
  const e = ACTIVITY[eventId];
  if (!e) notFound();

  return (
    <div className="h-full flex flex-col">
      <BackBar
        label="event detail"
        crumb="Log"
        crumbHref="/log"
        extras={
          <div className="flex gap-1.5">
            <Button size="sm" variant="secondary">
              copy trace
            </Button>
            <Button size="sm" variant="secondary">
              replay
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto px-8 py-6 max-w-[900px]">
        <div className="flex items-baseline gap-3.5 mb-5">
          <span className="mono text-primary text-lg">{e.t}</span>
          <span className="mono small caps text-accent">{e.type}</span>
          <span className="text-sm text-secondary">→ {e.agent}</span>
        </div>

        <div className="p-[18px] bg-surface border border-border-default rounded-card mb-6">
          <div className="mono text-sm text-primary mb-2">{e.text}</div>
          {e.detail && <div className="mono small text-tertiary">{e.detail}</div>}
        </div>

        <div className="mono caps small text-tertiary mb-2.5">Trace</div>
        <div className="bg-surface border border-border-default rounded-card p-3.5 mb-6 mono text-xs leading-[1.7] text-secondary">
          <div>
            <span className="text-tertiary">14:02:17.012</span> <span className="text-accent">anton</span> → delegate to{' '}
            {e.agent}
          </div>
          <div>
            <span className="text-tertiary">14:02:17.040</span> <span className="text-ok">{e.agent}</span> ACK
            task_id=tsk_9a2f
          </div>
          <div>
            <span className="text-tertiary">14:02:17.118</span> <span className="text-ok">{e.agent}</span> plan: 3 steps
            identified
          </div>
          <div>
            <span className="text-tertiary">14:02:17.290</span> <span className="text-ok">{e.agent}</span> {e.text}
          </div>
          <div>
            <span className="text-tertiary">14:02:17.312</span> <span className="text-ok">{e.agent}</span> returned{' '}
            {e.detail ?? 'ok'}
          </div>
          <div className="text-tertiary">14:02:17.315 anton received</div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <div className="mono caps small text-tertiary mb-2.5">Context</div>
            <KvRow k="Task" v="Draft PRD for onboarding v3" />
            <KvRow k="Parent" v="brief_2026-04-18" />
            <KvRow k="Model" v="qwen3:8b" />
            <KvRow k="Prompt" v="2,104 tokens" />
            <KvRow k="Output" v="512 tokens" />
            <KvRow k="Latency" v="340ms" />
          </div>
          <div>
            <div className="mono caps small text-tertiary mb-2.5">Safety checks</div>
            <KvRow k="PII scan" v="clean" checked />
            <KvRow k="Scope check" v="within bounds" checked />
            <KvRow k="Risk estimate" v="low" checked />
            <KvRow k="Approval" v="auto (trust:green)" checked />
            <KvRow k="Rollback" v="snapshot saved" checked />
          </div>
        </div>
      </div>
    </div>
  );
}
