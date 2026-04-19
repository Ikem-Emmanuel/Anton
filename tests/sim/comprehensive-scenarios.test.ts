// Comprehensive multi-agent scenario coverage.
//
// Verifies that the end-to-end pipeline (pre-gate → classifier → sim or
// responder → action extraction → state machine) behaves correctly across
// a wide range of real-world SDLC patterns: parallel tracks, architecture
// rejection with revision cycle, multi-hop clarification chains, and
// hallucinated-agent rejection. Pairs with the pure unit tests in
// state-machine.test.ts, agent-actions.test.ts, skills.test.ts, etc.
//
// Runs entirely in sim mode (no Ollama), < 50 ms total.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { process as brainProcess } from '../../src/brain/brain.js';
import { getSimProgress, getSimWarnings, loadFixture, resetSim } from '../../src/brain/sim-mode.js';
import { type AgentContext, agentContext, type TaskState, transition } from '../../src/brain/state-machine.js';
import { s3SprintParallel } from '../fixtures/s3-sprint-parallel.js';
import { s5ArchReject } from '../fixtures/s5-arch-reject.js';
import { s6MultiHopAsk } from '../fixtures/s6-multi-hop-ask.js';
import { s8HallucinatedAgent } from '../fixtures/s8-hallucinated-agent.js';

const orchestrator: AgentContext = { agent: 'Anton', isOrchestrator: true };
const human: AgentContext = { agent: 'Noel', isHuman: true };

function enableSim(fixture: Parameters<typeof loadFixture>[0]) {
  process.env.ANTON_SIM_MODE = '1';
  loadFixture(fixture);
}

function disableSim() {
  resetSim();
  delete process.env.ANTON_SIM_MODE;
}

//
// ─── S3 · Sprint parallel tracks ───────────────────────────────────────
//

describe('Scenario S3 — Sprint parallel tracks', () => {
  beforeEach(() => enableSim(s3SprintParallel));
  afterEach(() => disableSim());

  it('Anton fans out to James and Elena in parallel', async () => {
    const r = await brainProcess('Ship the dashboard feature this sprint');
    const agents = r.handoffs.map((h) => h.agent).sort();
    expect(agents).toEqual(['Elena', 'James']);
  });

  it('Elena asks James for the websocket schema mid-track', async () => {
    await brainProcess('Ship the dashboard feature');
    await brainProcess('Build backend for dashboard', { agent: 'James' });
    const r = await brainProcess('Build chart components for the frontend', { agent: 'Elena' });
    expect(r.handoffs[0].agent).toBe('James');
    expect(r.handoffs[0].message.toLowerCase()).toContain('websocket');
  });

  it('full parallel chain completes with both DONEs gated through Priya', async () => {
    const transcript = [
      { agent: 'Anton', input: 'Ship the dashboard feature' },
      { agent: 'James', input: 'Build backend for dashboard' },
      { agent: 'Elena', input: 'Build the frontend chart components' },
      { agent: 'James', input: 'Provide the websocket event schema to Elena' },
      { agent: 'James', input: 'finish backend and hand to QA' },
      { agent: 'Elena', input: 'finish frontend and hand to QA' },
      { agent: 'Priya', input: 'QA review both dashboard tracks' },
      { agent: 'Omar', input: 'Deploy to staging' },
    ];
    for (const step of transcript) await brainProcess(step.input, { agent: step.agent });
    expect(getSimProgress().done).toBe(transcript.length);
    expect(getSimWarnings()).toHaveLength(0);
  });

  it('state-machine: parallel tasks both independently reach verified', () => {
    // Simulate parallel sub-tasks; both must be verified before parent can complete.
    let backend: TaskState = 'in-progress';
    let frontend: TaskState = 'in-progress';

    backend = transition(backend, 'DONE', agentContext('James')).newState!;
    frontend = transition(frontend, 'DONE', agentContext('Elena')).newState!;
    expect(backend).toBe('needs-review');
    expect(frontend).toBe('needs-review');

    backend = transition(backend, 'REVIEW_START', agentContext('Priya')).newState!;
    backend = transition(backend, 'APPROVE', agentContext('Priya')).newState!;
    frontend = transition(frontend, 'REVIEW_START', agentContext('Priya')).newState!;
    frontend = transition(frontend, 'APPROVE', agentContext('Priya')).newState!;
    expect(backend).toBe('verified');
    expect(frontend).toBe('verified');
  });
});

//
// ─── S5 · Tech Lead rejects architecture ───────────────────────────────
//

