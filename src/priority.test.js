import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventBus } from './eventbus.js';
import { emitEvent, getRules, getSeverity, initPriority, shutdownPriority } from './priority.js';

describe('priority', () => {
  let notifications;
  let mockNotify;

  beforeEach(() => {
    eventBus.removeAllListeners();
    eventBus.clearHistory();
    notifications = [];
    mockNotify = vi.fn(async (severity, message, opts) => {
      notifications.push({ severity, message, ...opts });
    });
    initPriority({ notifyNoel: mockNotify });
  });

  afterEach(() => {
    shutdownPriority();
  });

  describe('P0 events', () => {
    it('service:crash sends P0', async () => {
      emitEvent('service:crash', { name: 'api', restarts: 3 });
      await vi.waitFor(() => expect(mockNotify).toHaveBeenCalled());
      expect(notifications[0].severity).toBe('P0');
      expect(notifications[0].message).toContain('api');
      expect(notifications[0].message).toContain('crashed');
    });

    it('ci:main:failure sends P0', async () => {
      emitEvent('ci:main:failure', { check: 'tests', message: 'lint failed' });
      await vi.waitFor(() => expect(mockNotify).toHaveBeenCalled());
      expect(notifications[0].severity).toBe('P0');
      expect(notifications[0].message).toContain('CI failed');
    });
  });

  describe('P1 events', () => {
    it('health:cpu:critical sends P1', async () => {
      emitEvent('health:cpu:critical', { percent: 95 });
      await vi.waitFor(() => expect(mockNotify).toHaveBeenCalled());
      expect(notifications[0].severity).toBe('P1');
      expect(notifications[0].message).toContain('95%');
    });

    it('agent:stuck sends P1', async () => {
      emitEvent('agent:stuck', { name: 'James', reason: 'no response for 5min' });
      await vi.waitFor(() => expect(mockNotify).toHaveBeenCalled());
      expect(notifications[0].severity).toBe('P1');
      expect(notifications[0].message).toContain('James');
    });

    it('pr:review:needed sends P1', async () => {
      emitEvent('pr:review:needed', { number: 42, title: 'Add auth endpoint' });
      await vi.waitFor(() => expect(mockNotify).toHaveBeenCalled());
      expect(notifications[0].severity).toBe('P1');
      expect(notifications[0].message).toContain('#42');
    });
  });

  describe('P2 events', () => {
    it('task:assigned sends P2', async () => {
      emitEvent('task:assigned', { title: 'Build login page', id: 'FE-42' });
      await vi.waitFor(() => expect(mockNotify).toHaveBeenCalled());
      expect(notifications[0].severity).toBe('P2');
    });

    it('agent:error sends P2', async () => {
      emitEvent('agent:error', { name: 'Elena', message: 'Session timeout' });
      await vi.waitFor(() => expect(mockNotify).toHaveBeenCalled());
      expect(notifications[0].severity).toBe('P2');
      expect(notifications[0].message).toContain('Elena');
    });
  });

  describe('P3 events', () => {
    it('task:completed sends P3', async () => {
      emitEvent('task:completed', { title: 'Auth endpoint', agent: 'James' });
      await vi.waitFor(() => expect(mockNotify).toHaveBeenCalled());
      expect(notifications[0].severity).toBe('P3');
      expect(notifications[0].message).toContain('James');
    });

    it('deploy:success sends P3', async () => {
      emitEvent('deploy:success', { env: 'staging' });
      await vi.waitFor(() => expect(mockNotify).toHaveBeenCalled());
      expect(notifications[0].severity).toBe('P3');
    });
  });

  describe('cooldown keys', () => {
    it('includes event name and identifier in cooldown key', async () => {
      emitEvent('service:crash', { name: 'api' });
      await vi.waitFor(() => expect(mockNotify).toHaveBeenCalled());
      expect(notifications[0].cooldownKey).toContain('service:crash');
      expect(notifications[0].cooldownKey).toContain('api');
    });
  });

  describe('getSeverity', () => {
    it('returns severity for known events', () => {
      expect(getSeverity('service:crash')).toBe('P0');
      expect(getSeverity('health:cpu:critical')).toBe('P1');
      expect(getSeverity('task:assigned')).toBe('P2');
      expect(getSeverity('task:completed')).toBe('P3');
    });

    it('returns null for unknown events', () => {
      expect(getSeverity('unknown:event')).toBeNull();
    });
  });

  describe('getRules', () => {
    it('returns all rules', () => {
      const rules = getRules();
      expect(rules.length).toBeGreaterThan(15);
      expect(rules[0]).toHaveProperty('event');
      expect(rules[0]).toHaveProperty('severity');
    });
  });

  describe('unknown events', () => {
    it('does not notify for unregistered events', async () => {
      emitEvent('random:unknown', { data: true });
      await new Promise((r) => setTimeout(r, 100));
      expect(mockNotify).not.toHaveBeenCalled();
    });
  });

  describe('shutdown', () => {
    it('stops listening after shutdown', async () => {
      shutdownPriority();
      emitEvent('service:crash', { name: 'test' });
      await new Promise((r) => setTimeout(r, 100));
      expect(mockNotify).not.toHaveBeenCalled();
    });
  });
});
