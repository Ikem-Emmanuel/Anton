// Approvals API client. Fetches the current pending approval set from the
// Anton service (proxied through /api/approvals). Shape matches the
// Approval type from lib/data/approvals.ts so server + client stay in sync.

import type { Approval } from '@/lib/data';

export type ApprovalsResponse = {
  approvals: Approval[];
};

export async function fetchApprovals(): Promise<Approval[]> {
  const res = await fetch('/api/approvals');
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; hint?: string };
    throw new Error(body.hint || body.error || `HTTP ${res.status}`);
  }
  const data = (await res.json()) as ApprovalsResponse;
  return data.approvals ?? [];
}

export type ApprovalDecision = 'approve' | 'reject';

async function postDecision(id: number, decision: ApprovalDecision): Promise<void> {
  const res = await fetch(`/api/approvals/${id}/${decision}`, { method: 'POST' });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; hint?: string };
    throw new Error(body.hint || body.error || `HTTP ${res.status}`);
  }
}

export const approveApproval = (id: number) => postDecision(id, 'approve');
export const rejectApproval = (id: number) => postDecision(id, 'reject');
