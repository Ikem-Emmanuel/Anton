// Events API client. GETs /api/events (proxied to the Anton service).
// Shape matches the ActivityEvent type from lib/data/activity.ts.

import type { ActivityEvent } from '@/lib/data';

export type EventsResponse = {
  events: ActivityEvent[];
};

export async function fetchEvents(): Promise<ActivityEvent[]> {
  const res = await fetch('/api/events');
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; hint?: string };
    throw new Error(body.hint || body.error || `HTTP ${res.status}`);
  }
  const data = (await res.json()) as EventsResponse;
  return data.events ?? [];
}
