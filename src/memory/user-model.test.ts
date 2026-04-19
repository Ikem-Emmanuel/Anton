// Tests for the structured user model (Phase 3.5 §4.5.5).

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildUserModelContext,
  closeSqliteMemory,
  getUserModelEntries,
  initSqliteMemory,
  upsertUserModelEntry,
} from './sqlite.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'anton-um-'));
  initSqliteMemory(tmpDir);
});

afterEach(() => {
  closeSqliteMemory();
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('User model (Phase 3.5 §4.5.5)', () => {
  it('stores a new entry across all 4 dimensions', () => {
    upsertUserModelEntry('output_format', 'preferred_length', 'terse');
    upsertUserModelEntry('decision', 'auth_provider', 'self-hosted');
    upsertUserModelEntry('task_pattern', 'morning_brief_time', '7:30am');
    upsertUserModelEntry('feedback', 'correction_rate_engineering', '12%');

    expect(getUserModelEntries().length).toBe(4);
  });

  it('upsert bumps evidence_count on repeated observations', () => {
    upsertUserModelEntry('output_format', 'preferred_length', 'terse', 0.7);
    upsertUserModelEntry('output_format', 'preferred_length', 'terse', 0.8);
    upsertUserModelEntry('output_format', 'preferred_length', 'terse', 0.9);

    const entries = getUserModelEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].evidence_count).toBe(3);
    // Confidence is moving average — should be close to 0.8 after 3 observations
    expect(entries[0].confidence).toBeGreaterThan(0.7);
    expect(entries[0].confidence).toBeLessThan(0.9);
  });

  it('filters by minimum confidence', () => {
    upsertUserModelEntry('output_format', 'low_conf', 'x', 0.3);
    upsertUserModelEntry('output_format', 'high_conf', 'y', 0.9);

    const above = getUserModelEntries({ minConfidence: 0.7 });
    expect(above).toHaveLength(1);
    expect(above[0].key).toBe('high_conf');
  });

  it('filters by dimension', () => {
    upsertUserModelEntry('decision', 'auth_choice', 'TOTP');
    upsertUserModelEntry('output_format', 'length', 'terse');

    const decisions = getUserModelEntries({ dimension: 'decision' });
    expect(decisions).toHaveLength(1);
    expect(decisions[0].key).toBe('auth_choice');
  });

  it('rejects invalid dimension via CHECK constraint', () => {
    expect(() =>
      // @ts-expect-error — testing runtime validation
      upsertUserModelEntry('invalid_dimension', 'key', 'value')
    ).toThrow();
  });

  it('buildUserModelContext returns empty when no high-confidence rows', () => {
    upsertUserModelEntry('output_format', 'only_low', 'x', 0.3);
    expect(buildUserModelContext()).toBe('');
  });

  it('buildUserModelContext formats [USER MODEL] block', () => {
    upsertUserModelEntry('output_format', 'preferred_length', 'terse; 1-3 sentences', 0.9);
    upsertUserModelEntry('decision', 'auth_provider', 'self-hosted TOTP + bcrypt', 0.85);

    const ctx = buildUserModelContext();
    expect(ctx).toContain('[USER MODEL]');
    expect(ctx).toContain('output_format.preferred_length');
    expect(ctx).toContain('decision.auth_provider');
    expect(ctx).toContain('conf 0.9');
  });

  it('orders entries by confidence then evidence_count', () => {
    upsertUserModelEntry('output_format', 'a', 'x', 0.5);
    upsertUserModelEntry('output_format', 'b', 'y', 0.9);
    upsertUserModelEntry('output_format', 'c', 'z', 0.7);

    const entries = getUserModelEntries();
    expect(entries.map((e) => e.key)).toEqual(['b', 'c', 'a']);
  });

  it('respects max-lines cap', () => {
    for (let i = 0; i < 10; i++) {
      upsertUserModelEntry('output_format', `key${i}`, `value${i}`, 0.9);
    }
    const ctx = buildUserModelContext(0.5, 3);
    const lineCount = ctx.split('\n').length;
    expect(lineCount).toBeLessThanOrEqual(4); // 1 header + 3 entries
  });
});
