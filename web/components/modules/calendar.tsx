'use client';
// Calendar — week grid with absolute-positioned event blocks.
// Left: 52px hour gutter + 7-day columns; events overlay the grid using
// top/height computed from hour offsets. Right rail: Anton proposals
// (schedule changes Anton would make if you accept) and the selected-event
// detail. Click an empty cell or an event to select.
//
// Layout constants (HOUR_PX, GUTTER_PX) live below and can be tweaked
// without hunting through markup.

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/ui/filter-chip';
import { cn } from '@/lib/cn';
import {
  CALENDAR_DAYS,
  CALENDAR_EVENTS,
  CALENDAR_HOURS,
  CALENDAR_NOW_OFFSET,
  CALENDAR_PROPOSALS,
  CALENDAR_TODAY_INDEX,
  type CalendarEvent,
  type CalendarProposal,
} from '@/lib/data';

const HOUR_PX = 64;

function fmtTime(offset: number): string {
  const hour24 = Math.floor(offset) + 8;
  const minutes = Math.round((offset % 1) * 60);
  const hour12 = hour24 > 12 ? hour24 - 12 : hour24;
  const ampm = hour24 >= 12 ? 'pm' : 'am';
  return `${hour12}:${minutes.toString().padStart(2, '0')}${ampm}`;
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex py-1 text-xs border-b border-border-subtle">
      <div className="mono text-[11px] text-tertiary w-[60px]">{k}</div>
      <div className="flex-1 text-secondary">{v}</div>
    </div>
  );
}

function Header({ view, onView }: { view: 'day' | 'week' | 'month'; onView: (v: 'day' | 'week' | 'month') => void }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-border-subtle">
      <div>
        <div className="text-xl text-primary font-medium">April 14 — 20</div>
        <div className="mono small text-tertiary mt-0.5">Week 16 · 3 holds pending your approval</div>
      </div>
      <span className="flex-1" />
      <div className="flex gap-1">
        {(['day', 'week', 'month'] as const).map((v) => (
          <FilterChip key={v} active={view === v} onClick={() => onView(v)}>
            {v}
          </FilterChip>
        ))}
      </div>
      <Button size="sm" variant="selected">
        + ask Anton
      </Button>
    </div>
  );
}

function DayLabel({ day, isToday }: { day: string; isToday: boolean }) {
  return (
    <div
      className={cn(
        'mono small px-2 py-2.5 text-[11px] text-center border-l border-border-subtle',
        isToday ? 'text-accent bg-accent-soft' : 'text-secondary bg-transparent'
      )}
    >
      {day}
    </div>
  );
}

function HourCell({ isSelected, onClick }: { isSelected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Select hour slot"
      className={cn(
        'block w-full h-[64px] border-b border-border-subtle cursor-pointer',
        isSelected ? 'bg-hover' : 'bg-transparent'
      )}
    />
  );
}

function EventBlock({ event, selected, onClick }: { event: CalendarEvent; selected: boolean; onClick: () => void }) {
  const base =
    event.k === 'anton'
      ? 'bg-accent-soft border-accent border-l-accent'
      : event.k === 'hold'
        ? 'bg-info/[0.12] border-info border-l-info'
        : 'bg-surface border-border-default border-l-primary';
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'absolute left-[3px] right-[3px] p-1.5 rounded border border-l-[3px] overflow-hidden cursor-pointer text-left',
        base,
        selected && 'ring-2 ring-accent'
      )}
      style={{ top: event.s * HOUR_PX + 1, height: event.h * HOUR_PX - 3 }}
    >
      <div className={cn('text-[11px] leading-[1.3]', event.k === 'anton' ? 'font-medium' : 'font-normal')}>
        {event.k === 'anton' && <span className="text-accent mr-1">◎</span>}
        {event.k === 'hold' && <span className="text-info mr-1">◌</span>}
        <span className="text-primary">{event.t}</span>
      </div>
      {event.h > 1 && event.w && <div className="mono text-[9px] text-tertiary mt-0.5">{event.w}</div>}
    </button>
  );
}

function DayColumn({
  dayIndex,
  events,
  selection,
  onSelect,
}: {
  dayIndex: number;
  events: CalendarEvent[];
  selection: { d: number; s: number };
  onSelect: (s: { d: number; s: number }) => void;
}) {
  const isToday = dayIndex === CALENDAR_TODAY_INDEX;
  return (
    <div className="relative border-l border-border-subtle">
      {CALENDAR_HOURS.map((h, hi) => (
        <HourCell
          key={h}
          isSelected={selection.d === dayIndex && selection.s === hi}
          onClick={() => onSelect({ d: dayIndex, s: hi })}
        />
      ))}
      {events.map((e) => (
        <EventBlock
          key={`${e.d}-${e.s}-${e.t}`}
          event={e}
          selected={selection.d === e.d && selection.s >= e.s && selection.s < e.s + e.h}
          onClick={() => onSelect({ d: dayIndex, s: e.s })}
        />
      ))}
      {isToday && (
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 h-px bg-accent z-[5]"
          style={{ top: CALENDAR_NOW_OFFSET * HOUR_PX }}
        >
          <span className="absolute left-[-4px] top-[-4px] w-2 h-2 rounded-full bg-accent" />
        </div>
      )}
    </div>
  );
}

