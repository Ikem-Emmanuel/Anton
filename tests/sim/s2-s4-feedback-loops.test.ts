// Feedback-loop scenarios: S2 blocker escalation, S4 QA retry exhaustion.
// Each test walks the sim fixture, asserts the extracted action tags match
// expectations, and runs the pure state-machine through the same transitions
// to verify the authority rules and retry/hop caps behave correctly.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { process as brainProcess } from '../../src/brain/brain.js';
import { getSimProgress, getSimWarnings, loadFixture, resetSim } from '../../src/brain/sim-mode.js';
import { type AgentContext, transition, agentContext, type TaskState } from '../../src/brain/state-machine.js';
import { s2StripeBlocker } from '../fixtures/s2-stripe-blocker.js';
import { s4QaRetryLimit } from '../fixtures/s4-qa-retry-limit.js';

const orchestrator: AgentContext = { agent: 'Anton', isOrchestrator: true };
const human: AgentContext = { agent: 'Noel', isHuman: true };

describe('Scenario S2 — Stripe blocker escalation', () => {
  beforeEach(() => {
    process.env.ANTON_SIM_MODE = '1';
    loadFixture(s2StripeBlocker);
  });
  afterEach(() => {
    resetSim();
    delete process.env.ANTON_SIM_MODE;
  });

  it('extracts BLOCK action from James with no target + reason content', async () => {
    // Walk steps 1-4
    await brainProcess('Start a Stripe integration ticket', { agent: 'Anton' });
    await brainProcess('draft Stripe payment ticket for Sprint 9', { agent: 'Sarah' });
    await brainProcess('review Stripe integration scope', { agent: 'Marcus' });
    const r4 = await brainProcess('implement PAYMENT-01', { agent: 'James' });

    const blockActions = r4.actions.filter((a) => a.type === 'BLOCK');
    expect(blockActions).toHaveLength(1);
    expect(blockActions[0].target).toBeUndefined();
    expect(blockActions[0].content.toLowerCase()).toContain('stripe_secret_key');
  });

  it('full chain produces expected action-tag sequence', async () => {
    const actionTypes: string[] = [];
    const transcript = [
      { agent: 'Anton', input: 'Start a Stripe integration ticket' },
      { agent: 'Sarah', input: 'draft Stripe payment ticket for Sprint 9' },
      { agent: 'Marcus', input: 'review Stripe integration scope' },
      { agent: 'James', input: 'implement PAYMENT-01' },
      { agent: 'Anton', input: 'James is blocked — escalate to Noel' },
      { agent: 'Anton', input: 'credentials provided in .env' },
      { agent: 'James', input: 'resume PAYMENT-01' },
    ];

    for (const step of transcript) {
      const r = await brainProcess(step.input, { agent: step.agent });
      for (const a of r.actions) actionTypes.push(a.type);
    }

    // Expected: HANDOFF (Anton→Sarah) · HANDOFF (Sarah→Marcus) · APPROVE + HANDOFF (Marcus)
    //         · BLOCK (James) · HANDOFF (Anton→James resume) · DONE (James)
    expect(actionTypes).toContain('HANDOFF');
    expect(actionTypes).toContain('APPROVE');
    expect(actionTypes).toContain('BLOCK');
    expect(actionTypes).toContain('DONE');

    expect(getSimWarnings()).toHaveLength(0);
    expect(getSimProgress().done).toBe(transcript.length);
  });

  it('state machine: in-progress → blocked → in-progress via UNBLOCK', () => {
    // A dev in-progress hitting BLOCK
    const r1 = transition('in-progress', 'BLOCK', agentContext('James'));
    expect(r1.newState).toBe('blocked');

    // Orchestrator cannot UNBLOCK
    const r2 = transition('blocked', 'UNBLOCK', orchestrator);
    expect(r2.ok).toBe(false);

    // Noel UNBLOCKs
    const r3 = transition('blocked', 'UNBLOCK', human);
    expect(r3.ok).toBe(true);
    expect(r3.newState).toBe('in-progress');

    // James finishes
    const r4 = transition('in-progress', 'DONE', agentContext('James'));
    expect(r4.newState).toBe('needs-review');
  });
});

