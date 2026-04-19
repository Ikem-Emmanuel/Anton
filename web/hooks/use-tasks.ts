'use client';
// useTasks — hybrid: REST hydrate + WS live deltas. Listens to task.created
// (prepend) and task.updated (replace-by-id).

import { useCallback, useEffect, useState } from 'react';
import { useAntonStream } from '@/hooks/use-anton-stream';
import { fetchTasks } from '@/lib/api/tasks';
import { TASKS, type Task } from '@/lib/data';

export type UseTasks = {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  connected: boolean;
};

export function useTasks(): UseTasks {
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { connected, subscribe } = useAntonStream();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchTasks();
      setTasks(next);
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
    const unsubCreated = subscribe<Task>('task.created', (ev) => {
      setTasks((prev) => (prev.some((t) => t.id === ev.data.id) ? prev : [ev.data, ...prev]));
    });
    const unsubUpdated = subscribe<Task>('task.updated', (ev) => {
      setTasks((prev) => prev.map((t) => (t.id === ev.data.id ? ev.data : t)));
    });
    return () => {
      unsubCreated();
      unsubUpdated();
    };
  }, [subscribe]);

  return { tasks, loading, error, refresh, connected };
}