function WeekGrid({
  selection,
  onSelect,
}: {
  selection: { d: number; s: number };
  onSelect: (s: { d: number; s: number }) => void;
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="grid border-b border-border-subtle" style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>
        <div />
        {CALENDAR_DAYS.map((d, i) => (
          <DayLabel key={d} day={d} isToday={i === CALENDAR_TODAY_INDEX} />
        ))}
      </div>
      <div className="flex-1 overflow-auto relative">
        <div className="grid relative" style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>
          <div className="flex flex-col">
            {CALENDAR_HOURS.map((h) => (
              <div
                key={h}
                className="mono small text-[10px] text-tertiary text-right border-b border-border-subtle px-1.5 py-1 h-[64px]"
              >
                {h}
              </div>
            ))}
          </div>
          {CALENDAR_DAYS.map((d, di) => (
            <DayColumn
              key={d}
              dayIndex={di}
              events={CALENDAR_EVENTS.filter((e) => e.d === di)}
              selection={selection}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProposalCard({ p }: { p: CalendarProposal }) {
  return (
    <div className="px-3 py-2.5 mb-1.5 bg-surface border border-border-subtle rounded-card">
      <div className="text-[13px] text-primary mb-0.5">{p.t}</div>
      <div className="mono small text-tertiary mb-1.5">{p.r}</div>
      <div className="flex gap-1.5">
        <Button size="sm" variant="primary">
          accept
        </Button>
        <Button size="sm" variant="secondary">
          dismiss
        </Button>
      </div>
    </div>
  );
}

function SelectedDetail({
  event,
  selection,
}: {
  event: CalendarEvent | undefined;
  selection: { d: number; s: number };
}) {
  if (!event) {
    return (
      <div className="mono small text-tertiary">
        Empty slot — {CALENDAR_DAYS[selection.d]} {fmtTime(selection.s)}
      </div>
    );
  }
  return (
    <div>
      <div className="text-sm text-primary mb-1">{event.t}</div>
      <div className="mono small text-secondary mb-2.5">
        {CALENDAR_DAYS[selection.d]} · {fmtTime(event.s)} – {fmtTime(event.s + event.h)}
      </div>
      {event.w && <Row k="with" v={event.w} />}
      <Row k="source" v={event.k === 'anton' ? 'Anton (proposed)' : event.k === 'hold' ? 'Focus hold' : 'Calendar'} />
      {event.note && <Row k="note" v={event.note} />}
    </div>
  );
}

function RightRail({
  selection,
  selected,
}: {
  selection: { d: number; s: number };
  selected: CalendarEvent | undefined;
}) {
  return (
    <aside className="w-[320px] border-l border-border-subtle flex flex-col overflow-auto">
      <section className="px-4 pt-4 pb-3 border-b border-border-subtle">
        <div className="mono small caps text-tertiary mb-1.5">ANTON PROPOSES</div>
        {CALENDAR_PROPOSALS.map((p) => (
          <ProposalCard key={p.t} p={p} />
        ))}
      </section>
      <section className="px-4 py-4">
        <div className="mono small caps text-tertiary mb-1.5">SELECTED</div>
        <SelectedDetail event={selected} selection={selection} />
      </section>
      <div className="flex-1" />
      <footer className="px-4 py-3 border-t border-border-subtle">
        <div className="mono small text-tertiary leading-[1.6]">
          <div>✦ 14 events this week</div>
          <div>◎ 3 proposed by Anton</div>
          <div>◌ 6h of focus time held</div>
        </div>
      </footer>
    </aside>
  );
}

export default function Calendar() {
  const [selection, setSelection] = useState({ d: CALENDAR_TODAY_INDEX, s: 2 });
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const selectedEvent = useMemo(
    () => CALENDAR_EVENTS.find((e) => e.d === selection.d && selection.s >= e.s && selection.s < e.s + e.h),
    [selection]
  );
  return (
    <div className="flex flex-1 min-h-0">
      <div className="flex-1 flex flex-col min-w-0">
        <Header view={view} onView={setView} />
        <WeekGrid selection={selection} onSelect={setSelection} />
      </div>
      <RightRail selection={selection} selected={selectedEvent} />
    </div>
  );
}
