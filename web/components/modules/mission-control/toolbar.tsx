// Mission Control toolbar — view switcher (5 modes), status filter chips,
// department select, live indicator.

import { FilterChip } from '@/components/ui/filter-chip';
import { cn } from '@/lib/cn';
import { AGENTS, DEPARTMENTS } from '@/lib/data';

export type MCView = 'list' | 'dept' | 'grid' | 'orbit' | 'term';
export type MCFilter = 'all' | 'working' | 'error' | 'idle' | 'queued';

const VIEWS: Array<{ id: MCView; label: string; glyph: string }> = [
  { id: 'list', label: 'List', glyph: '☰' },
  { id: 'dept', label: 'Dept', glyph: '⚏' },
  { id: 'grid', label: 'Grid', glyph: '▦' },
  { id: 'orbit', label: 'Orbit', glyph: '◎' },
  { id: 'term', label: 'Terminal', glyph: '▸' },
];

function filterCount(f: MCFilter): number {
  if (f === 'all') return AGENTS.length;
  if (f === 'queued') return AGENTS.filter((a) => a.q > 0).length;
  return AGENTS.filter((a) => a.s === f).length;
}

const FILTERS: Array<{ id: MCFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'working', label: 'Active' },
  { id: 'error', label: 'Blocked' },
  { id: 'idle', label: 'Idle' },
  { id: 'queued', label: 'Queued' },
];

export function Toolbar({
  view,
  setView,
  filter,
  setFilter,
  dept,
  setDept,
}: {
  view: MCView;
  setView: (v: MCView) => void;
  filter: MCFilter;
  setFilter: (f: MCFilter) => void;
  dept: string;
  setDept: (d: string) => void;
}) {
  return (
    <div className="flex items-center gap-3.5 px-5 py-2.5 border-b border-border-subtle">
      <div className="flex bg-surface rounded-md p-0.5 border border-border-default">
        {VIEWS.map((v) => {
          const active = v.id === view;
          return (
            <button
              type="button"
              key={v.id}
              onClick={() => setView(v.id)}
              className={cn(
                'mono small flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-sm cursor-pointer',
                active ? 'bg-accent-soft text-accent' : 'bg-transparent text-secondary'
              )}
            >
              <span className="text-[13px] leading-none">{v.glyph}</span>
              {v.label}
            </button>
          );
        })}
      </div>

      <div className="w-px h-5 bg-border-subtle" />

      <div className="flex gap-1">
        {FILTERS.map((f) => (
          <FilterChip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)} count={filterCount(f.id)}>
            {f.label}
          </FilterChip>
        ))}
      </div>

      <div className="w-px h-5 bg-border-subtle" />

      <select
        value={dept}
        onChange={(e) => setDept(e.target.value)}
        className="mono small bg-surface text-secondary border border-border-default rounded-chip px-2.5 py-1 text-[11px] cursor-pointer"
      >
        <option value="all">all teams</option>
        {DEPARTMENTS.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name.toLowerCase()}
          </option>
        ))}
      </select>

      <span className="flex-1" />

      <span className="mono small text-tertiary text-[11px] flex items-center gap-1.5">
        <span className="pulse w-[5px] h-[5px] rounded-full bg-ok inline-block" />
        live · sorted by activity
      </span>
    </div>
  );
}
