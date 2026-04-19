'use client';
// useApprovals — load pending approvals via /api/approvals. Exposes
// { approvals, loading, error, refresh }. Seeds with the static mock from
// lib/data so the first render is non-empty if the fetch is slow; the
// fetched result replaces the seed once it arrives.

import { useCallback, useEffect, useState } from 'react';
import { fetchApprovals } from '@/lib/api/approvals';
import { APPROVALS, type Approval } from '@/lib/data';

export type UseApprovals = {
  approvals: Approval[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useApprovals(): UseApprovals {
  const [approvals, setApprovals] = useState<Approval[]>(APPROVALS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchApprovals();
      setApprovals(next);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      // Keep whatever we already had on screen — better than going empty.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { approvals, loading, error, refresh };
}
