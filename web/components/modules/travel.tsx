'use client';
// Travel — trips Anton has booked, is planning, or has surfaced options for.
// Left list shows destination + date + status pip. Right pane renders an
// Anton-status block followed by either an itinerary (booked) or flight
// options (planning). Proposed trips show the progress-only status.

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { TRIPS, type Trip, type TripStatus } from '@/lib/data';

const STATUS_COLOR: Record<TripStatus, string> = {
  booked: 'text-ok',
  planning: 'text-accent',
  proposed: 'text-work',
};

function TripRow({ t, selected, onSelect }: { t: Trip; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left px-5 py-4 cursor-pointer border-b border-border-subtle border-l-2',
        selected ? 'bg-hover border-l-accent' : 'bg-transparent border-l-transparent hover:bg-hover/40'
      )}
    >
      <div className="flex items-baseline mb-1">
        <span className="text-base text-primary font-medium">{t.where}</span>
        <span className={cn('mono small ml-auto text-[9px]', STATUS_COLOR[t.status])}>{t.status.toUpperCase()}</span>
      </div>
      <div className="mono small text-tertiary mb-1.5">{t.dates}</div>
      <div className="text-xs text-secondary leading-[1.5]">{t.purpose}</div>
    </button>
  );
}

function ProgressBlock({ trip }: { trip: Trip }) {
  const marker = trip.status === 'booked' ? '✓' : trip.status === 'planning' ? '◌' : '◆';
  return (
    <div className="px-4 py-3.5 bg-accent-soft border border-accent rounded-card mb-5">
      <div className="mono small caps text-accent mb-2 text-[9px]">◎ ANTON STATUS</div>
      {trip.progress.map((p) => (
        <div key={p} className="py-1 text-xs text-primary flex gap-2">
          <span className="text-ok">{marker}</span>
          {p}
        </div>
      ))}
    </div>
  );
}

function Itinerary({ items, cost }: { items: NonNullable<Trip['itinerary']>; cost: number }) {
  return (
    <>
      <h2 className="text-sm text-primary mb-2.5 font-medium">Itinerary</h2>
      <div className="border border-border-subtle rounded-card overflow-hidden">
        {items.map((it, i) => (
          <div
            key={it.t}
            className={cn('px-4 py-3 flex gap-4', i < items.length - 1 ? 'border-b border-border-subtle' : '')}
          >
            <div className="mono small text-tertiary w-[110px] text-[11px]">{it.t}</div>
            <div className="flex-1">
              <div className="text-[13px] text-primary mb-0.5">{it.a}</div>
              <div className="mono small text-tertiary text-[10px]">{it.b}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mono small mt-3.5 text-tertiary">
        Total booked: <span className="text-primary">${cost.toLocaleString()}</span>
      </div>
    </>
  );
}

function FlightOptions({ options }: { options: NonNullable<Trip['flightOptions']> }) {
  return (
    <>
      <h2 className="text-sm text-primary mb-2.5 font-medium">Flight options Anton is comparing</h2>
      <div className="grid grid-cols-3 gap-2.5">
        {options.map((o) => (
          <div
            key={o.carrier}
            className={cn(
              'p-3 bg-surface border rounded-card',
              o.recommended ? 'border-accent' : 'border-border-subtle'
            )}
          >
            <div className="text-[13px] text-primary mb-0.5">{o.carrier}</div>
            <div className="mono small text-tertiary mb-1.5 text-[10px]">dep {o.depart}</div>
            <div className={cn('text-base mono', o.recommended ? 'text-accent' : 'text-primary')}>{o.price}</div>
            {o.recommended && <div className="mono small mt-1.5 text-accent text-[9px]">◎ ANTON RECOMMENDS</div>}
          </div>
        ))}
      </div>
    </>
  );
}

function TripDetail({ trip }: { trip: Trip }) {
  return (
    <div className="flex-1 overflow-auto px-8 py-6">
      <div className="text-[28px] text-primary font-medium mb-1">{trip.where}</div>
      <div className="mono small text-tertiary mb-5">
        {trip.dates} · {trip.purpose}
      </div>
      <ProgressBlock trip={trip} />
      {trip.status === 'booked' && trip.itinerary && trip.cost != null && (
        <Itinerary items={trip.itinerary} cost={trip.cost} />
      )}
      {trip.status === 'planning' && trip.flightOptions && <FlightOptions options={trip.flightOptions} />}
    </div>
  );
}

export default function Travel() {
  const [selId, setSelId] = useState(0);
  const selected = TRIPS.find((t) => t.id === selId) ?? TRIPS[0];
  const booked = TRIPS.filter((t) => t.status === 'booked').length;
  const planning = TRIPS.filter((t) => t.status === 'planning').length;
  const proposed = TRIPS.filter((t) => t.status === 'proposed').length;
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="flex items-center px-6 py-4 border-b border-border-subtle">
        <div>
          <div className="text-xl text-primary font-medium mb-0.5">Travel</div>
          <div className="mono small text-tertiary">
            {booked} booked · {planning} planning · {proposed} awaiting your call
          </div>
        </div>
        <span className="flex-1" />
        <Button size="sm" variant="primary">
          + ask Anton to plan a trip
        </Button>
      </header>
      <div className="flex-1 flex min-h-0">
        <div className="w-[380px] border-r border-border-subtle overflow-auto">
          {TRIPS.map((t) => (
            <TripRow key={t.id} t={t} selected={selId === t.id} onSelect={() => setSelId(t.id)} />
          ))}
        </div>
        <TripDetail trip={selected} />
      </div>
    </div>
  );
}
