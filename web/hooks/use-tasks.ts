'use client';
// useTasks — load kanban tasks via /api/tasks. Seeds with lib/data.TASKS so
// first paint is populated; fetched list replaces the seed on arrival.

import { useCallback, useEffect, useState } from 'react';
import { fetchTasks } from '@/lib/api/tasks';
import { TASKS, type Task } from '@/lib/data';

export type UseTasks = {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useTasks(): UseTasks {
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return { tasks, loading, error, refresh };
}
