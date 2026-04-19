// Phase 2.5 smoke test — runs the brain end-to-end against live Ollama.
// Usage: npx tsx scripts/smoke-brain.ts

import { process, initBrain, getBrainHealth } from '../src/brain/brain.js';

const cases: Array<{
  name: string;
  input: string;
  expect: Partial<{ handledLocally: boolean; needsClaude: boolean; depth: string; intent: string }>;
}> = [
  { name: 'greeting', input: 'hey', expect: { handledLocally: true, depth: 'minimal', intent: 'greeting' } },
  { name: 'approval', input: 'yes', expect: { handledLocally: true, depth: 'minimal', intent: 'approval' } },
  { name: 'code-block', input: '```ts\nconst x = 1;\n```', expect: { needsClaude: true } },
  { name: 'self-q', input: 'who are you?', expect: { handledLocally: true } },
  { name: 'team-q', input: 'who is on the engineering team?', expect: { handledLocally: true } },
  { name: 'delegation', input: 'tell Marcus to review the PR', expect: { handledLocally: true } },
  { name: 'code-req', input: 'build a REST endpoint for user profiles', expect: { needsClaude: true } },
  { name: '@claude', input: '@claude explain quantum entanglement', expect: { needsClaude: true } },
  { name: 'status', input: 'status', expect: { handledLocally: true, depth: 'minimal' } },
];

async function run() {
  console.log('Initializing brain...');
  await initBrain();
  const health = await getBrainHealth();
  console.log(
    `Brain: healthy=${health.healthy} tier=${health.tier} circuit=${health.circuit} models=${health.models.length}`
  );
  if (!health.healthy) {
    console.error('Ollama not healthy. Aborting.');
    process_exit(1);
  }
  console.log('');

  let passed = 0;
  let failed = 0;
  const results: Array<{ name: string; ms: number; ok: boolean; details: string }> = [];

  for (const c of cases) {
    const t0 = Date.now();
    try {
      const result = await process(c.input);
      const ms = Date.now() - t0;
      const actual = {
        handledLocally: result.handledLocally,
        needsClaude: result.needsClaude,
        depth: result.classification?.depth,
        intent: result.classification?.intent,
      };
      const mismatches: string[] = [];
      for (const [k, v] of Object.entries(c.expect)) {
        if (actual[k as keyof typeof actual] !== v) {
          mismatches.push(`${k}: expected ${v}, got ${actual[k as keyof typeof actual]}`);
        }
      }
      const ok = mismatches.length === 0;
      const details = ok
        ? `${result.model} · ${result.tokensOut}t · ${result.classification?.reason}`
        : mismatches.join('; ');
      results.push({ name: c.name, ms, ok, details });
      if (ok) passed++;
      else failed++;
    } catch (err) {
      failed++;
      results.push({ name: c.name, ms: Date.now() - t0, ok: false, details: `ERR: ${(err as Error).message}` });
    }
  }

  console.log('─────────────────────────────────────────────────────────────────');
  console.log(' name           ms     status   details');
  console.log('─────────────────────────────────────────────────────────────────');
  for (const r of results) {
    const icon = r.ok ? '✓' : '✗';
    console.log(` ${r.name.padEnd(14)} ${String(r.ms).padStart(5)}   ${icon}        ${r.details}`);
  }
  console.log('─────────────────────────────────────────────────────────────────');
  console.log(` passed: ${passed}/${cases.length}   failed: ${failed}`);
  if (failed > 0) process_exit(1);
}

function process_exit(code: number): never {
  (globalThis as unknown as { process: { exit: (n: number) => never } }).process.exit(code);
}

run().catch((err) => {
  console.error('Smoke test crashed:', err);
  process_exit(1);
});
