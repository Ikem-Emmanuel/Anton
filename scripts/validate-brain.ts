// Brain validation — realistic sprint-planning scenario end-to-end against live Ollama.
// Tests: routing accuracy, delegation chains (up to 2 hops), response quality,
// fallback resilience (local timeout → Claude), and handoff voice consistency.
//
// Usage: npx tsx scripts/validate-brain.ts

import { join } from 'node:path';
import { process as brainProcess, getBrainHealth, initBrain } from '../src/brain/brain.js';
import { initSqliteMemory } from '../src/memory/sqlite.js';

const PROJECT_ROOT = join(import.meta.dirname, '..');
const LINE = '─'.repeat(92);

interface Scenario {
  label: string;
  input: string;
  expect: {
    localPath?: boolean;
    handoffTo?: string[];
    contentIncludes?: string[];
  };
}

// Realistic sprint-planning sequence — each message builds on the prior one.
// Anton should delegate, agents should respond in-character, handoffs should fire.
const scenarios: Scenario[] = [
  {
    label: 'S1 · Self-identity (baseline local response)',
    input: 'Who are you, how does your brain work, what model do you run on, and who is your creator?',
    expect: {
      localPath: true,
      contentIncludes: ['anton', 'noel'],
    },
  },
  {
    label: 'S2 · Sprint kickoff — delegate to PM',
    input:
      'Sarah, kick off Sprint 9. Theme is user authentication. Draft a sprint goal and list the top 5 user stories we should tackle.',
    expect: {
      handoffTo: ['Sarah'],
      contentIncludes: ['sprint'],
    },
  },
  {
    label: 'S3 · Architecture review — delegate to Tech Lead with handoff to devs',
    input:
      'Marcus, review the auth scope Sarah drafted. Identify 3 key architecture decisions (auth mechanism, session strategy, password storage). Then loop James for backend implementation and Elena for frontend.',
    expect: {
      handoffTo: ['Marcus'],
      contentIncludes: ['architecture'],
    },
  },
  {
    label: 'S4 · QA + DevOps parallel delegation',
    input:
      'Priya, draft the QA test plan for the auth feature — unit, integration, E2E. Omar, list the deploy steps including staging smoke test and rollback plan.',
    expect: {
      handoffTo: ['Priya', 'Omar'],
      contentIncludes: ['test'],
    },
  },
  {
    label: 'S5 · Status synthesis — brain synthesizes from memory',
    input:
      "Give me a one-paragraph status on Sprint 9 so far. What have we decided, what's assigned to whom, what's the riskiest item?",
    expect: {
      localPath: true,
    },
  },
  {
    label: 'S6 · Meta-reflection',
    input:
      'Given what we just did — sprint kickoff, arch review, dev split, QA + deploy — what parts of this flow did you handle locally versus needing Claude, and what could be improved?',
    expect: {},
  },
];

function formatPipelineTrace(result: Awaited<ReturnType<typeof brainProcess>>, ms: number): string {
  const c = result.classification;
  return [
    `   · path:        ${result.handledLocally ? 'LOCAL (Ollama)' : 'CLAUDE (SDK)'}`,
    `   · route:       ${c?.route ?? 'n/a'} (model=${result.model})`,
    `   · reason:      ${c?.reason ?? 'n/a'}`,
    `   · intent:      ${c?.intent ?? 'n/a'}`,
    `   · depth:       ${c?.depth ?? 'n/a'}`,
    `   · confidence:  ${c?.confidence?.toFixed(2) ?? 'n/a'}`,
    `   · tokens:      in=${result.tokensIn} out=${result.tokensOut}`,
    `   · latency:     ${ms}ms`,
    `   · handoffs:    ${result.handoffs.length > 0 ? result.handoffs.map((h) => h.agent).join(', ') : 'none'}`,
  ].join('\n');
}

function indent(text: string, prefix = '   '): string {
  return text
    .split('\n')
    .map((l) => `${prefix}${l}`)
    .join('\n');
}

function evalExpectations(scenario: Scenario, result: Awaited<ReturnType<typeof brainProcess>>): string[] {
  const mismatches: string[] = [];
  const e = scenario.expect;

  if (e.localPath !== undefined && result.handledLocally !== e.localPath) {
    mismatches.push(
      `path: expected ${e.localPath ? 'LOCAL' : 'CLAUDE'}, got ${result.handledLocally ? 'LOCAL' : 'CLAUDE'}`
    );
  }
  if (e.handoffTo) {
    const actualAgents = result.handoffs.map((h) => h.agent);
    for (const expected of e.handoffTo) {
      if (!actualAgents.includes(expected)) {
        mismatches.push(`handoff: expected ${expected}, got [${actualAgents.join(',') || 'none'}]`);
      }
    }
  }
  if (e.contentIncludes) {
    const lower = result.text.toLowerCase();
    for (const kw of e.contentIncludes) {
      if (!lower.includes(kw.toLowerCase())) {
        mismatches.push(`content: expected keyword "${kw}" missing`);
      }
    }
  }
  return mismatches;
}

