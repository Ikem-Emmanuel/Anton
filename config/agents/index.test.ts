import { describe, expect, it } from 'vitest';
import {
  AGENTS_BY_ID,
  AGENTS_BY_NAME,
  ALL_AGENTS,
  DEPT_LEADS,
  findByName,
  getDeptLead,
  getDeptMembers,
} from './index.js';

describe('agents loader', () => {
  it('loads exactly 28 agents (27 team + Anton)', () => {
    expect(ALL_AGENTS).toHaveLength(28);
  });

  it('every department from personas.json has a lead', () => {
    for (const dept of ['eng', 'mktg', 'seo', 'auto', 'data', 'growth', 'coord']) {
      const leadId = DEPT_LEADS[dept];
      expect(AGENTS_BY_ID[leadId], `lead for ${dept}`).toBeDefined();
      expect(AGENTS_BY_ID[leadId].canPlan, `${dept} lead must be planner-capable`).toBe(true);
    }
  });

  it('AGENTS_BY_ID and AGENTS_BY_NAME stay in sync', () => {
    for (const a of ALL_AGENTS) {
      expect(AGENTS_BY_ID[a.id]).toBe(a);
      expect(AGENTS_BY_NAME[a.name]).toBe(a);
    }
  });

  it('findByName is case-insensitive', () => {
    expect(findByName('james')?.title).toBe('Backend Dev');
    expect(findByName('JAMES')?.title).toBe('Backend Dev');
    expect(findByName('notreal')).toBeNull();
  });

  it('getDeptMembers("all") excludes Anton', () => {
    const all = getDeptMembers('all');
    expect(all.some((a) => a.id === 'anton')).toBe(false);
    expect(all).toHaveLength(27);
  });

  it('getDeptLead returns the planner-capable lead', () => {
    expect(getDeptLead('eng').name).toBe('Marcus');
    expect(getDeptLead('coord').name).toBe('Riley');
    // Unknown dept defaults to Marcus.
    expect(getDeptLead('xyz').name).toBe('Marcus');
  });

  it('every agent has all required persona text (no silent empty fields)', () => {
    for (const a of ALL_AGENTS) {
      expect(a.personality.length, `${a.name} personality`).toBeGreaterThan(20);
      expect(a.expertise.length, `${a.name} expertise`).toBeGreaterThan(10);
      expect(a.voice.length, `${a.name} voice`).toBeGreaterThan(10);
    }
  });

  it('Anton is the only agent with agentId:null', () => {
    const nullIds = ALL_AGENTS.filter((a) => a.agentId === null);
    expect(nullIds).toHaveLength(1);
    expect(nullIds[0].name).toBe('Anton');
  });
});
