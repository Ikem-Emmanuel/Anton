// Tasks API client. GETs /api/tasks (proxied to the Anton service).
// Shape matches the Task type from lib/data/tasks.ts.

import type { Task } from '@/lib/data';

export type TasksResponse = {
  tasks: Task[];
};

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch('/api/tasks');
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; hint?: string };
    throw new Error(body.hint || body.error || `HTTP ${res.status}`);
  }
  const data = (await res.json()) as TasksResponse;
  return data.tasks ?? [];
}
