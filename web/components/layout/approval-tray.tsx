'use client';
// ApprovalTray — right-sidebar pending-approvals feed. Data now comes from
// the useApprovals hook (GET /api/approvals), with the static mock from
// lib/data as a pre-fetch placeholder so the tray is never empty on first
// paint. Shell.tsx stays thin — this component owns its own data.

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DeptChip, Kbd, RiskPip } from '@/components/ui/primitives';
import { useApprovals } from '@/hooks/use-approvals';
import { approveApproval, rejectApproval } from '@/lib/api/approvals';
import { cn } from '@/lib/cn';

function DiffRow({ row }: { row: [string, string, string?] }) {
  const color = row[0] === '+' ? 'text-ok' : row[0] === '-' ? 'text-error' : 'text-work';
  return (
    <div className="mono small flex gap-2 py-0.5">
      <span className={cn('w-3', color)}>{row[0]}</span>
      <span className="flex-1 text-secondary">{row[1]}</span>
      <span className="text-tertiary">{row[2] || ''}</span>
    </div>
  );
}

function AgentMonogram({ agent }: { agent: string }) {
  return (
    <span className="mono w-[22px] h-[22px] rounded bg-raised flex items-center justify-center text-[10px] text-secondary">
      {agent.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function ApprovalTray() {
  const { approvals, loading, error } = useApprovals();
  const [expanded, setExpanded] = useState<number[]>([2]);
  // Per-id "busy" set so we can disable buttons + show pending during the
  // round-trip. The WS approval.resolved event will remove the card on
  // success; on failure we surface a tray-level message and re-enable.
  const [busy, setBusy] = useState<Set<number>>(() => new Set());
  const [actionError, setActionError] = useState<string | null>(null);
  const toggle = (id: number) => setExpanded((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));

  const handleDecision = async (id: number, kind: 'approve' | 'reject') => {
    setBusy((prev) => new Set(prev).add(id));
    setActionError(null);
    try {
      await (kind === 'approve' ? approveApproval(id) : rejectApproval(id));
      // Card removal is driven by the approval.resolved WS event, not by
      // local state — keeps a single source of truth.
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
      setBusy((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3.5 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <span className="mono caps text-primary">Pending</span>
          <span className="mono small text-work">{approvals.length}</span>
        </div>
        <div className="mono small text-tertiary mt-1">
          {actionError ? (
            <span className="text-error">action failed · {actionError}</span>
          ) : error ? (
            <span className="text-error">offline · showing cached</span>
          ) : loading ? (
            'loading…'
          ) : (
            'sorted by risk · newest first'
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto px-2.5 py-2">
        {approvals.map((a) => {
          const isOpen = expanded.includes(a.id);
          const isHigh = a.risk === 'H';
          const isBusy = busy.has(a.id);
          return (
            <div
              key={a.id}
              className={cn(
                'mb-2 rounded-card px-3 pt-3 pb-2.5 border',
                isHigh ? 'bg-hover border-error' : 'bg-surface border-border-default',
                isBusy && 'opacity-60'
              )}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <AgentMonogram agent={a.agent} />
                <span className="text-[13px] font-medium">{a.agent}</span>
                <DeptChip id={a.dept} />
                <span className="flex-1" />
                <RiskPip r={a.risk} />
              </div>
              <div className="text-[13px] leading-[1.5] text-primary mb-2">{a.intent}</div>

              {isOpen && a.why && (
                <div className="mono small px-2.5 py-2 bg-page border border-border-subtle rounded text-secondary mb-2">
                  {a.why}
                </div>
              )}
              {isOpen && a.diff && (
                <div className="px-2.5 py-2 bg-page border border-border-subtle mb-2">
                  {a.diff.map((row, i) => (
                    <DiffRow key={i} row={row} />
                  ))}
                </div>
              )}

              <div className="flex gap-1.5 items-center">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  disabled={isBusy}
                  onClick={() => handleDecision(a.id, 'approve')}
                >
                  {isBusy ? (
                    '…'
                  ) : (
                    <>
                      Approve <Kbd>A</Kbd>
                    </>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  disabled={isBusy}
                  onClick={() => handleDecision(a.id, 'reject')}
                >
                  Reject <Kbd>R</Kbd>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggle(a.id)} disabled={isBusy}>
                  {isOpen ? '−' : 'why?'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
