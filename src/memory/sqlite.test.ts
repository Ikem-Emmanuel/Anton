import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  initSqliteMemory,
  closeSqliteMemory,
  storeMemory,
  storeConversation,
  storeTrainingData,
  searchMemories,
  getRecentMemories,
  getConversationHistory,
  buildMemoryContext,
  getMemoryStats,
} from './sqlite.js';

describe('sqlite memory', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'anton-mem-'));
    initSqliteMemory(tempDir);
  });

  afterEach(() => {
    closeSqliteMemory();
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('storeMemory', () => {
    it('stores and retrieves a memory', () => {
      const id = storeMemory('Marcus', 'fact', 'Auth module shipped in sprint 7');
      expect(id).toBeGreaterThan(0);

      const memories = getRecentMemories({ agent: 'Marcus' });
      expect(memories.length).toBeGreaterThanOrEqual(1);
      expect(memories[0].content).toContain('Auth module');
    });

    it('stores different memory types', () => {
      storeMemory('Anton', 'fact', 'Noel prefers morning standups');
      storeMemory('Anton', 'decision', 'Use JWT with refresh tokens');
      storeMemory('Anton', 'pattern', 'Noel checks PRs at 10am');

      const stats = getMemoryStats();
      expect(stats.totalMemories).toBe(3);
      expect(stats.byType.length).toBe(3);
    });
  });

  describe('storeConversation', () => {
    it('stores user and agent messages', () => {
      storeConversation('sess-1', 'Marcus', 'user', 'Review the auth module');
      storeConversation('sess-1', 'Marcus', 'agent', 'The auth module looks solid.', {
        modelUsed: 'qwen3:8b',
        tokensIn: 50,
        tokensOut: 30,
        latencyMs: 2100,
        handledLocally: true,
      });

      const history = getConversationHistory('sess-1');
      expect(history).toHaveLength(2);
    });

    it('tracks local vs Claude', () => {
      storeConversation('s1', 'Anton', 'agent', 'Hey', { handledLocally: true });
      storeConversation('s2', 'James', 'agent', 'Building API', { handledLocally: false });

      const stats = getMemoryStats();
      expect(stats.localVsClaude.local).toBe(1);
      expect(stats.localVsClaude.claude).toBe(1);
    });
  });

  describe('searchMemories', () => {
    it('finds memories by keyword', () => {
      storeMemory('Marcus', 'fact', 'Auth module uses JWT tokens');
      storeMemory('Elena', 'fact', 'Dashboard uses React components');
      storeMemory('James', 'fact', 'API uses Fastify framework');

      const results = searchMemories('JWT');
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].content).toContain('JWT');
    });

    it('filters by agent', () => {
      storeMemory('Marcus', 'fact', 'Architecture decision A');
      storeMemory('Elena', 'fact', 'Architecture decision B');

      const results = searchMemories('Architecture', { agent: 'Marcus' });
      expect(results.every((r) => r.agent === 'Marcus')).toBe(true);
    });
  });

  describe('buildMemoryContext', () => {
    it('builds context string for brain injection', () => {
      storeMemory('Anton', 'fact', 'Sprint 8 started on Monday');
      storeMemory('Marcus', 'decision', 'Use microservices for scaling');

      const context = buildMemoryContext('Marcus');
      expect(context).toContain('Sprint 8');
      expect(context).toContain('microservices');
    });

    it('returns empty string when no memories', () => {
      const context = buildMemoryContext('nobody');
      expect(context).toBe('');
    });
  });

  describe('storeTrainingData', () => {
    it('stores training pairs', () => {
      storeTrainingData('what should I focus on?', 'Check the 3 blocked tasks', {
        rating: 'positive',
        source: 'user',
        agent: 'Anton',
      });

      const stats = getMemoryStats();
      expect(stats.totalTraining).toBe(1);
    });
  });

  describe('getMemoryStats', () => {
    it('returns aggregate stats', () => {
      storeMemory('Anton', 'fact', 'Fact 1');
      storeMemory('Marcus', 'fact', 'Fact 2');
      storeConversation('s1', 'Anton', 'user', 'Hello');
      storeTrainingData('input', 'output');

      const stats = getMemoryStats();
      expect(stats.totalMemories).toBe(2);
      expect(stats.totalConversations).toBe(1);
      expect(stats.totalTraining).toBe(1);
      expect(stats.byAgent).toHaveLength(2);
    });
  });
});
