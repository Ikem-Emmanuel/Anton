'use client';
// useMemories — hybrid: REST hydrate + WS live appends. Listens to
// memory.written and prepends new memories to the list.

import { useCallback, useEffect, useState } from 'react';
import { useAntonStream } from '@/hooks/use-anton-stream';
import { fetchMemories } from '@/lib/api/memory';
import { MEMORIES, type Memory } from '@/lib/data';

export type UseMemories = {
  memories: Memory[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  connected: boolean;
};

export function useMemories(): UseMemories {
  const [memories, setMemories] = useState<Memory[]>(MEMORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { connected, subscribe } = useAntonStream();

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

  useEffect(() => {
    const unsub = subscribe<Memory>('memory.written', (ev) => {
      setMemories((prev) => [ev.data, ...prev]);
    });
    return unsub;
  }, [subscribe]);

  return { memories, loading, error, refresh, connected };
}
