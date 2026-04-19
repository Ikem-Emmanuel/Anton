// Tests for the task state machine — covers legal transitions, authority
// enforcement, retry cap, hop cap, and block/escalate/unblock paths.

import { describe, expect, it } from 'vitest';
import { type AgentContext, agentContext, transition } from './state-machine.js';

const orchestrator: AgentContext = { agent: 'Anton', isOrchestrator: true };
const human: AgentContext = { agent: 'Noel', isHuman: true };
const techLead: AgentContext = agentContext('Marcus');
const qa: AgentContext = agentContext('Priya');
const dev: AgentContext = agentContext('James');

describe('Task state machine', () => {
  describe('ASSIGN', () => {
    it('orchestrator can ASSIGN planned → in-progress', () => {
      const r = transition('planned', 'ASSIGN', orchestrator);
      expect(r.ok).toBe(true);
      expect(r.newState).toBe('in-progress');
    });

    it('non-orchestrator cannot ASSIGN', () => {
      const r = transition('planned', 'ASSIGN', dev);
      expect(r.ok).toBe(false);
      expect(r.error).toContain('orchestrator');
    });

    it('cannot ASSIGN from in-progress', () => {
      const r = transition('in-progress', 'ASSIGN', orchestrator);
      expect(r.ok).toBe(false);
    });
  });

  describe('APPROVE', () => {
    it('tech lead APPROVES pending-approval → in-progress', () => {
      const r = transition('pending-approval', 'APPROVE', techLead);
      expect(r.ok).toBe(true);
      expect(r.newState).toBe('in-progress');
    });

    it('QA APPROVES in-review → verified', () => {
      const r = transition('in-review', 'APPROVE', qa);
      expect(r.ok).toBe(true);
      expect(r.newState).toBe('verified');
    });

    it('dev cannot APPROVE design', () => {
      const r = transition('pending-approval', 'APPROVE', dev);
      expect(r.ok).toBe(false);
      expect(r.error).toContain('tech lead');
    });

    it('dev cannot APPROVE QA review', () => {
      const r = transition('in-review', 'APPROVE', dev);
      expect(r.ok).toBe(false);
      expect(r.error).toContain('QA');
    });
  });

  describe('REJECT', () => {
    it('QA REJECTS in-review → needs-fix with retry increment', () => {
      const r = transition('in-review', 'REJECT', qa, { retryCount: 0 });
      expect(r.ok).toBe(true);
      expect(r.newState).toBe('needs-fix');
      expect(r.shouldIncrementRetry).toBe(true);
    });

    it('QA REJECT at max retry escalates instead of needs-fix', () => {
      const r = transition('in-review', 'REJECT', qa, { retryCount: 2, maxRetry: 3 });
      expect(r.ok).toBe(true);
      expect(r.newState).toBe('escalated');
      expect(r.shouldEscalate).toBe(true);
    });

    it('tech lead REJECTS pending-approval → needs-clarification', () => {
      const r = transition('pending-approval', 'REJECT', techLead);
      expect(r.ok).toBe(true);
      expect(r.newState).toBe('needs-clarification');
    });
  });

  describe('ASK / ANSWER', () => {
    it('agent can ASK from in-progress → needs-clarification', () => {
      const r = transition('in-progress', 'ASK', dev);
      expect(r.ok).toBe(true);
      expect(r.newState).toBe('needs-clarification');
    });

    it('ANSWER resumes needs-clarification → in-progress', () => {
      const r = transition('needs-clarification', 'ANSWER', orchestrator);
      expect(r.ok).toBe(true);
      expect(r.newState).toBe('in-progress');
    });

    it('cannot ANSWER from other states', () => {
      const r = transition('in-progress', 'ANSWER', orchestrator);
      expect(r.ok).toBe(false);
    });
  });

  describe('DONE / REVIEW_START', () => {
    it('DONE from in-progress → needs-review', () => {
      const r = transition('in-progress', 'DONE', dev);
      expect(r.ok).toBe(true);
      expect(r.newState).toBe('needs-review');
    });

    it('DONE from needs-fix → needs-retest', () => {
      const r = transition('needs-fix', 'DONE', dev);
      expect(r.ok).toBe(true);
      expect(r.newState).toBe('needs-retest');
    });

    it('QA REVIEW_START picks up needs-review → in-review', () => {
      const r = transition('needs-review', 'REVIEW_START', qa);
      expect(r.ok).toBe(true);
      expect(r.newState).toBe('in-review');
    });

    it('QA REVIEW_START picks up needs-retest → in-review', () => {
      const r = transition('needs-retest', 'REVIEW_START', qa);
      expect(r.ok).toBe(true);
      expect(r.newState).toBe('in-review');
    });
  });

  describe('BLOCK / UNBLOCK', () => {
    it('any agent can BLOCK from any active state', () => {
      expect(transition('in-progress', 'BLOCK', dev).newState).toBe('blocked');
      expect(transition('needs-review', 'BLOCK', qa).newState).toBe('blocked');
      expect(transition('pending-approval', 'BLOCK', techLead).newState).toBe('blocked');
    });

    it('cannot BLOCK from terminal states', () => {
      expect(transition('done', 'BLOCK', dev).ok).toBe(false);
      expect(transition('escalated', 'BLOCK', dev).ok).toBe(false);
    });

    it('only human can UNBLOCK', () => {
      expect(transition('blocked', 'UNBLOCK', orchestrator).ok).toBe(false);
      expect(transition('blocked', 'UNBLOCK', human).ok).toBe(true);
      expect(transition('blocked', 'UNBLOCK', human).newState).toBe('in-progress');
    });
  });

  describe('COMPLETE', () => {
    it('orchestrator COMPLETE verified → done', () => {
      const r = transition('verified', 'COMPLETE', orchestrator);
      expect(r.ok).toBe(true);
      expect(r.newState).toBe('done');
    });

    it('cannot COMPLETE from non-verified', () => {
      expect(transition('in-review', 'COMPLETE', orchestrator).ok).toBe(false);
    });
  });

  describe('Hop counter', () => {
    it('auto-escalates when hopCount hits cap', () => {
      const r = transition('in-progress', 'DONE', dev, { hopCount: 20, maxHop: 20 });
      expect(r.newState).toBe('escalated');
      expect(r.shouldEscalate).toBe(true);
    });

    it('does not auto-escalate terminal states', () => {
      const r = transition('done', 'BLOCK', dev, { hopCount: 100 });
      // BLOCK still fails because 'done' is terminal; hop cap doesn't force anything
      expect(r.ok).toBe(false);
    });
  });

  describe('agentContext helper', () => {
    it('classifies Marcus as tech lead', () => {
      expect(agentContext('Marcus').isTechLead).toBe(true);
    });
    it('classifies Priya as QA', () => {
      expect(agentContext('Priya').isQA).toBe(true);
    });
    it('classifies Anton as orchestrator', () => {
      expect(agentContext('Anton').isOrchestrator).toBe(true);
    });
    it('classifies James as neither', () => {
      const ctx = agentContext('James');
      expect(ctx.isTechLead).toBe(false);
      expect(ctx.isQA).toBe(false);
      expect(ctx.isOrchestrator).toBe(false);
    });
  });
});
