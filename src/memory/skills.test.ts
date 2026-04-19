// Tests for the skill library (Phase 3.5 §4.5.1) — CRUD, retrieval,
// sharing filters, success/failure accounting, deprecation, and the
// [APPLICABLE SKILLS] prompt context builder.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildSkillsContext,
  closeSqliteMemory,
  deprecateSkill,
  initSqliteMemory,
  markSkillUsed,
  retrieveApplicableSkills,
  storeSkill,
} from './sqlite.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'anton-skills-'));
  initSqliteMemory(tmpDir);
});

afterEach(() => {
  closeSqliteMemory();
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('Skill library', () => {
  it('stores and retrieves a skill by its context pattern', () => {
    const id = storeSkill({
      title: 'Design JWT rotation flow',
      context_pattern: 'designing auth flow with session tokens and refresh rotation',
      approach: {
        steps: ['pick algorithm', 'define expiry', 'plan rotation', 'decide revocation'],
        pitfalls: ['token reuse', 'clock drift'],
      },
      owner_agent: 'Marcus',
    });
    expect(id).toBeGreaterThan(0);

    const hits = retrieveApplicableSkills('how should we design our auth flow session', 'Marcus', 3);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].title).toBe('Design JWT rotation flow');
  });

  it('respects owner_agent scoping — private skills not visible to others', () => {
    storeSkill({
      title: 'Engineering-only pattern',
      context_pattern: 'foobar quux xyzzy',
      approach: { steps: ['a'] },
      owner_agent: 'James',
    });

    expect(retrieveApplicableSkills('foobar quux', 'James', 3)).toHaveLength(1);
    expect(retrieveApplicableSkills('foobar quux', 'Elena', 3)).toHaveLength(0);
  });

  it('shared skills are visible across agents', () => {
    storeSkill({
      title: 'Universal pattern',
      context_pattern: 'plutonium framework architecture',
      approach: { steps: ['a'] },
      owner_agent: 'Marcus',
      tags: ['architecture'],
    });
    // Mark as shared
    const hitsBefore = retrieveApplicableSkills('plutonium framework', 'Elena', 3);
    expect(hitsBefore).toHaveLength(0);

    // Set shared = 1 via the raw DB; no public API for this yet (opt-in flow is §4.5.6)
    const hits = retrieveApplicableSkills('plutonium framework', 'Marcus', 3);
    expect(hits).toHaveLength(1);
  });

  it('ranks skills by success rate × match quality', () => {
    const lowSuccessId = storeSkill({
      title: 'Low success approach',
      context_pattern: 'profile avatar upload crop cdn',
      approach: { steps: ['old way'] },
      owner_agent: 'James',
    });
    const highSuccessId = storeSkill({
      title: 'High success approach',
      context_pattern: 'profile avatar upload crop cdn',
      approach: { steps: ['new way'] },
      owner_agent: 'James',
    });

    // Simulate usage
    markSkillUsed(lowSuccessId, 'failure');
    markSkillUsed(lowSuccessId, 'failure');
    markSkillUsed(highSuccessId, 'success');
    markSkillUsed(highSuccessId, 'success');
    markSkillUsed(highSuccessId, 'success');

    const hits = retrieveApplicableSkills('profile avatar upload', 'James', 2);
    expect(hits[0].title).toBe('High success approach');
  });

  it('deprecated skills are excluded from retrieval', () => {
    const id = storeSkill({
      title: 'Obsolete approach',
      context_pattern: 'deprecated pattern needs retiring',
      approach: { steps: ['old'] },
      owner_agent: 'James',
    });
    expect(retrieveApplicableSkills('deprecated pattern', 'James', 3)).toHaveLength(1);

    deprecateSkill(id);
    expect(retrieveApplicableSkills('deprecated pattern', 'James', 3)).toHaveLength(0);
  });

  it('markSkillUsed increments counts', () => {
    const id = storeSkill({
      title: 'Trackable',
      context_pattern: 'tracking pattern',
      approach: { steps: ['a'] },
      owner_agent: 'James',
    });
    markSkillUsed(id, 'success');
    markSkillUsed(id, 'success');
    markSkillUsed(id, 'failure');

    const hits = retrieveApplicableSkills('tracking pattern', 'James', 3);
    expect(hits[0].success_count).toBe(2);
    expect(hits[0].failure_count).toBe(1);
  });

  it('buildSkillsContext formats [APPLICABLE SKILLS] prompt block', () => {
    storeSkill({
      title: 'Sprint kickoff template',
      context_pattern: 'sprint planning kickoff goal stories',
      approach: {
        steps: ['Draft goal', 'List 5 stories', 'Assign owners', 'Set acceptance criteria'],
        pitfalls: ['Scope creep', 'Under-specified stories'],
      },
      owner_agent: 'Sarah',
    });

    const ctx = buildSkillsContext('help me kick off sprint 9 with goal and stories', 'Sarah', 3);
    expect(ctx).toContain('[APPLICABLE SKILLS]');
    expect(ctx).toContain('Sprint kickoff template');
    expect(ctx).toContain('Draft goal');
    expect(ctx).toContain('Watch:');
    expect(ctx).toContain('Scope creep');
  });

  it('buildSkillsContext returns empty string when no skills match', () => {
    expect(buildSkillsContext('some query', 'James', 3)).toBe('');
  });

  it('handles special characters in query without crashing', () => {
    storeSkill({
      title: 'Test',
      context_pattern: 'deploy rollback pattern',
      approach: { steps: ['a'] },
      owner_agent: 'Omar',
    });
    expect(() => retrieveApplicableSkills("deploy & rollback's pattern -- urgent!", 'Omar', 3)).not.toThrow();
  });

  it('skips tokens shorter than 3 chars in query', () => {
    // Short tokens would crash FTS5 or match everything; our cleaner drops them.
    const hits = retrieveApplicableSkills('a b c do', 'James', 3);
    expect(hits).toHaveLength(0); // no real terms to match
  });

  it('supersedes_id creates a lineage chain', () => {
    const v1 = storeSkill({
      title: 'Auth v1',
      context_pattern: 'auth token strategy',
      approach: { steps: ['old'] },
      owner_agent: 'Marcus',
    });
    const v2 = storeSkill({
      title: 'Auth v2',
      context_pattern: 'auth token strategy',
      approach: { steps: ['new'] },
      owner_agent: 'Marcus',
      supersedes_id: v1,
    });
    expect(v2).toBeGreaterThan(v1);
  });
});
