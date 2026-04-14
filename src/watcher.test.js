import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
  let notifications;
  let mockNotify;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'anton-watcher-'));
    mkdirSync(join(tempDir, 'logs'), { recursive: true });
    notifications = [];
    mockNotify = async (severity, message, opts) => {
      notifications.push({ severity, message, ...opts });
    };
  });

  afterEach(() => {
    shutdownWatcher();
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('system health', () => {
    it('starts without errors and creates a health snapshot', async () => {
      initWatcher({ notifyNoel: mockNotify, dataDir: tempDir });
      // Wait for the initial check to complete
      await new Promise((r) => setTimeout(r, 200));
      const snap = getHealthSnapshot();
      expect(snap).not.toBeNull();
      expect(snap.cpu).toBe(45);
      expect(snap.memUsed).toBe(50);
      expect(snap.diskUsed).toBe(55);
      expect(snap.batteryPercent).toBe(72);
    });

    it('does not alert when below thresholds', async () => {
      initWatcher({ notifyNoel: mockNotify, dataDir: tempDir });
      await new Promise((r) => setTimeout(r, 200));
      expect(notifications).toHaveLength(0);
    });

    it('alerts when CPU exceeds threshold', async () => {
      const si = await import('systeminformation');
      si.default.currentLoad.mockResolvedValueOnce({ currentLoad: 92 });

      initWatcher({ notifyNoel: mockNotify, dataDir: tempDir });
      await new Promise((r) => setTimeout(r, 200));

      const cpuAlert = notifications.find((n) => n.message.includes('CPU'));
      expect(cpuAlert).toBeDefined();
      expect(cpuAlert.severity).toBe('P1');
      expect(cpuAlert.message).toContain('92%');
    });

    it('alerts when memory exceeds threshold', async () => {
      const si = await import('systeminformation');
      si.default.mem.mockResolvedValueOnce({
        total: 16 * 1024 * 1024 * 1024,
        used: 14.5 * 1024 * 1024 * 1024,
      });

      initWatcher({ notifyNoel: mockNotify, dataDir: tempDir });
      await new Promise((r) => setTimeout(r, 200));

      const memAlert = notifications.find((n) => n.message.includes('Memory'));
      expect(memAlert).toBeDefined();
      expect(memAlert.severity).toBe('P1');
    });

    it('alerts when disk exceeds threshold', async () => {
      const si = await import('systeminformation');
      si.default.fsSize.mockResolvedValueOnce([{ use: 88, size: 500 * 1024 * 1024 * 1024 }]);

      initWatcher({ notifyNoel: mockNotify, dataDir: tempDir });
      await new Promise((r) => setTimeout(r, 200));

      const diskAlert = notifications.find((n) => n.message.includes('Disk'));
      expect(diskAlert).toBeDefined();
      expect(diskAlert.severity).toBe('P2');
    });

    it('alerts on low battery not charging', async () => {
      const si = await import('systeminformation');
      si.default.battery.mockResolvedValueOnce({ hasBattery: true, percent: 8, isCharging: false });

      initWatcher({ notifyNoel: mockNotify, dataDir: tempDir });
      await new Promise((r) => setTimeout(r, 200));

      const batteryAlert = notifications.find((n) => n.message.includes('Battery'));
      expect(batteryAlert).toBeDefined();
      expect(batteryAlert.severity).toBe('P1');
      expect(batteryAlert.message).toContain('8%');
    });

    it('respects custom thresholds', async () => {
      const si = await import('systeminformation');
      si.default.currentLoad.mockResolvedValueOnce({ currentLoad: 60 });

      initWatcher({
        notifyNoel: mockNotify,
        dataDir: tempDir,
        thresholds: { cpuPercent: 50 },
      });
      await new Promise((r) => setTimeout(r, 200));

      const cpuAlert = notifications.find((n) => n.message.includes('CPU'));
      expect(cpuAlert).toBeDefined();
      expect(cpuAlert.message).toContain('60%');
    });
  });

  describe('getHealthSnapshot', () => {
    it('returns a snapshot object or null', () => {
      const snap = getHealthSnapshot();
      // May be null (first test) or populated (module state from prior test)
      if (snap !== null) {
        expect(snap).toHaveProperty('cpu');
      }
    });

    it('returns snapshot with all fields after check', async () => {
      initWatcher({ notifyNoel: mockNotify, dataDir: tempDir });
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
      if (!result) return; // skip if not in a git repo
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
      initWatcher({ notifyNoel: mockNotify, dataDir: tempDir });
      shutdownWatcher();
      // No error thrown
    });

    it('can shutdown without init', () => {
      shutdownWatcher();
      // No error thrown
    });
  });
});
