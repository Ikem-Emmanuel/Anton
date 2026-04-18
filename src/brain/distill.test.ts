// Distillation tests — short-exchange skipping, error handling, schema edges.
// Does not hit Ollama (that's integration tested via smoke script).

import { describe, expect, it } from 'vitest';
import { distillConversation } from './distill.js';

describe('Memory distillation', () => {
  it('skips exchanges shorter than threshold', async () => {
    const stats = await distillConversation('hi', 'hey', 'Anton');
    expect(stats.attempted).toBe(false);
    expect(stats.extracted).toBe(0);
    expect(stats.stored).toBe(0);
  });

  it('skips when minExchangeLength is raised', async () => {
    const stats = await distillConversation('This is a longer message but still should skip', 'short reply', 'Anton', {
      minExchangeLength: 500,
    });
    expect(stats.attempted).toBe(false);
  });

  it('returns structured stats object', async () => {
    const stats = await distillConversation('x', 'y', 'Anton');
    expect(stats).toHaveProperty('attempted');
    expect(stats).toHaveProperty('extracted');
    expect(stats).toHaveProperty('stored');
    expect(stats).toHaveProperty('durationMs');
  });

  it('handles empty strings without crashing', async () => {
    const stats = await distillConversation('', '', 'Anton');
    expect(stats.attempted).toBe(false);
  });
});
