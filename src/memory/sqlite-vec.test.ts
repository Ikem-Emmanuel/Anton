// Hybrid retrieval tests (§4.2). Proves the vector + FTS5 + RRF pipeline
// runs end-to-end without a live Ollama — the `embed` call is mocked so
// tests are fast and deterministic.
//
// The real integration (embed via Ollama → vec search) is exercised by the
// brain eval harness when LIVE_OLLAMA=1 is set.

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Hoist a shared mock so subsequent imports see it.
const mockEmbed = vi.hoisted(() => vi.fn());
vi.mock('../brain/ollama-client.js', () => ({ embed: mockEmbed }));

// Import the module-under-test AFTER the mock so the embed binding picks up mockEmbed.
const {
  closeSqliteMemory,
  hybridSearchMemories,
  indexMemoryEmbedding,
  initSqliteMemory,
  isVecEnabled,
  semanticSearchMemories,
  storeMemory,
} = await import('./sqlite.js');

const DIM = 768;

// Deterministic fake embedding — maps a string to a 768-dim unit-ish vector
// via a simple per-char hash. Same string → same vector; similar strings →
// similar vectors (shared characters dominate the vector).
function fakeEmbedding(text: string): number[] {
  const v = new Array(DIM).fill(0);
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    v[c % DIM] += 1;
    v[(c * 7) % DIM] += 0.5;
  }
  // Normalize so cosine distance behaves sensibly.
  const mag = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / mag);
}

describe('sqlite-vec hybrid retrieval', () => {
  let tempDir: string;

  beforeEach(() => {
    mockEmbed.mockImplementation(async (text: string) => fakeEmbedding(text));
    tempDir = mkdtempSync(join(tmpdir(), 'anton-vec-'));
    initSqliteMemory(tempDir);
  });

  afterEach(() => {
    mockEmbed.mockReset();
    closeSqliteMemory();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('isVecEnabled returns true when sqlite-vec loaded', () => {
    // If this fails on CI, sqlite-vec native binary isn't available for the
    // platform — hybridSearch will fall back to FTS5 only, which is still
    // tested below.
    expect(isVecEnabled()).toBe(true);
  });

  it('indexMemoryEmbedding persists a 768-dim vector for a memory', async () => {
    const id = storeMemory('Marcus', 'fact', 'Auth module shipped in sprint 7');

    // storeMemory dispatches indexing via setImmediate; call it directly
    // so the test doesn't need to await the scheduler.
    await indexMemoryEmbedding(id, 'Auth module shipped in sprint 7');

    const results = await semanticSearchMemories('auth shipped');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe(id);
    expect(results[0].distance).toBeGreaterThanOrEqual(0);
  });

  it('semanticSearchMemories ranks similar text higher than dissimilar', async () => {
    const idA = storeMemory('Marcus', 'fact', 'Auth module shipped');
    const idB = storeMemory('Marcus', 'fact', 'Dashboard redesign pending');
    await indexMemoryEmbedding(idA, 'Auth module shipped');
    await indexMemoryEmbedding(idB, 'Dashboard redesign pending');

    const results = await semanticSearchMemories('auth module');
    // idA (auth-related) should rank before idB (dashboard-related).
    const posA = results.findIndex((r) => r.id === idA);
    const posB = results.findIndex((r) => r.id === idB);
    expect(posA).toBeGreaterThanOrEqual(0);
    expect(posA).toBeLessThan(posB);
  });

  it('hybridSearchMemories merges FTS5 + vector via RRF', async () => {
    const idA = storeMemory('Marcus', 'fact', 'Auth endpoint reviewed and shipped');
    const idB = storeMemory('James', 'fact', 'Fixed the login page token refresh');
    const idC = storeMemory('Elena', 'fact', 'Dashboard pixel alignment polish');
    for (const [id, text] of [
      [idA, 'Auth endpoint reviewed and shipped'],
      [idB, 'Fixed the login page token refresh'],
      [idC, 'Dashboard pixel alignment polish'],
    ] as const) {
      await indexMemoryEmbedding(id, text);
    }

    const results = await hybridSearchMemories('auth login token');
    const ids = results.map((r) => r.id);
    // Auth- and login-related rows should both surface.
    expect(ids).toContain(idA);
    expect(ids).toContain(idB);
    // Dashboard row should not outrank BOTH auth rows (lenient check — hash-
    // based fake embeddings don't give textbook semantic ordering, but RRF
    // should at least keep topical rows ahead of irrelevant ones).
    const posC = ids.indexOf(idC);
    const posA = ids.indexOf(idA);
    const posB = ids.indexOf(idB);
    expect(posC === -1 || posC >= Math.min(posA, posB)).toBe(true);
    // Every result carries an RRF score.
    for (const r of results) expect(r.rrfScore).toBeGreaterThan(0);
  });

  it('hybridSearchMemories respects limit', async () => {
    for (let i = 0; i < 8; i++) {
      const id = storeMemory('Marcus', 'fact', `memory row ${i} about auth systems and tokens`);
      await indexMemoryEmbedding(id, `memory row ${i} about auth systems and tokens`);
    }
    const results = await hybridSearchMemories('auth tokens', { limit: 3 });
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('hybridSearchMemories works when vec is disabled (FTS5 fallback)', async () => {
    // Simulate vec disabled by passing an empty embedding that semantic
    // search rejects as a dim mismatch.
    mockEmbed.mockImplementationOnce(async () => []);

    const id = storeMemory('Marcus', 'fact', 'Deployment pipeline green');
    await indexMemoryEmbedding(id, 'Deployment pipeline green').catch(() => {});
    const results = await hybridSearchMemories('deployment pipeline');
    // Even if semantic returns nothing, FTS5 still finds the row.
    expect(results.some((r) => r.id === id)).toBe(true);
  });
});
