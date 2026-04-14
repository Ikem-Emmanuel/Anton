import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initBriefing, runBriefing, setBriefingTime } from './briefing.js';

describe('briefing', () => {
  let tempDir;
  let notifications;
  let scheduleJobs;

  function createDeps(overrides = {}) {
    return {
      scheduleJob: vi.fn((id, h, m, fn) => {
        scheduleJobs.push({ id, h, m, fn });
      }),
      getHealthSnapshot: () => ({
        cpu: 42,
        memUsed: 65,
        memTotal: 16,
        diskUsed: 55,
        diskTotal: 500,
        batteryPercent: 80,
        batteryCharging: true,
        timestamp: new Date().toISOString(),
      }),
      checkGitState: vi.fn().mockResolvedValue({
        branch: 'phase1/briefing',
        uncommitted: 2,
        ahead: 1,
        behind: 0,
      }),
      consumeBriefingBuffer: () => [
        { severity: 'P3', message: 'Deploy completed', timestamp: new Date().toISOString() },
        { severity: 'P3', message: 'New PR opened', timestamp: new Date().toISOString() },
      ],
      notifyNoel: vi.fn(async (sev, msg) => {
        notifications.push({ sev, msg });
      }),
      antonRoot: tempDir,
      dataDir: tempDir,
      ...overrides,
    };
  }

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'anton-briefing-'));
    notifications = [];
    scheduleJobs = [];
  });

  describe('initBriefing', () => {
    it('registers a scheduled job at the configured time', () => {
      initBriefing(createDeps(), { hour: 9, minute: 0 });
      expect(scheduleJobs).toHaveLength(1);
      expect(scheduleJobs[0].id).toBe('morning-briefing');
      expect(scheduleJobs[0].h).toBe(9);
      expect(scheduleJobs[0].m).toBe(0);
    });

    it('defaults to 8:30', () => {
      initBriefing(createDeps());
      expect(scheduleJobs[0].h).toBe(8);
      expect(scheduleJobs[0].m).toBe(30);
    });
  });

  describe('runBriefing', () => {
    it('produces a briefing with all sections', async () => {
      initBriefing(createDeps());
      const text = await runBriefing();

      expect(text).toContain('Morning Briefing');
      expect(text).toContain('System Health');
      expect(text).toContain('CPU 42%');
      expect(text).toContain('MEM 65%');
      expect(text).toContain('Git');
      expect(text).toContain('phase1/briefing');
      expect(text).toContain('2 uncommitted');
      expect(text).toContain('Info (2 item');
      expect(text).toContain('Deploy completed');
    });

    it('sends via notifyNoel P1 with force', async () => {
      const deps = createDeps();
      initBriefing(deps);
      await runBriefing();

      expect(deps.notifyNoel).toHaveBeenCalledOnce();
      const call = deps.notifyNoel.mock.calls[0];
      expect(call[0]).toBe('P1');
      expect(call[2].force).toBe(true);
    });

    it('works without health snapshot', async () => {
      initBriefing(createDeps({ getHealthSnapshot: () => null }));
      const text = await runBriefing();
      expect(text).toContain('Morning Briefing');
      expect(text).not.toContain('System Health');
    });

    it('works without git state', async () => {
      initBriefing(createDeps({ checkGitState: vi.fn().mockResolvedValue(null) }));
      const text = await runBriefing();
      expect(text).not.toContain('Git');
    });

    it('works with empty P3 buffer', async () => {
      initBriefing(createDeps({ consumeBriefingBuffer: () => [] }));
      const text = await runBriefing();
      expect(text).not.toContain('Info');
    });

    it('includes overnight activity if logs exist', async () => {
      const logsDir = join(tempDir, 'logs', 'marcus');
      mkdirSync(logsDir, { recursive: true });
      const today = new Date().toISOString().split('T')[0];
      writeFileSync(join(logsDir, `${today}.jsonl`), '{"type":"message"}\n{"type":"response"}\n');

      initBriefing(createDeps());
      const text = await runBriefing();
      expect(text).toContain('Overnight Activity');
      expect(text).toContain('marcus');
    });

    it('shows health status emojis correctly', async () => {
      initBriefing(
        createDeps({
          getHealthSnapshot: () => ({
            cpu: 92,
            memUsed: 88,
            diskUsed: 40,
            batteryPercent: 10,
            batteryCharging: false,
            memTotal: 16,
            diskTotal: 500,
            timestamp: new Date().toISOString(),
          }),
        })
      );
      const text = await runBriefing();
      // CPU and MEM should be red, disk green, battery red
      expect(text).toContain(':red_circle: CPU 92%');
      expect(text).toContain(':red_circle: MEM 88%');
      expect(text).toContain(':white_check_mark: DISK 40%');
      expect(text).toContain(':red_circle: BAT 10%');
    });
  });

  describe('setBriefingTime', () => {
    it('reschedules the briefing', () => {
      initBriefing(createDeps());
      setBriefingTime(7, 0);
      // Should have called scheduleJob twice (init + reschedule)
      expect(scheduleJobs).toHaveLength(2);
      expect(scheduleJobs[1].h).toBe(7);
      expect(scheduleJobs[1].m).toBe(0);
    });
  });
});
