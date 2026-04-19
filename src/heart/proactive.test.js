import { describe, expect, it, vi } from 'vitest';
import { initProactive, runEodSummary, runEventScan, runStalledTaskSurfacer } from './proactive.js';

// ─── runEodSummary ───────────────────────────────────────────────

describe('runEodSummary', () => {
  it('sends a P3 notification with the brain response', async () => {
    const notifyNoel = vi.fn();
    const brainProcess = vi.fn().mockResolvedValue({
      text: 'Shipped: auth endpoint, onboarding polish. In flight: dashboard refresh.',
    });

    const result = await runEodSummary({ brainProcess, notifyNoel });

    expect(result.sent).toBe(true);
    expect(brainProcess).toHaveBeenCalledOnce();
    // Must route through Riley, the cross-dept coordinator.
    expect(brainProcess.mock.calls[0][1]).toEqual({ agent: 'Riley' });
    expect(notifyNoel).toHaveBeenCalledOnce();
    const [severity, msg] = notifyNoel.mock.calls[0];
    expect(severity).toBe('P3');
    expect(msg).toContain('EOD');
    expect(msg).toContain('Shipped: auth endpoint');
  });

  it('skips notification when brain returns empty text', async () => {
    const notifyNoel = vi.fn();
    const brainProcess = vi.fn().mockResolvedValue({ text: '' });
    const result = await runEodSummary({ brainProcess, notifyNoel });
    expect(result.sent).toBe(false);
    expect(notifyNoel).not.toHaveBeenCalled();
  });

  it('does not throw when brain rejects — returns an error result', async () => {
    const notifyNoel = vi.fn();
    const brainProcess = vi.fn().mockRejectedValue(new Error('Ollama timeout'));
    const result = await runEodSummary({ brainProcess, notifyNoel });
    expect(result.sent).toBe(false);
    expect(result.reason).toBe('error');
  });
});

// ─── runEventScan ────────────────────────────────────────────────

describe('runEventScan', () => {
  function mkEvent(event, offsetMs = 0) {
    return { event, data: {}, timestamp: new Date(Date.now() - offsetMs).toISOString() };
  }

  it('fires when recent error events exceed threshold', () => {
    const notifyNoel = vi.fn();
    const getEventHistory = vi.fn().mockReturnValue([
      mkEvent('service:error', 1000),
      mkEvent('db:crash', 5000),
      mkEvent('agent:fail', 10_000),
      mkEvent('ok:shipped', 12_000), // not an error
    ]);
    const result = runEventScan({ getEventHistory, notifyNoel }, { errorThreshold: 3 });
    expect(result.fired).toBe(true);
    expect(result.count).toBe(3);
    expect(notifyNoel).toHaveBeenCalledOnce();
    expect(notifyNoel.mock.calls[0][0]).toBe('P2');
  });

  it('does not fire when error count is below threshold', () => {
    const notifyNoel = vi.fn();
    const getEventHistory = vi.fn().mockReturnValue([mkEvent('service:error', 1000), mkEvent('ok:shipped', 5000)]);
    const result = runEventScan({ getEventHistory, notifyNoel }, { errorThreshold: 3 });
    expect(result.fired).toBe(false);
    expect(notifyNoel).not.toHaveBeenCalled();
  });

  it('ignores errors older than the window', () => {
    const notifyNoel = vi.fn();
    const getEventHistory = vi.fn().mockReturnValue([
      mkEvent('service:error', 1000),
      mkEvent('service:error', 2 * 60 * 60 * 1000), // 2 hours ago
      mkEvent('service:error', 3 * 60 * 60 * 1000),
    ]);
    const result = runEventScan({ getEventHistory, notifyNoel }, { windowMs: 60_000, errorThreshold: 2 });
    expect(result.fired).toBe(false);
    expect(result.count).toBe(1);
  });

  it('handles getEventHistory returning undefined gracefully', () => {
    const notifyNoel = vi.fn();
    const getEventHistory = vi.fn().mockReturnValue(undefined);
    const result = runEventScan({ getEventHistory, notifyNoel });
    expect(result.fired).toBe(false);
    expect(notifyNoel).not.toHaveBeenCalled();
  });
});

// ─── runStalledTaskSurfacer ──────────────────────────────────────

describe('runStalledTaskSurfacer', () => {
  it('sends one P2 notification listing all stalled tasks', () => {
    const notifyNoel = vi.fn();
    const findStalledTasks = vi.fn().mockReturnValue([
      { owner: 'James', title: 'Auth middleware', col: 'flight' },
      { owner: 'Elena', title: 'Dashboard refresh', col: 'flight' },
    ]);
    const result = runStalledTaskSurfacer({ findStalledTasks, notifyNoel });
    expect(result.fired).toBe(true);
    expect(result.count).toBe(2);
    expect(notifyNoel).toHaveBeenCalledOnce();
    const [severity, msg] = notifyNoel.mock.calls[0];
    expect(severity).toBe('P2');
    expect(msg).toContain('James');
    expect(msg).toContain('Elena');
    expect(msg).toContain('Auth middleware');
  });

  it('stays quiet when no tasks are stalled', () => {
    const notifyNoel = vi.fn();
    const findStalledTasks = vi.fn().mockReturnValue([]);
    const result = runStalledTaskSurfacer({ findStalledTasks, notifyNoel });
    expect(result.fired).toBe(false);
    expect(notifyNoel).not.toHaveBeenCalled();
  });

  it('passes hoursStale through to the query', () => {
    const notifyNoel = vi.fn();
    const findStalledTasks = vi.fn().mockReturnValue([]);
    runStalledTaskSurfacer({ findStalledTasks, notifyNoel }, { hoursStale: 6 });
    expect(findStalledTasks).toHaveBeenCalledWith(6, 5);
  });
});

// ─── initProactive ───────────────────────────────────────────────

describe('initProactive', () => {
  it('registers EOD at 18:00 and returns a teardown', () => {
    const scheduleJob = vi.fn();
    const cancelJob = vi.fn();
    const teardown = initProactive({
      scheduleJob,
      cancelJob,
      brainProcess: vi.fn(),
      getEventHistory: vi.fn(() => []),
      findStalledTasks: vi.fn(() => []),
      notifyNoel: vi.fn(),
    });

    expect(scheduleJob).toHaveBeenCalledWith('eod-summary', 18, 0, expect.any(Function));
    expect(typeof teardown).toBe('function');
    teardown();
    expect(cancelJob).toHaveBeenCalledWith('eod-summary');
  });
});
