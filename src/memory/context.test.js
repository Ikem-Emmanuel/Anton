import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAllSummaries,
  getContextForAgent,
  getModelForMessage,
  getSessionMessageCount,
  initContext,
  resetSessionMessageCount,
  saveConversationSummary,
  shouldUseHaiku,
  trackSessionMessage,
} from './context.js';

// Mock memory module
vi.mock('./memory-v1.js', () => ({
  readSharedMemory: vi.fn(() => 'Shared memory: Sprint 8 started.'),
  readDeptMemory: vi.fn((dept) => (dept === 'eng' ? 'Engineering: Auth module shipped.' : '')),
  getDailyNote: vi.fn(() => 'Daily: Marcus reviewed 3 PRs.'),
}));

describe('context', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'anton-context-'));
    initContext(tempDir);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('getContextForAgent', () => {
    it('injects shared memory', () => {
      const ctx = getContextForAgent({ name: 'Marcus', dept: 'eng' });
      expect(ctx).toContain('ORG MEMORY');
      expect(ctx).toContain('Sprint 8 started');
    });

    it('injects department memory', () => {
      const ctx = getContextForAgent({ name: 'James', dept: 'eng' });
      expect(ctx).toContain('DEPARTMENT MEMORY');
      expect(ctx).toContain('Auth module shipped');
    });

    it('injects daily notes', () => {
      const ctx = getContextForAgent({ name: 'Marcus', dept: 'eng' });
      expect(ctx).toContain("TODAY'S NOTES");
      expect(ctx).toContain('Marcus reviewed 3 PRs');
    });

    it('injects conversation summary if available', () => {
      saveConversationSummary('Elena', 'Worked on dashboard components. Blocked on API contract.');
      const ctx = getContextForAgent({ name: 'Elena', dept: 'eng' });
      expect(ctx).toContain('PREVIOUS CONTEXT');
      expect(ctx).toContain('dashboard components');
    });

    it('wraps context in memory fence tags', () => {
      const ctx = getContextForAgent({ name: 'Marcus', dept: 'eng' });
      expect(ctx).toContain('--- MEMORY CONTEXT');
      expect(ctx).toContain('--- END MEMORY CONTEXT ---');
    });

    it('returns empty string when no memory exists', async () => {
      const { readSharedMemory, readDeptMemory, getDailyNote } = await import('./memory-v1.js');
      readSharedMemory.mockReturnValueOnce('');
      readDeptMemory.mockReturnValueOnce('');
      getDailyNote.mockReturnValueOnce('');
      const ctx = getContextForAgent({ name: 'NewAgent', dept: 'none' });
      expect(ctx).toBe('');
    });
  });

  describe('shouldUseHaiku', () => {
    it('returns true for simple short messages', () => {
      expect(shouldUseHaiku('hey')).toBe(true);
      expect(shouldUseHaiku('thanks')).toBe(true);
      expect(shouldUseHaiku('ok sounds good')).toBe(true);
      expect(shouldUseHaiku('what time is standup?')).toBe(true);
    });

    it('returns false for complex messages', () => {
      expect(shouldUseHaiku('build an auth endpoint with JWT')).toBe(false);
      expect(shouldUseHaiku('review this code and fix the bug')).toBe(false);
      expect(shouldUseHaiku('implement the dashboard page')).toBe(false);
    });

    it('returns false for messages with code', () => {
      expect(shouldUseHaiku('check `sessions.js`')).toBe(false);
      expect(shouldUseHaiku('```\nconst x = 1;\n```')).toBe(false);
    });

    it('returns false for long messages', () => {
      expect(shouldUseHaiku('x'.repeat(150))).toBe(false);
    });
  });

  describe('getModelForMessage', () => {
    it('always uses sonnet for Anton', () => {
      expect(getModelForMessage('hi', { name: 'Anton' })).toBe('sonnet');
    });

    it('always uses sonnet for leads', () => {
      expect(getModelForMessage('hi', { name: 'Marcus', canPlan: true })).toBe('sonnet');
    });

    it('uses haiku for simple messages to non-leads', () => {
      expect(getModelForMessage('ok', { name: 'James', canPlan: false })).toBe('haiku');
    });

    it('uses sonnet for complex messages to anyone', () => {
      expect(getModelForMessage('build the auth module', { name: 'James', canPlan: false })).toBe('sonnet');
    });
  });

  describe('saveConversationSummary', () => {
    it('persists summary to disk', () => {
      saveConversationSummary('James', 'Built auth endpoint. Tests passing.');
      const summaries = getAllSummaries();
      const james = summaries.find((s) => s.agent === 'James');
      expect(james).toBeDefined();
      expect(james.text).toContain('auth endpoint');
    });

    it('truncates long summaries', () => {
      saveConversationSummary('James', 'x'.repeat(3000));
      const summaries = getAllSummaries();
      expect(summaries.find((s) => s.agent === 'James').text.length).toBeLessThanOrEqual(1500);
    });

    it('overwrites previous summary', () => {
      saveConversationSummary('James', 'First summary');
      saveConversationSummary('James', 'Second summary');
      const summaries = getAllSummaries();
      const james = summaries.filter((s) => s.agent === 'James');
      expect(james).toHaveLength(1);
      expect(james[0].text).toBe('Second summary');
    });
  });

  describe('session health tracking', () => {
    it('tracks message count per agent', () => {
      trackSessionMessage('agent-a');
      trackSessionMessage('agent-a');
      trackSessionMessage('agent-b');
      expect(getSessionMessageCount('agent-a')).toBe(2);
      expect(getSessionMessageCount('agent-b')).toBe(1);
    });

    it('resets count', () => {
      trackSessionMessage('agent-a');
      trackSessionMessage('agent-a');
      resetSessionMessageCount('agent-a');
      expect(getSessionMessageCount('agent-a')).toBe(0);
    });

    it('returns 0 for unknown agents', () => {
      expect(getSessionMessageCount('unknown')).toBe(0);
    });
  });
});
