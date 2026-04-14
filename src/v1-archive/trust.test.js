import { describe, expect, it } from 'vitest';
import { classifyAction, classifyTier, evaluateTier2, getAllActions, getTierLabel, TIER } from './trust.js';

describe('trust', () => {
  describe('classifyTier', () => {
    it('classifies Tier 1 actions', () => {
      expect(classifyTier('pm2:restart')).toBe(TIER.AUTO);
      expect(classifyTier('slack:message:send')).toBe(TIER.AUTO);
      expect(classifyTier('git:pr:create')).toBe(TIER.AUTO);
      expect(classifyTier('tests:run')).toBe(TIER.AUTO);
      expect(classifyTier('asana:task:create')).toBe(TIER.AUTO);
    });

    it('classifies Tier 2 actions', () => {
      expect(classifyTier('git:pr:merge')).toBe(TIER.ANTON_DECIDES);
      expect(classifyTier('deploy:staging')).toBe(TIER.ANTON_DECIDES);
      expect(classifyTier('pm2:scale')).toBe(TIER.ANTON_DECIDES);
    });

    it('classifies Tier 3 actions', () => {
      expect(classifyTier('deploy:production')).toBe(TIER.NOEL_APPROVES);
      expect(classifyTier('database:delete')).toBe(TIER.NOEL_APPROVES);
      expect(classifyTier('git:force-push')).toBe(TIER.NOEL_APPROVES);
      expect(classifyTier('purchase:any')).toBe(TIER.NOEL_APPROVES);
      expect(classifyTier('social:post')).toBe(TIER.NOEL_APPROVES);
    });

    it('defaults unknown actions to Tier 3', () => {
      expect(classifyTier('totally:unknown:action')).toBe(TIER.NOEL_APPROVES);
      expect(classifyTier('')).toBe(TIER.NOEL_APPROVES);
    });
  });

  describe('getTierLabel', () => {
    it('returns correct labels', () => {
      expect(getTierLabel(1)).toBe('AUTO');
      expect(getTierLabel(2)).toBe('ANTON_DECIDES');
      expect(getTierLabel(3)).toBe('NOEL_APPROVES');
      expect(getTierLabel(99)).toBe('UNKNOWN');
    });
  });

  describe('evaluateTier2', () => {
    it('approves PR merge when all criteria met', () => {
      const result = evaluateTier2('git:pr:merge', {
        checksPass: true,
        approvals: 2,
        base: 'develop',
        mergeable: true,
      });
      expect(result.approved).toBe(true);
    });

    it('rejects PR merge to main', () => {
      const result = evaluateTier2('git:pr:merge', {
        checksPass: true,
        approvals: 1,
        base: 'main',
        mergeable: true,
      });
      expect(result.approved).toBe(false);
    });

    it('rejects PR merge with no approvals', () => {
      const result = evaluateTier2('git:pr:merge', {
        checksPass: true,
        approvals: 0,
        base: 'develop',
        mergeable: true,
      });
      expect(result.approved).toBe(false);
    });

    it('approves staging deploy when tests pass', () => {
      const result = evaluateTier2('deploy:staging', { testsPass: true, lintPass: true });
      expect(result.approved).toBe(true);
    });

    it('rejects staging deploy when tests fail', () => {
      const result = evaluateTier2('deploy:staging', { testsPass: false, lintPass: true });
      expect(result.approved).toBe(false);
    });

    it('approves scale within limits', () => {
      const result = evaluateTier2('pm2:scale', { current: 2, requested: 4 });
      expect(result.approved).toBe(true);
    });

    it('rejects scale beyond 2x', () => {
      const result = evaluateTier2('pm2:scale', { current: 2, requested: 10 });
      expect(result.approved).toBe(false);
    });

    it('rejects scale beyond hard cap of 16', () => {
      const result = evaluateTier2('pm2:scale', { current: 10, requested: 20 });
      expect(result.approved).toBe(false);
    });

    it('returns not approved for actions without criteria', () => {
      const result = evaluateTier2('asana:sprint:archive', {});
      expect(result.approved).toBe(false);
      expect(result.reason).toContain('No criteria defined');
    });
  });

  describe('classifyAction', () => {
    it('Tier 1 returns execute: true', () => {
      const result = classifyAction('pm2:restart');
      expect(result.tier).toBe(1);
      expect(result.execute).toBe(true);
    });

    it('Tier 2 with criteria met returns execute: true', () => {
      const result = classifyAction('deploy:staging', { testsPass: true, lintPass: true });
      expect(result.execute).toBe(true);
    });

    it('Tier 2 with criteria not met escalates to Tier 3', () => {
      const result = classifyAction('deploy:staging', { testsPass: false, lintPass: true });
      expect(result.tier).toBe(3);
      expect(result.execute).toBe(false);
      expect(result.reason).toContain('Escalated');
    });

    it('Tier 3 returns execute: false', () => {
      const result = classifyAction('deploy:production');
      expect(result.tier).toBe(3);
      expect(result.execute).toBe(false);
    });
  });

  describe('getAllActions', () => {
    it('returns all three tiers', () => {
      const actions = getAllActions();
      expect(actions.tier1.length).toBeGreaterThan(10);
      expect(actions.tier2.length).toBeGreaterThan(5);
      expect(actions.tier3.length).toBeGreaterThan(10);
    });

    it('has no overlaps between tiers', () => {
      const actions = getAllActions();
      const all = [...actions.tier1, ...actions.tier2, ...actions.tier3];
      const unique = new Set(all);
      expect(unique.size).toBe(all.length);
    });
  });
});