describe('Scenario S5 — Architecture rejected, revised, approved', () => {
  beforeEach(() => enableSim(s5ArchReject));
  afterEach(() => disableSim());

  it('Marcus REJECT with task id + reason in content', async () => {
    await brainProcess('Plan a data export feature');
    await brainProcess('Scope data export', { agent: 'Sarah' });
    const r = await brainProcess('Review EXPORT-01 architecture', { agent: 'Marcus' });

    const reject = r.actions.find((a) => a.type === 'REJECT');
    expect(reject).toBeDefined();
    expect(reject!.target).toBe('EXPORT-01');
    expect(reject!.content.toLowerCase()).toContain('layering');
  });

  it('Sarah revises on rejection and triggers re-review', async () => {
    await brainProcess('Plan data export');
    await brainProcess('Scope data export', { agent: 'Sarah' });
    await brainProcess('Review EXPORT-01', { agent: 'Marcus' });
    const r = await brainProcess('Revise EXPORT-01', { agent: 'Sarah' });
    expect(r.handoffs[0].agent).toBe('Marcus');
    expect(r.handoffs[0].message.toLowerCase()).toContain('re-review');
  });

  it('full reject → revise → approve flow completes', async () => {
    const transcript = [
      { agent: 'Anton', input: 'Scope a data export feature' },
      { agent: 'Sarah', input: 'scope a data export plan' },
      { agent: 'Marcus', input: 'Review EXPORT-01 architecture' },
      { agent: 'Sarah', input: 'Revise EXPORT-01 per Marcus feedback' },
      { agent: 'Marcus', input: 'Re-review EXPORT-01 with revisions' },
    ];
    for (const step of transcript) await brainProcess(step.input, { agent: step.agent });
    expect(getSimProgress().done).toBe(5);
    expect(getSimWarnings()).toHaveLength(0);
  });

  it('state-machine: REJECT at pending-approval → needs-clarification → APPROVE path', () => {
    const techLead = agentContext('Marcus');
    let s: TaskState = 'pending-approval';
    s = transition(s, 'REJECT', techLead).newState!;
    expect(s).toBe('needs-clarification');
    s = transition(s, 'ASSIGN', orchestrator).newState!;
    expect(s).toBe('in-progress');
    s = transition(s, 'REQUEST_APPROVAL', agentContext('Sarah')).newState!;
    expect(s).toBe('pending-approval');
    s = transition(s, 'APPROVE', techLead).newState!;
    expect(s).toBe('in-progress');
  });
});

//
// ─── S6 · Multi-hop ASK chain ──────────────────────────────────────────
//

describe('Scenario S6 — Multi-hop ASK chain', () => {
  beforeEach(() => enableSim(s6MultiHopAsk));
  afterEach(() => disableSim());

  it('ASK propagates from James → Sarah → Marcus and resumes', async () => {
    await brainProcess('Build a rate limiter', { agent: 'Anton' });
    const jamesAsk = await brainProcess('Build rate limiter middleware', { agent: 'James' });
    expect(jamesAsk.actions.find((a) => a.type === 'ASK')?.target).toBe('Sarah');

    const sarahAsk = await brainProcess('SLA target for rate limit', { agent: 'Sarah' });
    expect(sarahAsk.actions.find((a) => a.type === 'ASK')?.target).toBe('Marcus');

    const marcusAnswer = await brainProcess('rate limit granularity question', { agent: 'Marcus' });
    expect(marcusAnswer.handoffs[0].agent).toBe('Sarah');
    expect(marcusAnswer.text.toLowerCase()).toContain('sliding window');
  });

  it('James resumes with DONE after answer chain completes', async () => {
    const transcript = [
      { agent: 'Anton', input: 'Build rate limiter' },
      { agent: 'James', input: 'Build rate limiter middleware' },
      { agent: 'Sarah', input: 'SLA target question' },
      { agent: 'Marcus', input: 'rate limit granularity question' },
      { agent: 'Sarah', input: 'per-user 100 req/s, global 10K' },
      { agent: 'James', input: 'Rate limit answer received' },
    ];
    const results = [];
    for (const step of transcript) {
      results.push(await brainProcess(step.input, { agent: step.agent }));
    }
    const lastJames = results[results.length - 1];
    expect(lastJames.actions.find((a) => a.type === 'DONE')).toBeDefined();
    expect(getSimWarnings()).toHaveLength(0);
  });

  it('state-machine: ASK → needs-clarification → ANSWER → in-progress → DONE', () => {
    const dev = agentContext('James');
    let s: TaskState = 'in-progress';
    s = transition(s, 'ASK', dev).newState!;
    expect(s).toBe('needs-clarification');
    s = transition(s, 'ANSWER', orchestrator).newState!;
    expect(s).toBe('in-progress');
    s = transition(s, 'DONE', dev).newState!;
    expect(s).toBe('needs-review');
  });
});

