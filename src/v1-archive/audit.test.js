import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  closeAudit,
  getActionsByAgent,
  getActionsByTier,
  getRecentActions,
  getStats,
  initAudit,
  logAction,
  updateOutcome,
  verifyChain,
} from './audit.js';

describe('audit', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'anton-audit-'));
    initAudit(tempDir);
  });

  afterEach(() => {
    closeAudit();
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('logAction', () => {
    it('creates an audit entry and returns a log ID', () => {
      const logId = logAction({
        agent: 'Anton',
        actionType: 'pm2:restart',
        tier: 1,
        context: { process: 'api' },
        status: 'auto',
        reasoning: 'Service crashed',
      });
      expect(logId).toBeTruthy();
      expect(typeof logId).toBe('string');
    });

    it('stores all fields correctly', () => {
      const logId = logAction({
        agent: 'Marcus',
        actionType: 'git:pr:merge',
        tier: 2,
        context: { pr: 42 },
        status: 'approved',
        approvedBy: 'Anton',
        reasoning: 'All checks green',
      });

      const actions = getRecentActions(1);
      expect(actions).toHaveLength(1);
      expect(actions[0].agent).toBe('Marcus');
      expect(actions[0].action_type).toBe('git:pr:merge');
      expect(actions[0].tier).toBe(2);
      expect(actions[0].approval_status).toBe('approved');
      expect(actions[0].approved_by).toBe('Anton');
      expect(actions[0].outcome).toBe('pending');
    });
  });

  describe('updateOutcome', () => {
    it('updates the outcome of an action', () => {
      const logId = logAction({
        agent: 'Anton',
        actionType: 'pm2:restart',
        tier: 1,
        status: 'auto',
      });
      updateOutcome(logId, 'success', 'Restarted in 1.2s');

      const actions = getRecentActions(1);
      expect(actions[0].outcome).toBe('success');
      expect(actions[0].outcome_detail).toBe('Restarted in 1.2s');
    });

    it('truncates long outcome details', () => {
      const logId = logAction({
        agent: 'Anton',
        actionType: 'tests:run',
        tier: 1,
        status: 'auto',
      });
      updateOutcome(logId, 'failed', 'x'.repeat(5000));

      const actions = getRecentActions(1);
      expect(actions[0].outcome_detail.length).toBeLessThanOrEqual(2000);
    });
  });

  describe('verifyChain', () => {
    it('validates an empty chain', () => {
      const result = verifyChain();
      expect(result.valid).toBe(true);
      expect(result.total).toBe(0);
    });

    it('validates a valid chain', () => {
      logAction({ agent: 'A', actionType: 'a', tier: 1, status: 'auto' });
      logAction({ agent: 'B', actionType: 'b', tier: 2, status: 'approved' });
      logAction({ agent: 'C', actionType: 'c', tier: 3, status: 'pending' });

      const result = verifyChain();
      expect(result.valid).toBe(true);
      expect(result.total).toBe(3);
      expect(result.failures).toHaveLength(0);
    });

    it('first entry links to GENESIS', () => {
      logAction({ agent: 'A', actionType: 'a', tier: 1, status: 'auto' });
      const actions = getRecentActions(1);
      expect(actions[0].prev_hash).toBe('GENESIS');
    });

    it('each entry links to the previous', () => {
      logAction({ agent: 'A', actionType: 'a', tier: 1, status: 'auto' });
      logAction({ agent: 'B', actionType: 'b', tier: 1, status: 'auto' });

      const actions = getRecentActions(10);
      // actions[0] is the newest (B), actions[1] is older (A)
      expect(actions[0].prev_hash).toBe(actions[1].row_hash);
    });
  });

  describe('queries', () => {
    beforeEach(() => {
      logAction({ agent: 'Anton', actionType: 'pm2:restart', tier: 1, status: 'auto' });
      logAction({ agent: 'Marcus', actionType: 'git:pr:merge', tier: 2, status: 'approved' });
      logAction({ agent: 'Anton', actionType: 'slack:dm:send', tier: 1, status: 'auto' });
      logAction({ agent: 'Noel', actionType: 'deploy:production', tier: 3, status: 'approved' });
    });

    it('getRecentActions returns latest first', () => {
      const actions = getRecentActions(2);
      expect(actions).toHaveLength(2);
      expect(actions[0].action_type).toBe('deploy:production');
      expect(actions[1].action_type).toBe('slack:dm:send');
    });

    it('getActionsByAgent filters correctly', () => {
      const actions = getActionsByAgent('Anton');
      expect(actions).toHaveLength(2);
      expect(actions.every((a) => a.agent === 'Anton')).toBe(true);
    });

    it('getActionsByTier filters correctly', () => {
      const tier1 = getActionsByTier(1);
      expect(tier1).toHaveLength(2);
      const tier3 = getActionsByTier(3);
      expect(tier3).toHaveLength(1);
    });
  });

  describe('getStats', () => {
    it('returns aggregate stats', () => {
      logAction({ agent: 'Anton', actionType: 'a', tier: 1, status: 'auto' });
      logAction({ agent: 'Anton', actionType: 'b', tier: 1, status: 'auto' });
      logAction({ agent: 'Marcus', actionType: 'c', tier: 2, status: 'approved' });

      const stats = getStats();
      expect(stats.total).toBe(3);
      expect(stats.byTier).toHaveLength(2);
      expect(stats.byAgent).toHaveLength(2);
    });
  });
});
