'use client';
// All tier1/tier2 + ApprovalsHub + IntegrationsHub are now real modules;
// this file is kept as a shared primitive in case future Phase 4 work needs
// it (e.g. Mobile screen or Settings sub-tab that's not yet ported).

import type { ReactNode } from 'react';

export function Placeholder({
  label,
  sub,
  source,
  preview,
}: {
  label: string;
  sub: string;
  source: string;
  preview: string[];
}) {
  return (
    <div className="px-8 py-6 h-full overflow-auto">
      <div className="mono caps text-tertiary">{label}</div>
      <h1 className="text-[26px] font-medium mt-1 mb-1.5">{sub}</h1>
      <p className="text-secondary mt-0 mb-6 max-w-[720px]">
        Production port queued. Source: <code className="mono">web/public/prototype/{source}</code>
      </p>
      <div className="p-4 bg-surface border border-border-subtle rounded-card">
        <div className="mono caps small text-tertiary mb-2.5">WHAT THIS SURFACE WILL DO</div>
        <ul className="m-0 pl-[18px] text-secondary leading-[1.8] text-[13px] list-disc">
          {preview.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function PlaceholderContainer({ children }: { children: ReactNode }) {
  return <div className="px-8 py-6 h-full overflow-auto">{children}</div>;
}
