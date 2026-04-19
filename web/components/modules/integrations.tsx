'use client';
// Integrations (Hands) — external services Anton can see and act through.
// Grid of service cards, each with status pip (ok/warn/error/idle), scope
// chips, last-sync time, and a state-appropriate action button (connect /
// reconnect / manage). Category filter at top narrows the grid.

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FilterChip } from '@/components/ui/filter-chip';
import { cn } from '@/lib/cn';
import { INTEGRATIONS, type Integration, type IntegrationCategory, type IntegrationStatus } from '@/lib/data';

const STATUS_COLOR: Record<IntegrationStatus, string> = {
  ok: 'bg-ok text-ok',
  warn: 'bg-work text-work',
  error: 'bg-error text-error',
  idle: 'bg-tertiary text-tertiary',
};

const STATUS_BORDER: Record<IntegrationStatus, string> = {
  ok: 'border-border-subtle',
  warn: 'border-work',
  error: 'border-error',
  idle: 'border-border-subtle',
};

const STATUS_LABEL: Record<IntegrationStatus, string> = {
  ok: 'connected',
  warn: 'attention',
  error: 'failing',
  idle: 'available',
};

type CategoryFilter = 'all' | IntegrationCategory;

const CATEGORIES: CategoryFilter[] = [
  'all',
  'messaging',
  'email',
  'tasks',
  'code',
  'calendar',
  'finance',
  'docs',
  'files',
  'social',
  'design',
];

function StatusPip({ status }: { status: IntegrationStatus }) {
  const [dot, text] = STATUS_COLOR[status].split(' ');
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('w-1.5 h-1.5 rounded-full', dot)} />
      <span className={cn('mono small uppercase tracking-[0.08em] text-[10px]', text)}>{STATUS_LABEL[status]}</span>
    </span>
  );
}

function IntegrationActions({ status }: { status: IntegrationStatus }) {
  if (status === 'idle') {
    return (
      <Button size="sm" variant="selected" className="rounded-sm px-2.5">
        connect
      </Button>
    );
  }
  if (status === 'error') {
    return (
      <Button size="sm" variant="danger" className="rounded-sm px-2.5">
        reconnect
      </Button>
    );
  }
  return (
    <Button size="sm" variant="secondary" className="rounded-sm px-2.5">
      manage
    </Button>
  );
}

function IntegrationCard({ i }: { i: Integration }) {
  return (
    <Link
      href={`/integration/${i.id}`}
      className={cn(
        'text-left px-4 py-3.5 bg-surface cursor-pointer rounded-card flex flex-col gap-2 border hover:bg-hover',
        STATUS_BORDER[i.status]
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-raised border border-border-default flex items-center justify-center mono text-[11px] text-secondary">
          {i.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{i.name}</div>
          <div className="mono small text-tertiary uppercase tracking-[0.08em] text-[10px]">{i.cat}</div>
        </div>
        <StatusPip status={i.status} />
      </div>
      <div className="mono small text-secondary text-xs leading-[1.5]">{i.note}</div>
      {i.scopes.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {i.scopes.map((s) => (
            <span
              key={s}
              className="mono small px-1.5 text-[10px] text-tertiary border border-border-subtle rounded-sm"
            >
              {s}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 mt-1 pt-2 border-t border-border-subtle">
        <span className="mono small text-tertiary text-[11px]">
          {i.last ? `last sync ${i.last}` : 'not configured'}
        </span>
        <span className="flex-1" />
        <IntegrationActions status={i.status} />
      </div>
    </Link>
  );
}

export default function IntegrationsHub() {
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const filtered = useMemo(
    () => (filter === 'all' ? INTEGRATIONS : INTEGRATIONS.filter((i) => i.cat === filter)),
    [filter]
  );
  return (
    <div className="px-8 py-6 h-full overflow-auto">
      <div className="flex items-baseline gap-3.5 mb-1.5">
        <div className="mono caps text-tertiary">SETTINGS / INTEGRATIONS</div>
      </div>
      <h1 className="text-[26px] font-medium mt-1 mb-2">Hands</h1>
      <p className="text-secondary mt-0 mb-6 max-w-[620px]">
        External services Anton can see and act through. Scopes minimized by default. Writes above low-risk require
        approval per agent's trust tier.
      </p>

      <div className="flex gap-1.5 mb-[18px] flex-wrap items-center">
        {CATEGORIES.map((c) => (
          <FilterChip key={c} active={filter === c} onClick={() => setFilter(c)}>
            {c}
          </FilterChip>
        ))}
        <span className="flex-1" />
        <Button size="sm" variant="primary">
          + Connect service
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {filtered.map((i) => (
          <IntegrationCard key={i.id} i={i} />
        ))}
      </div>
    </div>
  );
}
