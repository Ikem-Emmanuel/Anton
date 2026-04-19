import { beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetProposal, resetProposals, runSkillShareScan } from './skill-sharing.js';

describe('runSkillShareScan', () => {
  beforeEach(() => resetProposals());

  it('proposes a P3 notification for each eligible skill', () => {
    const notifyNoel = vi.fn();
    const findShareableSkills = vi.fn().mockReturnValue([
      {
        id: 17,
        owner_agent: 'James',
        title: 'Error-handling in API endpoints',
        context_pattern: 'api error handling',
        success_count: 9,
        failure_count: 1,
      },
    ]);

    const result = runSkillShareScan({ findShareableSkills, notifyNoel });

    expect(result.proposed).toBe(1);
    expect(notifyNoel).toHaveBeenCalledOnce();
    const [severity, msg] = notifyNoel.mock.calls[0];
    expect(severity).toBe('P3');
    expect(msg).toContain('James');
    expect(msg).toContain('90%'); // 9/(9+1) = 90%
    expect(msg).toContain('share skill 17');
  });

  it('does not re-propose skills already surfaced this process', () => {
    const notifyNoel = vi.fn();
    const findShareableSkills = vi
      .fn()
      .mockReturnValue([{ id: 17, owner_agent: 'James', title: 'X', success_count: 9, failure_count: 1 }]);

    runSkillShareScan({ findShareableSkills, notifyNoel });
    runSkillShareScan({ findShareableSkills, notifyNoel });

    expect(notifyNoel).toHaveBeenCalledOnce();
  });

  it('respects maxPerRun to avoid a notification flood', () => {
    const notifyNoel = vi.fn();
    const findShareableSkills = vi.fn().mockReturnValue(
      Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        owner_agent: 'James',
        title: `skill ${i + 1}`,
        success_count: 9,
        failure_count: 1,
      }))
    );

    const result = runSkillShareScan({ findShareableSkills, notifyNoel }, { maxPerRun: 3 });

    expect(result.proposed).toBe(3);
    expect(result.skipped).toBe(7);
    expect(notifyNoel).toHaveBeenCalledTimes(3);
  });

  it('forgetProposal allows a skill to re-surface', () => {
    const notifyNoel = vi.fn();
    const findShareableSkills = vi
      .fn()
      .mockReturnValue([{ id: 17, owner_agent: 'James', title: 'X', success_count: 9, failure_count: 1 }]);

    runSkillShareScan({ findShareableSkills, notifyNoel });
    forgetProposal(17);
    runSkillShareScan({ findShareableSkills, notifyNoel });

    expect(notifyNoel).toHaveBeenCalledTimes(2);
  });

  it('swallows findShareableSkills errors gracefully', () => {
    const notifyNoel = vi.fn();
    const findShareableSkills = vi.fn().mockImplementation(() => {
      throw new Error('db closed');
    });
    const result = runSkillShareScan({ findShareableSkills, notifyNoel });
    expect(result.proposed).toBe(0);
    expect(result.error).toBe('db closed');
    expect(notifyNoel).not.toHaveBeenCalled();
  });

  it('handles zero candidates silently', () => {
    const notifyNoel = vi.fn();
    const findShareableSkills = vi.fn().mockReturnValue([]);
    const result = runSkillShareScan({ findShareableSkills, notifyNoel });
    expect(result.proposed).toBe(0);
    expect(notifyNoel).not.toHaveBeenCalled();
  });
});
