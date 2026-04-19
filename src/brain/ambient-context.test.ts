// Tests for ambient context builder — validates time bucketing, idle duration,
// open-items pluralization, and safe fallback when memory store is uninitialized.

import { describe, expect, it, vi } from 'vitest';
import { buildAmbientContext } from './ambient-context.js';

describe('Ambient context', () => {
  it('returns an [AMBIENT] header', () => {
    const ctx = buildAmbientContext();
    expect(ctx.startsWith('[AMBIENT]')).toBe(true);
  });

  it('includes current time and day', () => {
    const ctx = buildAmbientContext();
    expect(ctx).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/);
    expect(ctx).toMatch(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/);
  });

  it('adapts time-of-day label to hour', () => {
    const mockDate = (hour: number) => {
      const d = new Date();
      d.setHours(hour, 0, 0, 0);
      vi.setSystemTime(d);
    };

    vi.useFakeTimers();
    mockDate(8);
    expect(buildAmbientContext()).toContain('morning');
    mockDate(12);
    expect(buildAmbientContext()).toContain('midday');
    mockDate(16);
    expect(buildAmbientContext()).toContain('afternoon');
    mockDate(20);
    expect(buildAmbientContext()).toContain('evening');
    mockDate(23);
    expect(buildAmbientContext()).toContain('late evening');
    mockDate(3);
    expect(buildAmbientContext()).toContain('late night');
    vi.useRealTimers();
  });

  it('reports idle duration in minutes when < 60', () => {
    const tenMinAgo = new Date(Date.now() - 10 * 60_000);
    const ctx = buildAmbientContext({ lastInteractionAt: tenMinAgo });
    expect(ctx).toMatch(/Last interaction 10m ago/);
  });

  it('reports idle duration in hours when >= 60', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60_000);
    const ctx = buildAmbientContext({ lastInteractionAt: twoHoursAgo });
    expect(ctx).toMatch(/Last interaction 2h ago/);
  });

  it('omits idle when < 5 minutes', () => {
    const justNow = new Date(Date.now() - 2 * 60_000);
    const ctx = buildAmbientContext({ lastInteractionAt: justNow });
    expect(ctx).not.toMatch(/Last interaction/);
  });

  it('pluralizes approvals correctly', () => {
    expect(buildAmbientContext({ openApprovals: 1 })).toContain('1 approval pending');
    expect(buildAmbientContext({ openApprovals: 3 })).toContain('3 approvals pending');
    expect(buildAmbientContext({ openApprovals: 0 })).not.toContain('pending');
  });

  it('pluralizes tasks correctly', () => {
    expect(buildAmbientContext({ openTasks: 1 })).toContain('1 active task');
    expect(buildAmbientContext({ openTasks: 5 })).toContain('5 active tasks');
  });

  it('is tolerant of uninitialized memory store', () => {
    // getMemoryStats throws if db is null — ambient should swallow and still return header
    expect(() => buildAmbientContext()).not.toThrow();
  });
});
