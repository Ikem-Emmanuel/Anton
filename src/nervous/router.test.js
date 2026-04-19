import { describe, expect, it } from 'vitest';
import { TEAM } from '../brain/team.js';
import { channelToDept, isEveryoneRequest, route } from './router.js';

describe('route — direct address at message start', () => {
  it('"James, fix the bug" routes to james', () => {
    expect(route('James, fix the bug', 'anton-engineering')).toBe(TEAM.james);
  });

  it('"Hey Marcus, review this PR" routes to marcus', () => {
    expect(route('Hey Marcus, review this PR', 'anton-engineering')).toBe(TEAM.marcus);
  });

  it('"riley, how\'s the sprint?" routes to riley', () => {
    expect(route("riley, how's the sprint?", 'anton-standup')).toBe(TEAM.riley);
  });
});

describe('route — delegation patterns', () => {
  it('"ask James about the backend" routes to james', () => {
    expect(route('ask James about the backend', 'anton-engineering')).toBe(TEAM.james);
  });

  it('"ping Elena about the UI" routes to elena', () => {
    expect(route('ping Elena about the UI', 'anton-engineering')).toBe(TEAM.elena);
  });
});

describe('route — keyword-based routing', () => {
  it('"fix the backend endpoint" routes to james', () => {
    expect(route('fix the backend endpoint', 'anton-engineering')).toBe(TEAM.james);
  });

  it('"build a UI component" routes to elena', () => {
    expect(route('build a UI component', 'anton-engineering')).toBe(TEAM.elena);
  });

  it('"the iOS build is failing" routes to kai', () => {
    expect(route('the iOS build is failing', 'anton-engineering')).toBe(TEAM.kai);
  });

  it('"deploy to staging" routes to omar', () => {
    expect(route('deploy to staging', 'anton-engineering')).toBe(TEAM.omar);
  });

  it('"sprint planning next" routes to sarah', () => {
    expect(route('sprint planning next', 'anton-engineering')).toBe(TEAM.sarah);
  });
});

describe('isEveryoneRequest', () => {
  it('"everyone introduce yourselves" returns true', () => {
    expect(isEveryoneRequest('everyone introduce yourselves')).toBe(true);
  });

  it('"all team members respond" returns true', () => {
    expect(isEveryoneRequest('all team members respond')).toBe(true);
  });

  it('"hey James" returns false', () => {
    expect(isEveryoneRequest('hey James')).toBe(false);
  });
});

describe('channelToDept', () => {
  it('"anton-standup" maps to "coord"', () => {
    expect(channelToDept('anton-standup')).toBe('coord');
  });

  it('"anton-engineering" maps to "eng"', () => {
    expect(channelToDept('anton-engineering')).toBe('eng');
  });

  it('unknown channel falls back to "eng"', () => {
    expect(channelToDept('unknown')).toBe('eng');
  });
});

describe('route — ambiguity and channel defaults', () => {
  it('"Marcus and James should discuss" returns null (2+ names, ambiguous)', () => {
    expect(route('Marcus and James should discuss', 'anton-engineering')).toBeNull();
  });

  it('standup channel default: unrouted message routes to riley', () => {
    expect(route('random question', 'anton-standup')).toBe(TEAM.riley);
  });
});
