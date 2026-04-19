'use client';
// Mission Control — orchestrator. Owns view/filter/dept state, derives the
// filtered agent list, dispatches to the selected view component. Every
// view reads the same filtered list so filter/dept selections persist
// across view switches.

import { useMemo, useState } from 'react';
import { AGENTS } from '@/lib/data';
import { KpiStrip } from './kpi-strip';
import { type MCFilter, type MCView, Toolbar } from './toolbar';
import { ViewDept } from './view-dept';
import { ViewGrid } from './view-grid';
import { ViewList } from './view-list';
import { ViewOrbit } from './view-orbit';
import { ViewTerm } from './view-term';

export default function MissionControl() {
  const [view, setView] = useState<MCView>('list');
  const [filter, setFilter] = useState<MCFilter>('all');
  const [dept, setDept] = useState<string>('all');

  const agents = useMemo(
    () =>
      AGENTS.filter((a) => {
        if (filter === 'queued') return a.q > 0;
        if (filter !== 'all' && a.s !== filter) return false;
        return true;
      }).filter((a) => dept === 'all' || a.d === dept),
    [filter, dept]
  );

  return (
    <div className="flex flex-col h-full">
      {/* This is module mission */}
      <KpiStrip />
      <Toolbar view={view} setView={setView} filter={filter} setFilter={setFilter} dept={dept} setDept={setDept} />
      {view === 'list' && <ViewList agents={agents} />}
      {view === 'dept' && <ViewDept agents={agents} />}
      {view === 'grid' && <ViewGrid agents={agents} />}
      {view === 'orbit' && <ViewOrbit agents={agents} />}
      {view === 'term' && <ViewTerm agents={agents} />}
    </div>
  );
}
