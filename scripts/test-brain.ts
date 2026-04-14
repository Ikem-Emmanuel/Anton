#!/usr/bin/env npx tsx
// Manual test for the brain — tests classification + local response
// Usage: npx tsx scripts/test-brain.ts

import { initBrain, process as brainProcess, getBrainHealth } from '../src/brain/brain.js';

console.log('--- Anton Brain Test ---\n');

// Init
await initBrain();
const health = await getBrainHealth();
console.log(
  `[Health] Tier ${health.tier}, Ollama: ${health.ollamaUp ? 'UP' : 'DOWN'}, Models: ${health.models.join(', ')}\n`
);

// Test cases — each should classify and route correctly
const tests = [
  { msg: 'hey', expect: 'greeting, minimal, local' },
  { msg: 'what time is standup?', expect: 'question, simple, local' },
  { msg: 'how is the engineering team doing?', expect: 'status, standard, local' },
  { msg: 'ask Marcus to review the auth architecture', expect: 'delegation, agent=Marcus' },
  { msg: 'build a REST API for user management', expect: 'task, complex, needsClaude' },
  { msg: 'yes approve it', expect: 'approval, minimal, local' },
  { msg: 'analyze AAPL stock', expect: 'finance, local' },
  { msg: 'Elena, can you prep the interview docs?', expect: 'delegation, agent=Elena' },
  { msg: 'what did James work on yesterday?', expect: 'question, agent=James or local' },
  { msg: 'research the best auth patterns for 2026', expect: 'task, needsClaude' },
];

for (const test of tests) {
  console.log(`[Input] "${test.msg}"`);
  console.log(`[Expected] ${test.expect}`);

  const result = await brainProcess(test.msg);

  const c = result.classification;
  console.log(
    `[Got] intent=${c.intent}, complexity=${c.complexity}, depth=${c.adaptiveDepth}, confidence=${c.confidence.toFixed(2)}`
  );
  console.log(`      agent=${c.agent || 'none'}, needsClaude=${c.needsClaude}, model=${result.model}`);
  console.log(
    `      handledLocally=${result.handledLocally}, ${result.tokensIn}in/${result.tokensOut}out, ${result.durationMs}ms`
  );

  if (result.handledLocally) {
    console.log(`[Response] ${result.text.slice(0, 150)}${result.text.length > 150 ? '...' : ''}`);
  } else {
    console.log(`[Routed] ${result.text}`);
  }

  if (c.handoffs.length > 0) {
    for (const h of c.handoffs) {
      console.log(`[Handoff] -> ${h.agent}: ${h.message}`);
    }
  }

  console.log('');
}

console.log('--- Test complete ---');
process.exit(0);
