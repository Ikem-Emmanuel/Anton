import { describe, expect, it } from 'vitest';
import { findByName, getDeptLead, getDeptMembers, HANDOFF_RULES, TEAM } from './team.js';

describe('TEAM', () => {
  it('has 27 entries (26 agents + riley)', () => {
    expect(Object.keys(TEAM)).toHaveLength(27);
  });
});

describe('findByName', () => {
  it('returns the marcus entry for "Marcus"', () => {
    const result = findByName('Marcus');
    expect(result).toBe(TEAM.marcus);
  });

  it('returns null for unknown name', () => {
    expect(findByName('unknown')).toBeNull();
  });

  it('is case-insensitive — lowercase', () => {
    expect(findByName('marcus')).toBe(TEAM.marcus);
  });

  it('is case-insensitive — uppercase', () => {
    expect(findByName('MARCUS')).toBe(TEAM.marcus);
  });

  it('is case-insensitive — mixed case', () => {
    expect(findByName('Marcus')).toBe(TEAM.marcus);
  });
});

describe('getDeptMembers', () => {
  it('returns 7 members for eng dept', () => {
    const members = getDeptMembers('eng');
    expect(members).toHaveLength(7);
    for (const m of members) {
      expect(m.dept).toBe('eng');
    }
  });

  it('returns 4 members for mktg dept', () => {
    const members = getDeptMembers('mktg');
    expect(members).toHaveLength(4);
  });
});

describe('getDeptLead', () => {
  it('returns TEAM.marcus for eng', () => {
    expect(getDeptLead('eng')).toBe(TEAM.marcus);
  });

  it('returns TEAM.riley for coord', () => {
    expect(getDeptLead('coord')).toBe(TEAM.riley);
  });
});

describe('HANDOFF_RULES', () => {
  it('Marcus can dispatch to James, Elena, Kai, Omar, Priya, Sarah, Riley', () => {
    expect(HANDOFF_RULES.Marcus).toEqual(
      expect.arrayContaining(['James', 'Elena', 'Kai', 'Omar', 'Priya', 'Sarah', 'Riley'])
    );
    expect(HANDOFF_RULES.Marcus).toHaveLength(12);
  });

  it('James can dispatch to full engineering team', () => {
    expect(HANDOFF_RULES.James).toEqual(
      expect.arrayContaining(['Marcus', 'Sarah', 'Elena', 'Kai', 'Priya', 'Omar', 'Riley'])
    );
    expect(HANDOFF_RULES.James).toHaveLength(7);
  });

  it('Marcus cannot dispatch to himself', () => {
    expect(HANDOFF_RULES.Marcus).not.toContain('Marcus');
  });

  it('all HANDOFF_RULES targets exist in TEAM (no typos)', () => {
    for (const [agent, targets] of Object.entries(HANDOFF_RULES)) {
      for (const target of targets) {
        expect(findByName(target), `target "${target}" from ${agent} not found in TEAM`).not.toBeNull();
      }
    }
  });
});

describe('getDeptMembers', () => {
  it('returns all 27 members for dept "all"', () => {
    const all = getDeptMembers('all');
    expect(all.length).toBe(27);
  });

  it('returns only eng members for dept "eng"', () => {
    const eng = getDeptMembers('eng');
    expect(eng.every((m) => m.dept === 'eng')).toBe(true);
    expect(eng.length).toBe(7);
  });

  it('returns only mktg members for dept "mktg"', () => {
    const mktg = getDeptMembers('mktg');
    expect(mktg.every((m) => m.dept === 'mktg')).toBe(true);
    expect(mktg.length).toBe(4);
  });
});

describe('HANDOFF_RULES — cross-dept', () => {
  it('every agent has at least one permitted handoff target', () => {
    for (const [name, targets] of Object.entries(HANDOFF_RULES)) {
      expect(targets.length).toBeGreaterThan(0);
    }
  });

  it('all 27 agents appear in HANDOFF_RULES', () => {
    const allNames = Object.values(TEAM).map((m) => m.name);
    for (const name of allNames) {
      expect(HANDOFF_RULES).toHaveProperty(name);
    }
  });

  it('Riley can reach all 6 dept leads', () => {
    const leads = ['Marcus', 'Sarah', 'Diana', 'Nina', 'Felix', 'Ada', 'Nadia'];
    for (const lead of leads) {
      expect(HANDOFF_RULES.Riley).toContain(lead);
    }
  });

  it('every non-lead agent can reach Riley', () => {
    const nonLeads = Object.values(TEAM).filter((m) => m.name !== 'Riley');
    for (const m of nonLeads) {
      expect(HANDOFF_RULES[m.name]).toContain('Riley');
    }
  });

  it('James can hand off cross-dept to Riley', () => {
    expect(HANDOFF_RULES.James).toContain('Riley');
  });

  it('Diana can hand off cross-dept to Marcus via Riley', () => {
    expect(HANDOFF_RULES.Diana).toContain('Riley');
    expect(HANDOFF_RULES.Diana).toContain('Marcus');
  });

  it('no agent can hand off to itself', () => {
    for (const [name, targets] of Object.entries(HANDOFF_RULES)) {
      expect(targets).not.toContain(name);
    }
  });

  it('all handoff targets are valid team member names', () => {
    const allNames = new Set(Object.values(TEAM).map((m) => m.name));
    for (const [, targets] of Object.entries(HANDOFF_RULES)) {
      for (const t of targets) {
        expect(allNames.has(t)).toBe(true);
      }
    }
  });
});
