'use client';
// useEvents — hybrid: REST hydrate + WS live appends. Listens to
// event.logged and prepends new events to the list, capped at 200 so the
// in-browser list doesn't grow without bound.

import { useCallback, useEffect, useState } from 'react';
import { useAntonStream } from '@/hooks/use-anton-stream';
import { fetchEvents } from '@/lib/api/events';
import { ACTIVITY, type ActivityEvent } from '@/lib/data';

const MAX_EVENTS = 200;

export type UseEvents = {
  events: ActivityEvent[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  connected: boolean;
};

export function useEvents(): UseEvents {
  const [events, setEvents] = useState<ActivityEvent[]>(ACTIVITY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { connected, subscribe } = useAntonStream();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchEvents();
      setEvents(next);
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
    const unsub = subscribe<ActivityEvent>('event.logged', (ev) => {
      setEvents((prev) => {
        const next = [ev.data, ...prev];
        return next.length > MAX_EVENTS ? next.slice(0, MAX_EVENTS) : next;
      });
    });
    return unsub;
  }, [subscribe]);

  return { events, loading, error, refresh, connected };
}
