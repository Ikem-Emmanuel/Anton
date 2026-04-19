import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the Claude Agent SDK
vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  unstable_v2_createSession: vi.fn(),
  unstable_v2_resumeSession: vi.fn(),
}));

// Mock fs operations
vi.mock('node:fs', () => ({
  readFileSync: vi.fn(() => '{}'),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(() => false),
}));

// Mock logger so no file I/O during tests
vi.mock('../nervous/logger.js', () => ({
  logSession: vi.fn(),
  logToolUse: vi.fn(),
  logHandoff: vi.fn(),
}));

// Mock analytics
vi.mock('../nervous/analytics.js', () => ({
  trackSession: vi.fn(),
  trackRequest: vi.fn(),
  initAnalytics: vi.fn(),
  getReport: vi.fn(),
}));

// Mock team
vi.mock('../brain/team.js', () => ({
  findByName: vi.fn(() => null),
}));

// Import after mocks
const { consumeHandoffs, resetSession } = await import('./sessions.js');

describe('sessions', () => {
  describe('consumeHandoffs', () => {
    it('returns empty array for agent with no pending handoffs', () => {
      const result = consumeHandoffs('Marcus');
      expect(result).toEqual([]);
    });

    it('drains and clears the handoff queue', () => {
      const first = consumeHandoffs('James');
      const second = consumeHandoffs('James');
      expect(first).toEqual([]);
      expect(second).toEqual([]);
    });

    it('returns empty array for any unknown agent name', () => {
      expect(consumeHandoffs('UnknownAgent')).toEqual([]);
      expect(consumeHandoffs('Elena')).toEqual([]);
      expect(consumeHandoffs('Omar')).toEqual([]);
    });

    it('calling multiple times on same agent always returns empty array when nothing queued', () => {
      for (let i = 0; i < 5; i++) {
        expect(consumeHandoffs('Priya')).toEqual([]);
      }
    });
  });

  describe('resetSession', () => {
    it('does not throw for unknown agent key string', () => {
      expect(() => resetSession('nonexistent')).not.toThrow();
    });

    it('does not throw for unknown agent key object', () => {
      expect(() => resetSession({ agent: 'nonexistent' })).not.toThrow();
    });

    it('accepts a plain string key', () => {
      expect(() => resetSession('james')).not.toThrow();
    });

    it('accepts an object with .agent property', () => {
      expect(() => resetSession({ agent: 'james', name: 'James' })).not.toThrow();
    });

    it('can be called repeatedly without error', () => {
      expect(() => {
        resetSession('marcus');
        resetSession('marcus');
        resetSession('marcus');
      }).not.toThrow();
    });
  });
});
