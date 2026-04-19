'use client';
// Notifications sub-tab — per-event delivery rules.

import { cn } from '@/lib/cn';
import { NOTIFICATION_RULES } from '@/lib/data';

function Toggle({ on }: { on: boolean }) {
  return (
    <div
      className={cn('w-[30px] h-[18px] rounded-[9px] relative cursor-pointer', on ? 'bg-accent' : 'bg-border-default')}
    >
      <div className={cn('absolute top-0.5 w-3.5 h-3.5 rounded-full bg-page', on ? 'left-3.5' : 'left-0.5')} />
    </div>
  );
}

export default function NotificationsSettings() {
  return (
    <div className="max-w-[900px]">
      <h2 className="text-[20px] font-medium mb-2">Notifications</h2>
      <p className="text-secondary mb-6">
        What surfaces, and how loudly. Quiet hours 23:00 – 07:30; anything high-risk overrides.
      </p>
      <div className="border border-border-default rounded-card overflow-hidden">
        <div
          className="mono caps grid px-4 py-2.5 bg-surface border-b border-border-default"
          style={{ gridTemplateColumns: '1fr 260px 140px 60px' }}
        >
          <span className="text-tertiary">Event</span>
          <span className="text-tertiary">Trigger</span>
          <span className="text-tertiary">Delivery</span>
          <span className="text-tertiary text-right">On</span>
        </div>
        {NOTIFICATION_RULES.map((r, i, arr) => (
          <div
            key={r.w}
            className={cn('grid items-center px-4 py-3', i === arr.length - 1 ? '' : 'border-b border-border-subtle')}
            style={{ gridTemplateColumns: '1fr 260px 140px 60px' }}
          >
            <span className="text-sm">{r.w}</span>
            <span className="mono small text-tertiary">{r.c}</span>
            <span className="mono small text-secondary">{r.s}</span>
            <div className="flex justify-end">
              <Toggle on={r.on} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 p-3.5 bg-surface border border-border-subtle rounded-card">
        <div className="mono caps text-tertiary mb-2">GROUPING</div>
        <div className="mono small text-secondary leading-[1.7]">
          4+ agent completions within 10m → one grouped push: "4 tasks completed — tap to review"
        </div>
      </div>
    </div>
  );
}
