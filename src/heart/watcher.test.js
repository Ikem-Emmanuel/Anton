import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventBus } from '../nervous/eventbus.js';
import { checkGitState, getHealthSnapshot, initWatcher, shutdownWatcher } from './watcher.js';

// Mock systeminformation
vi.mock('systeminformation', () => ({
  default: {
    currentLoad: vi.fn().mockResolvedValue({ currentLoad: 45 }),
    mem: vi.fn().mockResolvedValue({ total: 16 * 1024 * 1024 * 1024, used: 8 * 1024 * 1024 * 1024 }),
    fsSize: vi.fn().mockResolvedValue([{ use: 55, size: 500 * 1024 * 1024 * 1024 }]),
    battery: vi.fn().mockResolvedValue({ hasBattery: true, percent: 72, isCharging: true }),
  },
}));

describe('watcher', () => {
  let tempDir;
  let emittedEvents;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'anton-watcher-'));
    mkdirSync(join(tempDir, 'logs'), { recursive: true });
    emittedEvents = [];
    // Capture all events emitted to the bus
    eventBus.removeAllListeners();
    const origEmit = eventBus.emit.bind(eventBus);
    vi.spyOn(eventBus, 'emit').mockImplementation((event, data) => {
      emittedEvents.push({ event, data });
      return origEmit(event, data);
    });
  });

  afterEach(() => {
    shutdownWatcher();
    vi.restoreAllMocks();
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('system health', () => {
    it('starts without errors and creates a health snapshot', async () => {
      initWatcher({ dataDir: tempDir });
      await new Promise((r) => setTimeout(r, 200));
      const snap = getHealthSnapshot();
      expect(snap).not.toBeNull();
      expect(snap.cpu).toBe(45);
      expect(snap.memUsed).toBe(50);
      expect(snap.diskUsed).toBe(55);
      expect(snap.batteryPercent).toBe(72);
    });

    it('does not emit events when below thresholds', async () => {
      initWatcher({ dataDir: tempDir });
      await new Promise((r) => setTimeout(r, 200));
      const healthEvents = emittedEvents.filter((e) => e.event.startsWith('health:'));
      expect(healthEvents).toHaveLength(0);
    });

    it('emits health:cpu:critical when CPU exceeds threshold', async () => {
      const si = await import('systeminformation');
      si.default.currentLoad.mockResolvedValueOnce({ currentLoad: 92 });

      initWatcher({ dataDir: tempDir });
      await new Promise((r) => setTimeout(r, 200));

      const cpuEvent = emittedEvents.find((e) => e.event === 'health:cpu:critical');
      expect(cpuEvent).toBeDefined();
      expect(cpuEvent.data.percent).toBe(92);
    });

    it('emits health:mem:critical when memory exceeds threshold', async () => {
      const si = await import('systeminformation');
      si.default.mem.mockResolvedValueOnce({
        total: 16 * 1024 * 1024 * 1024,
        used: 14.5 * 1024 * 1024 * 1024,
      });

      initWatcher({ dataDir: tempDir });
      await new Promise((r) => setTimeout(r, 200));

      const memEvent = emittedEvents.find((e) => e.event === 'health:mem:critical');
      expect(memEvent).toBeDefined();
    });

    it('emits health:disk:high when disk exceeds threshold', async () => {
      const si = await import('systeminformation');
      si.default.fsSize.mockResolvedValueOnce([{ use: 88, size: 500 * 1024 * 1024 * 1024 }]);

      initWatcher({ dataDir: tempDir });
      await new Promise((r) => setTimeout(r, 200));

      const diskEvent = emittedEvents.find((e) => e.event === 'health:disk:high');
      expect(diskEvent).toBeDefined();
      expect(diskEvent.data.percent).toBe(88);
    });

    it('emits health:battery:low when battery is low and not charging', async () => {
      const si = await import('systeminformation');
      si.default.battery.mockResolvedValueOnce({ hasBattery: true, percent: 8, isCharging: false });

      initWatcher({ dataDir: tempDir });
      await new Promise((r) => setTimeout(r, 200));

      const battEvent = emittedEvents.find((e) => e.event === 'health:battery:low');
      expect(battEvent).toBeDefined();
      expect(battEvent.data.percent).toBe(8);
    });

    it('respects custom thresholds', async () => {
      const si = await import('systeminformation');
      si.default.currentLoad.mockResolvedValueOnce({ currentLoad: 60 });

      initWatcher({ dataDir: tempDir, thresholds: { cpuPercent: 50 } });
      await new Promise((r) => setTimeout(r, 200));

      const cpuEvent = emittedEvents.find((e) => e.event === 'health:cpu:critical');
      expect(cpuEvent).toBeDefined();
    });
  });

  describe('getHealthSnapshot', () => {
    it('returns a snapshot object or null', () => {
      const snap = getHealthSnapshot();
      if (snap !== null) {
        expect(snap).toHaveProperty('cpu');
      }
    });

    it('returns snapshot with all fields after check', async () => {
      initWatcher({ dataDir: tempDir });
      await new Promise((r) => setTimeout(r, 200));

      const snap = getHealthSnapshot();
      expect(snap).toHaveProperty('cpu');
      expect(snap).toHaveProperty('memUsed');
      expect(snap).toHaveProperty('memTotal');
      expect(snap).toHaveProperty('diskUsed');
      expect(snap).toHaveProperty('diskTotal');
      expect(snap).toHaveProperty('batteryPercent');
      expect(snap).toHaveProperty('batteryCharging');
      expect(snap).toHaveProperty('timestamp');
    });
  });

  describe('checkGitState', () => {
    it('returns branch and status for the current repo', async () => {
      const result = await checkGitState(process.cwd());
      if (!result) return;
      expect(result).toHaveProperty('branch');
      expect(result).toHaveProperty('uncommitted');
      expect(typeof result.branch).toBe('string');
      expect(typeof result.uncommitted).toBe('number');
    });

    it('returns null for non-git directory', async () => {
      const result = await checkGitState(tmpdir());
      expect(result).toBeNull();
    });
  });

  describe('shutdown', () => {
    it('stops cleanly without errors', () => {
      initWatcher({ dataDir: tempDir });
      shutdownWatcher();
    });

    it('can shutdown without init', () => {
      shutdownWatcher();
    });
  });
});
