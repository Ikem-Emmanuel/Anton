// Integration test — runs scenario S1 (Ship user login) through the brain
// in simulation mode. Asserts the full delegation chain completes, handoffs
// fire correctly, and no sim warnings were raised.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { process as brainProcess } from '../../src/brain/brain.js';
import { getSimProgress, getSimWarnings, loadFixture, resetSim } from '../../src/brain/sim-mode.js';
import { s1ShipLogin } from '../fixtures/s1-ship-login.js';

describe('Scenario S1 — Ship user login (full feedback cycle)', () => {
  beforeEach(() => {
    process.env.ANTON_SIM_MODE = '1';
    loadFixture(s1ShipLogin);
  });

  afterEach(() => {
    resetSim();
    delete process.env.ANTON_SIM_MODE;
  });

  it('step 1: Anton delegates to Sarah on sprint kickoff', async () => {
    const r = await brainProcess('Ship user login this sprint');
    expect(r.handledLocally).toBe(true);
    expect(r.handoffs).toHaveLength(1);
    expect(r.handoffs[0].agent).toBe('Sarah');
    expect(r.text).toContain('Sarah');
  });

  it('step 2: Sarah drafts stories and delegates to Marcus', async () => {
    await brainProcess('Ship user login');
    const r2 = await brainProcess('Kick off Sprint 9', { agent: 'Sarah' });
    expect(r2.handoffs[0].agent).toBe('Marcus');
  });

  it('full chain runs all 12 steps without warnings', async () => {
    // Step 1: Noel → Anton
    const r1 = await brainProcess('Ship user login', { agent: 'Anton' });
    // Step 2: Anton handoff → Sarah
    const r2 = await brainProcess(r1.handoffs[0].message, { agent: 'Sarah' });
    // Step 3: Sarah handoff → Marcus
    const r3 = await brainProcess(r2.handoffs[0].message, { agent: 'Marcus' });
    // Step 4: Marcus handoffs → James (we follow James; Elena ran in parallel per fixture)
    const r4 = await brainProcess(r3.handoffs[0].message, { agent: 'James' });
    // Step 5: James ASK → Sarah
    const r5 = await brainProcess(r4.handoffs[0].message, { agent: 'Sarah' });
    // Step 6: James resumes + DONE → Priya
    const r6 = await brainProcess(r5.text, { agent: 'James' });
    // Step 7: Elena frontend DONE → Priya (parallel track)
    const r7 = await brainProcess('Build login form with MFA input', { agent: 'Elena' });
    // Step 8: Priya REJECT → James
    const r8 = await brainProcess(r6.handoffs[0].message, { agent: 'Priya' });
    // Step 9: James fix + DONE → Priya
    const r9 = await brainProcess(r8.handoffs[0].message, { agent: 'James' });
    // Step 10: Priya APPROVE → Omar
    const r10 = await brainProcess(r9.handoffs[0].message, { agent: 'Priya' });
    // Step 11: Omar deploys → DONE
    const r11 = await brainProcess(r10.handoffs[0].message, { agent: 'Omar' });
    // Step 12: Anton → Noel final status
    const r12 = await brainProcess('What is the status of login?', { agent: 'Anton' });

    // Assertions on the full chain
    expect(r1.handoffs[0].agent).toBe('Sarah');
    expect(r2.handoffs[0].agent).toBe('Marcus');
    expect(r3.handoffs[0].agent).toBe('James');
    expect(r4.handoffs[0].agent).toBe('Sarah');
    expect(r5.handoffs).toHaveLength(0);
    expect(r6.handoffs[0].agent).toBe('Priya');
    expect(r7.handoffs[0].agent).toBe('Priya');
    expect(r8.text).toContain('[REJECT');
    expect(r8.handoffs[0].agent).toBe('James');
    expect(r9.text).toContain('[DONE');
    expect(r10.text).toContain('[APPROVE');
    expect(r10.handoffs[0].agent).toBe('Omar');
    expect(r11.text).toContain('[DONE');
    expect(r12.handoffs).toHaveLength(0);

    // Sim harness correctness
    const progress = getSimProgress();
    expect(progress.done).toBe(12);
    expect(progress.total).toBe(12);
    expect(progress.scenario).toContain('S1');

    const warnings = getSimWarnings();
    if (warnings.length > 0) {
      console.error('Sim warnings:', warnings);
    }
    expect(warnings).toHaveLength(0);
  });

  it('full chain produces all expected state-transition tags in order', async () => {
    const transcript: string[] = [];
    const capture = (r: { text: string; handoffs: Array<{ agent: string }> }) => {
      const tag = r.text.match(/\[(DONE|REJECT|APPROVE|BLOCK|ASK):/)?.[1] ?? null;
      if (tag) transcript.push(tag);
      return r;
    };

    const r1 = capture(await brainProcess('Ship user login', { agent: 'Anton' }));
    const r2 = capture(await brainProcess(r1.handoffs[0].message, { agent: 'Sarah' }));
    const r3 = capture(await brainProcess(r2.handoffs[0].message, { agent: 'Marcus' }));
    const r4 = capture(await brainProcess(r3.handoffs[0].message, { agent: 'James' }));
    const r5 = capture(await brainProcess(r4.handoffs[0].message, { agent: 'Sarah' }));
    const r6 = capture(await brainProcess(r5.text, { agent: 'James' }));
    const r7 = capture(await brainProcess('Build login form with MFA input', { agent: 'Elena' }));
    const r8 = capture(await brainProcess(r6.handoffs[0].message, { agent: 'Priya' }));
    const r9 = capture(await brainProcess(r8.handoffs[0].message, { agent: 'James' }));
    const r10 = capture(await brainProcess(r9.handoffs[0].message, { agent: 'Priya' }));
    const r11 = capture(await brainProcess(r10.handoffs[0].message, { agent: 'Omar' }));

    // Expected sequence: DONE (James) → DONE (Elena) → REJECT (Priya) → DONE (James fix) → APPROVE (Priya) → DONE (Omar)
    expect(transcript).toEqual(['DONE', 'DONE', 'REJECT', 'DONE', 'APPROVE', 'DONE']);
  });
});
