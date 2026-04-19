// Memory API client. GETs /api/memories (proxied to the Anton service).
// Shape matches the Memory type from lib/data/memory.ts.

import type { Memory } from '@/lib/data';

export type MemoriesResponse = {
  memories: Memory[];
};

export async function fetchMemories(): Promise<Memory[]> {
  const res = await fetch('/api/memories');
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; hint?: string };
    throw new Error(body.hint || body.error || `HTTP ${res.status}`);
  }
  const data = (await res.json()) as MemoriesResponse;
  return data.memories ?? [];
}