//
// ─── S8 · Hallucinated agent name rejected ─────────────────────────────
//

describe('Scenario S8 — Hallucinated agent rejection', () => {
  beforeEach(() => enableSim(s8HallucinatedAgent));
  afterEach(() => disableSim());

  it('drops HANDOFFs to unknown agents while keeping valid ones', async () => {
    const r = await brainProcess('architecture review needed', { agent: 'Anton' });
    const handoffAgents = r.handoffs.map((h) => h.agent);
    expect(handoffAgents).toContain('Marcus');
    expect(handoffAgents).not.toContain('Dave');
    // ASK to Rachel (also invalid) should be dropped too
    const askTargets = r.actions.filter((a) => a.type === 'ASK').map((a) => a.target);
    expect(askTargets).not.toContain('Rachel');
  });

  it('valid downstream handoff still fires from Marcus', async () => {
    await brainProcess('architecture review', { agent: 'Anton' });
    const r = await brainProcess('review the auth scope', { agent: 'Marcus' });
    expect(r.actions.find((a) => a.type === 'APPROVE')?.target).toBe('AUTH-01');
  });
});

//
// ─── Cross-cutting: hop cap + all-tags-in-one-response ────────────────
//

describe('State machine — hop cap and universal paths', () => {
  it('hop cap auto-escalates at configured limit', () => {
    const r = transition('in-progress', 'DONE', agentContext('James'), {
      hopCount: 20,
      maxHop: 20,
    });
    expect(r.newState).toBe('escalated');
    expect(r.shouldEscalate).toBe(true);
  });

  it('UNBLOCK from escalated resumes normal flow', () => {
    let s: TaskState = 'escalated';
    s = transition(s, 'UNBLOCK', human).newState!;
    expect(s).toBe('in-progress');
  });

  it('COMPLETE moves verified → done (orchestrator only)', () => {
    const r = transition('verified', 'COMPLETE', orchestrator);
    expect(r.newState).toBe('done');
    expect(transition('verified', 'COMPLETE', agentContext('James')).ok).toBe(false);
  });

  it('any agent can BLOCK from any active state', () => {
    for (const from of ['in-progress', 'needs-review', 'needs-fix', 'pending-approval'] as TaskState[]) {
      expect(transition(from, 'BLOCK', agentContext('James')).newState).toBe('blocked');
    }
  });

  it('terminal states reject further transitions', () => {
    expect(transition('done', 'BLOCK', agentContext('James')).ok).toBe(false);
    expect(transition('done', 'DONE', agentContext('James')).ok).toBe(false);
  });
});

//
// ─── Full SDLC state machine walk (end-to-end) ────────────────────────
//

describe('Full SDLC state machine walk', () => {
  it('planned → in-progress → needs-review → in-review → verified → done', () => {
    const dev = agentContext('James');
    const qa = agentContext('Priya');

    let s: TaskState = 'planned';
    s = transition(s, 'ASSIGN', orchestrator).newState!;
    expect(s).toBe('in-progress');

    s = transition(s, 'DONE', dev).newState!;
    expect(s).toBe('needs-review');

    s = transition(s, 'REVIEW_START', qa).newState!;
    expect(s).toBe('in-review');

    s = transition(s, 'APPROVE', qa).newState!;
    expect(s).toBe('verified');

    s = transition(s, 'COMPLETE', orchestrator).newState!;
    expect(s).toBe('done');
  });

  it('happy path with one rejection cycle stays under retry cap', () => {
    const dev = agentContext('James');
    const qa = agentContext('Priya');
    let s: TaskState = 'in-progress';
    let retry = 0;

    s = transition(s, 'DONE', dev).newState!;
    s = transition(s, 'REVIEW_START', qa).newState!;

    const r = transition(s, 'REJECT', qa, { retryCount: retry, maxRetry: 3 });
    expect(r.newState).toBe('needs-fix');
    if (r.shouldIncrementRetry) retry++;
    s = r.newState!;

    s = transition(s, 'DONE', dev).newState!;
    expect(s).toBe('needs-retest');
    s = transition(s, 'REVIEW_START', qa).newState!;
    s = transition(s, 'APPROVE', qa).newState!;
    expect(s).toBe('verified');
    expect(retry).toBe(1);
  });
});
