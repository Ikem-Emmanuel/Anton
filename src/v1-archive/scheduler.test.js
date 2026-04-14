import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { parseTimeStr, formatTime, scheduleJob, cancelJob, listJobs, init } from './scheduler.js';

// Use a fresh tmp directory per test run
const testRoot = join(tmpdir(), `anton-scheduler-test-${process.pid}`);

beforeEach(() => {
  mkdirSync(testRoot, { recursive: true });
  init(testRoot);
  // Cancel all existing jobs so tests are isolated
  for (const job of listJobs()) {
    cancelJob(job.id);
  }
});

afterEach(() => {
  for (const job of listJobs()) {
    cancelJob(job.id);
  }
});

describe('parseTimeStr', () => {
  it('"9am" → {hours:9, minutes:0}', () => {
    expect(parseTimeStr('9am')).toEqual({ hours: 9, minutes: 0 });
  });

  it('"9:30am" → {hours:9, minutes:30}', () => {
    expect(parseTimeStr('9:30am')).toEqual({ hours: 9, minutes: 30 });
  });

  it('"12pm" → {hours:12, minutes:0}', () => {
    expect(parseTimeStr('12pm')).toEqual({ hours: 12, minutes: 0 });
  });

  it('"2:15pm" → {hours:14, minutes:15}', () => {
    expect(parseTimeStr('2:15pm')).toEqual({ hours: 14, minutes: 15 });
  });

  it('"14:30" → {hours:14, minutes:30}', () => {
    expect(parseTimeStr('14:30')).toEqual({ hours: 14, minutes: 30 });
  });

  it('"9" → {hours:9, minutes:0}', () => {
    expect(parseTimeStr('9')).toEqual({ hours: 9, minutes: 0 });
  });

  it('"0" → {hours:0, minutes:0}', () => {
    expect(parseTimeStr('0')).toEqual({ hours: 0, minutes: 0 });
  });

  it('"12am" → {hours:0, minutes:0}', () => {
    expect(parseTimeStr('12am')).toEqual({ hours: 0, minutes: 0 });
  });

  it('"invalid" → null', () => {
    expect(parseTimeStr('invalid')).toBeNull();
  });

  it('"99:99" → null', () => {
    expect(parseTimeStr('99:99')).toBeNull();
  });

  it('empty string → null', () => {
    expect(parseTimeStr('')).toBeNull();
  });
});

describe('formatTime', () => {
  it('formatTime(9, 0) → "9:00 AM"', () => {
    expect(formatTime(9, 0)).toBe('9:00 AM');
  });

  it('formatTime(14, 30) → "2:30 PM"', () => {
    expect(formatTime(14, 30)).toBe('2:30 PM');
  });

  it('formatTime(0, 0) → "12:00 AM"', () => {
    expect(formatTime(0, 0)).toBe('12:00 AM');
  });

  it('formatTime(12, 0) → "12:00 PM"', () => {
    expect(formatTime(12, 0)).toBe('12:00 PM');
  });
});

describe('scheduleJob + listJobs', () => {
  it('schedules a job and it appears in listJobs with correct time', () => {
    scheduleJob('test-job', 9, 30, () => {});
    const jobs = listJobs();
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({ id: 'test-job', time: '9:30 AM' });
  });
});

describe('cancelJob', () => {
  it('cancelling a scheduled job removes it from listJobs', () => {
    scheduleJob('cancel-me', 10, 0, () => {});
    expect(listJobs()).toHaveLength(1);
    cancelJob('cancel-me');
    expect(listJobs()).toHaveLength(0);
  });

  it('cancelling a non-existent job returns false', () => {
    expect(cancelJob('does-not-exist')).toBe(false);
  });
});
