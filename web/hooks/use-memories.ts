'use client';
// useMemories — load persisted memories via /api/memories. Seeds with the
// static lib/data.MEMORIES so first paint is populated; fetched list
// replaces the seed once it arrives.

import { useCallback, useEffect, useState } from 'react';
import { fetchMemories } from '@/lib/api/memory';
import { MEMORIES, type Memory } from '@/lib/data';

export type UseMemories = {
  memories: Memory[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useMemories(): UseMemories {
  const [memories, setMemories] = useState<Memory[]>(MEMORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchMemories();
      setMemories(next);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { memories, loading, error, refresh };
}
