import { describe, it, expect } from 'vitest';
import { detectCommand } from './orchestrator.js';

describe('detectCommand — start team', () => {
  it('"start engineering team" → {type: "start", dept: "engineering"}', () => {
    expect(detectCommand('start engineering team')).toEqual({ type: 'start', dept: 'engineering' });
  });

  it('"kick off the marketing team" → {type: "start", dept: "marketing"}', () => {
    expect(detectCommand('kick off the marketing team')).toEqual({ type: 'start', dept: 'marketing' });
  });

  it('"start the seo team" → {type: "start", dept: "seo"}', () => {
    expect(detectCommand('start the seo team')).toEqual({ type: 'start', dept: 'seo' });
  });
});

describe('detectCommand — sprint', () => {
  it('"run a sprint" → {type: "sprint"}', () => {
    expect(detectCommand('run a sprint')).toEqual({ type: 'sprint' });
  });

  it('"begin a sprint" → {type: "sprint"}', () => {
    expect(detectCommand('begin a sprint')).toEqual({ type: 'sprint' });
  });
});

describe('detectCommand — status', () => {
  it('"team status" → {type: "status"}', () => {
    expect(detectCommand('team status')).toEqual({ type: 'status' });
  });

  it('"who\'s working" → {type: "status"}', () => {
    expect(detectCommand("who's working")).toEqual({ type: 'status' });
  });

  it('"active agents" → {type: "status"}', () => {
    expect(detectCommand('active agents')).toEqual({ type: 'status' });
  });
});

describe('detectCommand — stop team', () => {
  it('"stop engineering team" → {type: "stop", dept: "engineering"}', () => {
    expect(detectCommand('stop engineering team')).toEqual({ type: 'stop', dept: 'engineering' });
  });

  it('"shut down the marketing team" → {type: "stop", dept: "marketing"}', () => {
    expect(detectCommand('shut down the marketing team')).toEqual({ type: 'stop', dept: 'marketing' });
  });

  it('"stop all teams" → {type: "stop", dept: "all"}', () => {
    expect(detectCommand('stop all teams')).toEqual({ type: 'stop', dept: 'all' });
  });
});

describe('detectCommand — no match', () => {
  it('"hello world" → null', () => {
    expect(detectCommand('hello world')).toBeNull();
  });

  it('"what time is it" → null', () => {
    expect(detectCommand('what time is it')).toBeNull();
  });
});
