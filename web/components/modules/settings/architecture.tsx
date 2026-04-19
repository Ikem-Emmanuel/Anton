'use client';
// Architecture sub-tab — visualizes the 3-layer routing pipeline and the
// current / target hardware tier config, plus live runtime metrics.

import { cn } from '@/lib/cn';
import {
  ARCH_LAYERS,
  ARCH_METRICS,
  ARCH_TIER_CURRENT,
  ARCH_TIER_TARGET,
  type ArchLayer,
  type ArchMetricColor,
  type ArchTier,
} from '@/lib/data';

const LAYER_COLOR: Record<ArchLayer['color'], string> = {
  info: 'border-l-info text-info',
  work: 'border-l-work text-work',
  accent: 'border-l-accent text-accent',
};

const METRIC_COLOR: Record<ArchMetricColor, string> = {
  ok: 'text-ok',
  work: 'text-work',
  secondary: 'text-secondary',
};

function LayerCard({ layer }: { layer: ArchLayer }) {
  return (
    <div
      className={cn(
        'px-[18px] py-3.5 bg-surface border border-border-default rounded-card mb-2 border-l-[3px]',
        LAYER_COLOR[layer.color].split(' ')[0]
      )}
    >
      <div className="flex items-baseline gap-2.5 mb-1">
        <span className={cn('mono small tracking-[0.12em]', LAYER_COLOR[layer.color].split(' ')[1])}>
          LAYER {layer.n}
        </span>
        <span className="text-sm font-medium">{layer.title}</span>
        <span className="flex-1" />
        <span className="mono small text-tertiary">{layer.sub}</span>
      </div>
      <div className="mono small text-secondary leading-[1.7]">
        {layer.bullets.map((b) => (
          <div key={b}>{b}</div>
        ))}
      </div>
    </div>
  );
}

function TierCard({ tier }: { tier: ArchTier }) {
  return (
    <div className="p-4 bg-surface border border-border-subtle rounded-card">
      <div className="mono caps text-tertiary mb-2">{tier.label}</div>
      <div className="flex items-baseline gap-2 mb-2.5">
        <span className="text-[22px] text-accent">{tier.tier}</span>
        <span className="mono small text-tertiary">{tier.device}</span>
      </div>
      <table className="w-full mono text-xs">
        <tbody>
          {tier.rows.map(([k, v]) => (
            <tr key={k}>
              <td className="text-tertiary py-0.5">{k}</td>
              <td className="text-primary text-right">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ArchitectureSettings() {
  return (
    <div>
      <h2 className="text-[20px] font-medium mb-2">Routing pipeline · v2.1</h2>
      <p className="text-secondary mb-5 max-w-[720px]">
        Every message flows through these three layers. Layer 0 short-circuits when it can. Layer 1 classifies when the
        pre-gate is ambiguous. Layer 2 responds at the right depth.
      </p>
      {ARCH_LAYERS.map((layer) => (
        <LayerCard key={layer.n} layer={layer} />
      ))}

      <div className="mt-7 grid grid-cols-2 gap-4">
        <TierCard tier={ARCH_TIER_CURRENT} />
        <TierCard tier={ARCH_TIER_TARGET} />
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2.5">
        {ARCH_METRICS.map(([label, value, color]) => (
          <div key={label} className="px-3.5 py-3 bg-surface border border-border-subtle rounded-card">
            <div className="mono small text-tertiary mb-1">{label}</div>
            <div className={cn('mono text-lg', METRIC_COLOR[color])}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
