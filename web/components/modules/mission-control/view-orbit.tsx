// Orbit view — Anton at center, three rings of agents arranged by status.
// Decorative SVG + absolutely positioned chips.

import { StatusGlow } from '@/components/ui/primitives';
import type { Agent } from '@/lib/data';

const CX = 360;
const CY = 280;

function ring(agents: Agent[]): Array<{ list: Agent[]; r: number }> {
  return [
    { r: 70, list: agents.filter((a) => a.s === 'working').slice(0, 5) },
    { r: 140, list: agents.filter((a) => a.s === 'working' || a.s === 'complete').slice(5) },
    { r: 210, list: agents.filter((a) => a.s === 'idle' || a.s === 'error') },
  ];
}

export function ViewOrbit({ agents }: { agents: Agent[] }) {
  const rings = ring(agents);
  return (
    <div className="flex-1 relative overflow-hidden">
      <svg viewBox={`0 0 ${CX * 2} ${CY * 2}`} aria-hidden="true" className="absolute inset-0 w-full h-full">
        <title>orbit rings</title>
        {rings.map((r) => (
          <circle key={r.r} cx={CX} cy={CY} r={r.r} fill="none" stroke="var(--border-subtle)" strokeWidth="1" />
        ))}
        {rings[0].list.map((a, i) => {
          const ang = (i / rings[0].list.length) * Math.PI * 2 - Math.PI / 2;
          const x = CX + Math.cos(ang) * rings[0].r;
          const y = CY + Math.sin(ang) * rings[0].r;
          return (
            <line key={a.n} x1={CX} y1={CY} x2={x} y2={y} stroke="var(--accent)" strokeWidth="0.5" opacity="0.5" />
          );
        })}
      </svg>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-surface border border-accent flex flex-col items-center justify-center z-[2]">
        <div className="mono text-sm text-accent tracking-[0.1em]">ANTON</div>
        <div className="mono small text-tertiary text-[10px]">qwen3·8b</div>
      </div>
      {rings.map((r, ri) =>
        r.list.map((a, i) => {
          const ang = (i / r.list.length) * Math.PI * 2 - Math.PI / 2 + ri * 0.2;
          const x = 50 + ((Math.cos(ang) * r.r) / (CX * 2)) * 100;
          const y = 50 + ((Math.sin(ang) * r.r) / (CY * 2)) * 100;
          return (
            <div
              key={a.n}
              style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)' }}
              className="absolute px-2.5 py-1.5 bg-surface border border-border-default rounded-chip text-xs whitespace-nowrap flex items-center gap-1.5 z-[2]"
            >
              <StatusGlow s={a.s} />
              {a.n}
            </div>
          );
        })
      )}
    </div>
  );
}
