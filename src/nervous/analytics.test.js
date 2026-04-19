/**
 * analytics.test.js — Tests for agent analytics tracking and reporting.
 *
 * Uses a real temp directory for file I/O (no mocks needed — module is pure Node.js).
 * Resets module state between tests by re-importing after temp dir changes.
 */

import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// We import the module once but reset state by calling initAnalytics with a fresh dir each test.
import { getReport, getStats, initAnalytics, trackRequest, trackSession } from './analytics.js';

let testDir;

beforeEach(() => {
  testDir = join(tmpdir(), `anton-analytics-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(testDir, { recursive: true });
  initAnalytics(testDir);
});

afterEach(() => {
  try {
    rmSync(testDir, { recursive: true, force: true });
  } catch {}
});

// ─────────────────────────────────────────────────────────────
// initAnalytics
// ─────────────────────────────────────────────────────────────
describe('initAnalytics', () => {
  it('creates the analytics directory', () => {
    const analyticsDir = join(testDir, 'analytics');
    expect(existsSync(analyticsDir)).toBe(true);
  });

  it('starts with zero totals', () => {
    const stats = getStats();
    expect(stats.totals.messages).toBe(0);
    expect(stats.totals.errors).toBe(0);
    expect(stats.totals.tokens_est).toBe(0);
  });

  it("has today's date", () => {
    const stats = getStats();
    const today = new Date().toISOString().split('T')[0];
    expect(stats.date).toBe(today);
  });
});

// ─────────────────────────────────────────────────────────────
// trackRequest
// ─────────────────────────────────────────────────────────────
describe('trackRequest', () => {
  it('increments total message count', () => {
    const before = Date.now() - 100;
    trackRequest('James', before, true, 400);
    expect(getStats().totals.messages).toBe(1);
  });

  it('creates agent entry on first call', () => {
    trackRequest('Elena', Date.now() - 50, true, 200);
    const stats = getStats();
    expect(stats.agents['Elena']).toBeDefined();
    expect(stats.agents['Elena'].messages).toBe(1);
    expect(stats.agents['Elena'].successful).toBe(1);
    expect(stats.agents['Elena'].errors).toBe(0);
  });

  it('increments error count on failure', () => {
    trackRequest('Marcus', Date.now() - 30, false, 0);
    const stats = getStats();
    expect(stats.agents['Marcus'].errors).toBe(1);
    expect(stats.agents['Marcus'].successful).toBe(0);
    expect(stats.totals.errors).toBe(1);
  });

  it('estimates tokens from response length (÷4)', () => {
    trackRequest('James', Date.now() - 10, true, 400); // 400 / 4 = 100 tokens
    const stats = getStats();
    expect(stats.agents['James'].tokens_est).toBe(100);
    expect(stats.totals.tokens_est).toBe(100);
  });

  it('accumulates stats across multiple calls', () => {
    trackRequest('Priya', Date.now() - 200, true, 800);
    trackRequest('Priya', Date.now() - 300, true, 400);
    trackRequest('Priya', Date.now() - 100, false, 0);

    const stats = getStats().agents['Priya'];
    expect(stats.messages).toBe(3);
    expect(stats.successful).toBe(2);
    expect(stats.errors).toBe(1);
    expect(stats.tokens_est).toBe(300); // (800 + 400 + 0) / 4
  });

  it('tracks min and max response time', () => {
    trackRequest('Sarah', Date.now() - 500, true, 0); // ~500ms
    trackRequest('Sarah', Date.now() - 100, true, 0); // ~100ms

    const agent = getStats().agents['Sarah'];
    expect(agent.min_response_ms).toBeLessThanOrEqual(200);
    expect(agent.max_response_ms).toBeGreaterThanOrEqual(300);
  });

  it('calculates avg_response_ms', () => {
    // Fixed: use deterministic start times relative to now
    const now = Date.now();
    trackRequest('Omar', now - 1000, true, 0); // 1000ms
    trackRequest('Omar', now - 500, true, 0); // 500ms (approx)

    const agent = getStats().agents['Omar'];
    // avg should be roughly (1000 + 500) / 2 = 750ms — not exact due to Date.now() calls inside
    expect(agent.avg_response_ms).toBeGreaterThan(100);
    expect(agent.avg_response_ms).toBeLessThan(2000);
  });

  it('returns elapsed and agentName', () => {
    const result = trackRequest('Ada', Date.now() - 250, true, 0);
    expect(result.agentName).toBe('Ada');
    expect(result.elapsed).toBeGreaterThanOrEqual(0);
  });

  it('writes analytics JSON to disk', () => {
    trackRequest('Ben', Date.now() - 100, true, 100);
    const today = new Date().toISOString().split('T')[0];
    const file = join(testDir, 'analytics', `daily-${today}.json`);
    expect(existsSync(file)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// trackSession
// ─────────────────────────────────────────────────────────────
describe('trackSession', () => {
  it('stores truncated session ID', () => {
    trackSession('James', 'session-abc123-full-id');
    const stats = getStats();
    expect(stats.sessions['James']).toBe('session-');
  });

  it('handles null session ID', () => {
    trackSession('Elena', null);
    const stats = getStats();
    expect(stats.sessions['Elena']).toBe('unknown');
  });
});

// ─────────────────────────────────────────────────────────────
// getReport
// ─────────────────────────────────────────────────────────────
describe('getReport', () => {
  it('returns a non-empty string', () => {
    const report = getReport();
    expect(typeof report).toBe('string');
    expect(report.length).toBeGreaterThan(0);
  });

  it("includes today's date in the header", () => {
    const today = new Date().toISOString().split('T')[0];
    expect(getReport()).toContain(today);
  });

  it('shows "No agent activity yet." when no agents tracked', () => {
    expect(getReport()).toContain('No agent activity yet.');
  });

  it('includes agent name after tracking', () => {
    trackRequest('Marcus', Date.now() - 100, true, 200);
    expect(getReport()).toContain('Marcus');
  });

  it('includes model row for Sonnet (Marcus is Opus)', () => {
    trackRequest('Marcus', Date.now() - 100, true, 400);
    const report = getReport();
    expect(report).toContain('Opus');
    expect(report).toContain('Sonnet');
    expect(report).toContain('Haiku');
  });

  it('shows error warning for agents with errors', () => {
    trackRequest('James', Date.now() - 100, false, 0);
    expect(getReport()).toContain('⚠');
  });

  it('includes uptime in overview block', () => {
    const report = getReport();
    // Uptime is shown as "0m" or similar
    expect(report).toMatch(/Uptime:\s+\d/);
  });

  it('shows session info when sessions tracked', () => {
    trackRequest('Riley', Date.now() - 100, true, 100);
    trackSession('Riley', 'ses-abc123');
    const report = getReport();
    expect(report).toContain('Sessions');
    expect(report).toContain('Riley');
  });
});

// ─────────────────────────────────────────────────────────────
// Multi-agent tracking
// ─────────────────────────────────────────────────────────────
describe('multi-agent tracking', () => {
  it('tracks multiple agents independently', () => {
    trackRequest('Marcus', Date.now() - 500, true, 800);
    trackRequest('James', Date.now() - 200, true, 400);
    trackRequest('Elena', Date.now() - 100, false, 0);

    const stats = getStats();
    expect(stats.agents['Marcus'].successful).toBe(1);
    expect(stats.agents['James'].successful).toBe(1);
    expect(stats.agents['Elena'].errors).toBe(1);
    expect(stats.totals.messages).toBe(3);
    expect(stats.totals.errors).toBe(1);
  });

  it('report table lists agents sorted by message count (most active first)', () => {
    trackRequest('James', Date.now() - 100, true, 100);
    trackRequest('James', Date.now() - 100, true, 100);
    trackRequest('Marcus', Date.now() - 100, true, 100);

    const report = getReport();
    const jamesPos = report.indexOf('James');
    const marcusPos = report.indexOf('Marcus');
    expect(jamesPos).toBeLessThan(marcusPos); // James (2 msgs) before Marcus (1 msg)
  });
});
