// Tests for the outcome-evaluation pass (Phase 3.5 §4.5.2).
// Covers: short-exchange skipping, schema edge handling, result shape.
// Does not call Ollama — the evaluator's skip path is exercised directly.
// Live judge quality is validated in the smoke script against real Ollama.

import { describe, expect, it } from 'vitest';
import { evaluateTurn } from './evaluate.js';

describe('Outcome evaluation', () => {
  it('skips trivial exchanges under the threshold', async () => {
    const r = await evaluateTurn(1, 'hi', 'hey', 'Anton');
    expect(r.attempted).toBe(false);
    expect(r.verdict).toBeUndefined();
  });

  it('respects custom minExchangeLength', async () => {
    const r = await evaluateTurn(1, 'a'.repeat(50), 'b'.repeat(50), 'Anton', {
      minExchangeLength: 500,
    });
    expect(r.attempted).toBe(false);
  });

  it('returns structured result with durationMs for skipped', async () => {
    const r = await evaluateTurn(1, 'x', 'y', 'Anton');
    expect(r).toHaveProperty('attempted');
    expect(r).toHaveProperty('durationMs');
    expect(typeof r.durationMs).toBe('number');
  });

  it('handles empty strings safely', async () => {
    const r = await evaluateTurn(1, '', '', 'Anton');
    expect(r.attempted).toBe(false);
  });
});