describe('Scenario S4 — QA retry exhaustion', () => {
  beforeEach(() => {
    process.env.ANTON_SIM_MODE = '1';
    loadFixture(s4QaRetryLimit);
  });
  afterEach(() => {
    resetSim();
    delete process.env.ANTON_SIM_MODE;
  });

  it('extracts all 3 REJECT tags from Priya with distinct reasons', async () => {
    await brainProcess('ship feature profile avatar', { agent: 'Anton' });
    await brainProcess('build the profile avatar', { agent: 'James' });
    const rejectR1 = await brainProcess('avatar upload done', { agent: 'Priya' });
    await brainProcess('5MB size limit added', { agent: 'James' });
    const rejectR2 = await brainProcess('size limit added', { agent: 'Priya' });
    await brainProcess('CDN URL signed with expiry', { agent: 'James' });
    const rejectR3 = await brainProcess('signed CDN URLs', { agent: 'Priya' });

    const r1 = rejectR1.actions.find((a) => a.type === 'REJECT');
    const r2 = rejectR2.actions.find((a) => a.type === 'REJECT');
    const r3 = rejectR3.actions.find((a) => a.type === 'REJECT');

    expect(r1).toBeDefined();
    expect(r2).toBeDefined();
    expect(r3).toBeDefined();
    expect(r1!.content.toLowerCase()).toContain('5mb');
    expect(r2!.content.toLowerCase()).toContain('cdn');
    expect(r3!.content.toLowerCase()).toContain('race condition');
  });

  it('full chain completes with 8 steps, 0 warnings', async () => {
    const transcript = [
      { agent: 'Anton', input: 'ship feature profile avatar' },
      { agent: 'James', input: 'build the profile avatar feature' },
      { agent: 'Priya', input: 'avatar upload is broken' },
      { agent: 'James', input: 'fix the 5MB issue' },
      { agent: 'Priya', input: 'size limit added but now' },
      { agent: 'James', input: 'fix CDN URL signing' },
      { agent: 'Priya', input: 'signed CDN URLs cached' },
      { agent: 'Anton', input: 'QA hit retry cap — escalate' },
    ];

    for (const step of transcript) {
      await brainProcess(step.input, { agent: step.agent });
    }

    expect(getSimProgress().done).toBe(8);
    expect(getSimWarnings()).toHaveLength(0);
  });

  it('state machine: 3 consecutive REJECTs auto-escalate on the 3rd', () => {
    // Simulate the retry chain
    let state: TaskState = 'in-review';
    let retryCount = 0;

    // REJECT #1: in-review → needs-fix, retry = 1
    const r1 = transition(state, 'REJECT', agentContext('Priya'), { retryCount, maxRetry: 3 });
    expect(r1.newState).toBe('needs-fix');
    expect(r1.shouldEscalate).toBeFalsy();
    state = r1.newState!;
    if (r1.shouldIncrementRetry) retryCount++;

    // James fix → needs-retest, QA picks up → in-review
    state = transition(state, 'DONE', agentContext('James')).newState!;
    state = transition(state, 'REVIEW_START', agentContext('Priya')).newState!;

    // REJECT #2: in-review → needs-fix, retry = 2
    const r2 = transition(state, 'REJECT', agentContext('Priya'), { retryCount, maxRetry: 3 });
    expect(r2.newState).toBe('needs-fix');
    expect(r2.shouldEscalate).toBeFalsy();
    state = r2.newState!;
    if (r2.shouldIncrementRetry) retryCount++;

    // Fix cycle again
    state = transition(state, 'DONE', agentContext('James')).newState!;
    state = transition(state, 'REVIEW_START', agentContext('Priya')).newState!;

    // REJECT #3: cap is 3, retry+1 === 3 → should escalate
    const r3 = transition(state, 'REJECT', agentContext('Priya'), { retryCount, maxRetry: 3 });
    expect(r3.newState).toBe('escalated');
    expect(r3.shouldEscalate).toBe(true);
    expect(retryCount).toBe(2); // will be 3 after increment
  });

  it('state machine: hop cap auto-escalates regardless of transition', () => {
    const r = transition('in-progress', 'DONE', agentContext('James'), {
      hopCount: 20,
      maxHop: 20,
    });
    expect(r.newState).toBe('escalated');
    expect(r.shouldEscalate).toBe(true);
  });
});
