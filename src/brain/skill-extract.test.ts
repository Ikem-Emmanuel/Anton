// Tests for skill extraction (Phase 3.5 §4.5.4 + §4.5.7).
// Short-circuits + error handling. Live LLM quality is smoke-tested.

import { describe, expect, it } from 'vitest';
import { extractSkillCandidate } from './skill-extract.js';

describe('Skill extraction', () => {
  it('skips short exchanges under the threshold', async () => {
    const r = await extractSkillCandidate('hi', 'hey', 'Marcus');
    expect(r.attempted).toBe(false);
    expect(r.extracted).toBe(false);
    expect(r.stored).toBe(false);
  });

  it('respects custom minExchangeLength', async () => {
    const r = await extractSkillCandidate('a'.repeat(100), 'b'.repeat(100), 'Marcus', undefined, {
      minExchangeLength: 500,
    });
    expect(r.attempted).toBe(false);
  });

  it('returns structured stats shape', async () => {
    const r = await extractSkillCandidate('x', 'y', 'Marcus');
    expect(r).toHaveProperty('attempted');
    expect(r).toHaveProperty('extracted');
    expect(r).toHaveProperty('stored');
    expect(r).toHaveProperty('durationMs');
  });
});
