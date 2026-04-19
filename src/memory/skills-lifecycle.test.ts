// Tests for Phase 3.5 §4.5.4 supersedes chain + §4.5.6 cross-agent sharing.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  closeSqliteMemory,
  findShareableSkills,
  findSkillsByPattern,
  getSkillLineage,
  initSqliteMemory,
  markSkillUsed,
  retrieveApplicableSkills,
  shareSkill,
  storeSkill,
} from './sqlite.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'anton-skills-lc-'));
  initSqliteMemory(tmpDir);
});

afterEach(() => {
  closeSqliteMemory();
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('Skill refinement via supersedes chain (§4.5.4)', () => {
  it('findSkillsByPattern returns matching non-deprecated skills for owner', () => {
    storeSkill({
      title: 'Auth flow v1',
      context_pattern: 'designing user authentication flow',
      approach: { steps: ['a'] },
      owner_agent: 'Marcus',
    });
    const hits = findSkillsByPattern('designing authentication flow', 'Marcus');
    expect(hits.length).toBeGreaterThan(0);
  });

  it('findSkillsByPattern scopes to owner', () => {
    storeSkill({
      title: 'Owned by James',
      context_pattern: 'backend api pattern',
      approach: { steps: ['a'] },
      owner_agent: 'James',
    });
    expect(findSkillsByPattern('backend api pattern', 'Marcus')).toHaveLength(0);
    expect(findSkillsByPattern('backend api pattern', 'James')).toHaveLength(1);
  });

  it('storeSkill with supersedes_id creates lineage', () => {
    const v1 = storeSkill({
      title: 'v1',
      context_pattern: 'shared context pattern xyzzy',
      approach: { steps: ['old'] },
      owner_agent: 'Marcus',
    });
    const v2 = storeSkill({
      title: 'v2',
      context_pattern: 'shared context pattern xyzzy',
      approach: { steps: ['new'] },
      owner_agent: 'Marcus',
      supersedes_id: v1,
    });
    const v3 = storeSkill({
      title: 'v3',
      context_pattern: 'shared context pattern xyzzy',
      approach: { steps: ['newer'] },
      owner_agent: 'Marcus',
      supersedes_id: v2,
    });

    const lineage = getSkillLineage(v1);
    expect(lineage.map((s) => s.id)).toEqual([v1, v2, v3]);
  });

  it('higher-success skill wins in retrieval even with supersedes chain', () => {
    const v1 = storeSkill({
      title: 'Original',
      context_pattern: 'sprint planning cadence',
      approach: { steps: ['old'] },
      owner_agent: 'Sarah',
    });
    const v2 = storeSkill({
      title: 'Refined',
      context_pattern: 'sprint planning cadence',
      approach: { steps: ['new'] },
      owner_agent: 'Sarah',
      supersedes_id: v1,
    });

    // Give v2 better track record
    markSkillUsed(v1, 'failure');
    markSkillUsed(v1, 'failure');
    markSkillUsed(v2, 'success');
    markSkillUsed(v2, 'success');
    markSkillUsed(v2, 'success');

    const hits = retrieveApplicableSkills('sprint planning cadence', 'Sarah', 2);
    expect(hits[0].title).toBe('Refined');
  });
});

describe('Cross-agent sharing (§4.5.6)', () => {
  it('findShareableSkills returns skills above threshold', () => {
    const strong = storeSkill({
      title: 'Strong',
      context_pattern: 'strong pattern sample',
      approach: { steps: ['a'] },
      owner_agent: 'Marcus',
    });
    const weak = storeSkill({
      title: 'Weak',
      context_pattern: 'weak pattern sample',
      approach: { steps: ['a'] },
      owner_agent: 'Marcus',
    });

    // Strong: 6 uses, 5 successes (83%)
    for (let i = 0; i < 5; i++) markSkillUsed(strong, 'success');
    markSkillUsed(strong, 'failure');

    // Weak: 6 uses, 4 successes (67%) — below 80% threshold
    for (let i = 0; i < 4; i++) markSkillUsed(weak, 'success');
    markSkillUsed(weak, 'failure');
    markSkillUsed(weak, 'failure');

    const shareable = findShareableSkills();
    expect(shareable.map((s) => s.id)).toContain(strong);
    expect(shareable.map((s) => s.id)).not.toContain(weak);
  });

  it('findShareableSkills excludes already-shared skills', () => {
    const id = storeSkill({
      title: 'Already shared',
      context_pattern: 'pattern here',
      approach: { steps: ['a'] },
      owner_agent: 'Marcus',
    });
    for (let i = 0; i < 6; i++) markSkillUsed(id, 'success');
    expect(findShareableSkills().length).toBe(1);
    shareSkill(id, ['architecture']);
    expect(findShareableSkills().length).toBe(0);
  });

  it('shareSkill flips the shared flag and attaches tags', () => {
    const id = storeSkill({
      title: 'Candidate',
      context_pattern: 'pattern',
      approach: { steps: ['a'] },
      owner_agent: 'Marcus',
    });
    shareSkill(id, ['architecture', 'design']);

    // Now Elena (different agent) should see it
    const elenaHits = retrieveApplicableSkills('pattern', 'Elena', 3);
    expect(elenaHits.length).toBe(1);
    expect(elenaHits[0].id).toBe(id);
    expect(JSON.parse(elenaHits[0].tags)).toEqual(['architecture', 'design']);
  });

  it('findShareableSkills requires minimum 5 evidence count', () => {
    const id = storeSkill({
      title: 'Too few uses',
      context_pattern: 'pattern',
      approach: { steps: ['a'] },
      owner_agent: 'Marcus',
    });
    // 100% success but only 3 uses
    for (let i = 0; i < 3; i++) markSkillUsed(id, 'success');
    expect(findShareableSkills()).toHaveLength(0);
  });
});