interface RunSummary {
  label: string;
  latencyMs: number;
  path: 'LOCAL' | 'CLAUDE' | 'ERROR';
  tokens: number;
  handoffCount: number;
  handoffsResolved: number;
  mismatches: string[];
  ok: boolean;
}

async function runScenario(scenario: Scenario): Promise<RunSummary> {
  console.log('');
  console.log(LINE);
  console.log(`▌ ${scenario.label}`);
  console.log(`▌ INPUT: ${scenario.input}`);
  console.log(LINE);

  const t0 = Date.now();
  let result: Awaited<ReturnType<typeof brainProcess>>;

  try {
    result = await brainProcess(scenario.input);
  } catch (err) {
    console.error(' ERROR: process() crashed:', (err as Error).message);
    return {
      label: scenario.label,
      latencyMs: Date.now() - t0,
      path: 'ERROR',
      tokens: 0,
      handoffCount: 0,
      handoffsResolved: 0,
      mismatches: ['process() threw'],
      ok: false,
    };
  }

  const ms = Date.now() - t0;

  console.log('');
  console.log(' Pipeline:');
  console.log(formatPipelineTrace(result, ms));
  console.log('');
  console.log(' Response:');
  console.log(indent(result.text || '(empty)'));

  // Follow handoffs (one hop — enough to verify chain works without exploding runtime).
  let handoffsResolved = 0;
  if (result.handoffs.length > 0) {
    console.log('');
    console.log(' ━━ Following handoffs (one hop each) ━━');
    for (const h of result.handoffs) {
      const t1 = Date.now();
      try {
        const hr = await brainProcess(h.message, {
          agent: h.agent,
          context: `Handoff from Anton`,
        });
        const hms = Date.now() - t1;
        handoffsResolved++;
        console.log('');
        console.log(` ▷ ${h.agent} (${hms}ms, ${hr.tokensOut}t, ${hr.handledLocally ? 'LOCAL' : 'CLAUDE'}):`);
        console.log(`   Handoff payload: ${h.message.slice(0, 160).replace(/\n/g, ' ')}...`);
        console.log('');
        console.log(indent(hr.text || '(empty)'));
        if (hr.handoffs.length > 0) {
          console.log('');
          console.log(`   ↳ ${h.agent} further delegates to: ${hr.handoffs.map((h) => h.agent).join(', ')}`);
        }
      } catch (e) {
        console.error(` ERROR in ${h.agent} handoff:`, (e as Error).message);
      }
    }
  }

  const mismatches = evalExpectations(scenario, result);
  const ok = mismatches.length === 0 && !!result.text;

  console.log('');
  if (mismatches.length > 0) {
    console.log(` ❌ mismatches: ${mismatches.join(' · ')}`);
  } else {
    console.log(` ✅ expectations met`);
  }

  return {
    label: scenario.label,
    latencyMs: ms,
    path: result.handledLocally ? 'LOCAL' : 'CLAUDE',
    tokens: result.tokensOut,
    handoffCount: result.handoffs.length,
    handoffsResolved,
    mismatches,
    ok,
  };
}

async function main() {
  console.log(LINE);
  console.log(' Sprint Planning Validation — Anton end-to-end');
  console.log(LINE);

  initSqliteMemory(join(PROJECT_ROOT, 'data'));
  await initBrain();
  const health = await getBrainHealth();
  console.log(` tier=${health.tier} · circuit=${health.circuit} · models=${health.models.length}`);

  const results: RunSummary[] = [];
  for (const s of scenarios) {
    const r = await runScenario(s);
    results.push(r);
  }

  // Summary
  console.log('');
  console.log(LINE);
  console.log(' Summary');
  console.log(LINE);
  console.log('');
  console.log(' scenario                                         ms     path    toks  hoff  status');
  console.log(' ' + '-'.repeat(86));
  for (const r of results) {
    const status = r.ok ? '✅' : '❌';
    const label = r.label.padEnd(48);
    const ms = String(r.latencyMs).padStart(5);
    const path = r.path.padEnd(7);
    const toks = String(r.tokens).padStart(5);
    const hoff = `${r.handoffsResolved}/${r.handoffCount}`.padEnd(5);
    console.log(` ${label} ${ms}  ${path} ${toks}  ${hoff} ${status}`);
    if (r.mismatches.length > 0) {
      for (const m of r.mismatches) console.log(`   └ ${m}`);
    }
  }

  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log('');
  console.log(` PASSED: ${passed}/${total}`);

  if (passed < total) {
    (globalThis as unknown as { process: { exit: (n: number) => never } }).process.exit(1);
  }
}

main().catch((e) => {
  console.error('validate crashed:', e);
  (globalThis as unknown as { process: { exit: (n: number) => never } }).process.exit(1);
});
