// Tests for action tag extraction — covers all 6 tag types, targets, content, edge cases.

import { describe, expect, it } from 'vitest';
import { extractAgentActions, groupActions, stripActionTags } from './agent-actions.js';

describe('Agent action tag extraction', () => {
  it('parses a single HANDOFF', () => {
    const actions = extractAgentActions('[HANDOFF:James] build the api');
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('HANDOFF');
    expect(actions[0].target).toBe('James');
    expect(actions[0].content).toContain('build the api');
  });

  it('parses a single ASK with target + question', () => {
    const actions = extractAgentActions('[ASK:Sarah] what is the token expiration policy?');
    expect(actions[0].type).toBe('ASK');
    expect(actions[0].target).toBe('Sarah');
    expect(actions[0].content).toContain('token expiration');
  });

  it('parses BLOCK without target', () => {
    const actions = extractAgentActions('[BLOCK: need AWS credentials to proceed]');
    expect(actions[0].type).toBe('BLOCK');
    expect(actions[0].target).toBeUndefined();
    expect(actions[0].content).toContain('AWS credentials');
  });

  it('parses APPROVE with task id target', () => {
    const actions = extractAgentActions('[APPROVE:TASK-001] architecture is sound');
    expect(actions[0].type).toBe('APPROVE');
    expect(actions[0].target).toBe('TASK-001');
    expect(actions[0].content).toContain('sound');
  });

  it('parses REJECT with reason', () => {
    const actions = extractAgentActions('[REJECT:TASK-002 direct DB access violates layering]');
    expect(actions[0].type).toBe('REJECT');
    expect(actions[0].target).toBe('TASK-002');
    expect(actions[0].content).toContain('layering');
  });

  it('parses DONE with summary', () => {
    const actions = extractAgentActions('[DONE: backend endpoints committed, tests passing]');
    expect(actions[0].type).toBe('DONE');
    expect(actions[0].target).toBeUndefined();
    expect(actions[0].content).toContain('backend');
  });

  it('parses multiple tags in one response', () => {
    const text = '[HANDOFF:James] backend work. [HANDOFF:Elena] frontend work. [ASK:Sarah] priority order?';
    const actions = extractAgentActions(text);
    expect(actions).toHaveLength(3);
    expect(actions.map((a) => a.type)).toEqual(['HANDOFF', 'HANDOFF', 'ASK']);
    expect(actions.map((a) => a.target)).toEqual(['James', 'Elena', 'Sarah']);
  });

  it('mixes HANDOFF and DONE + BLOCK in one response', () => {
    const text =
      '[DONE: phase 1 complete] Running phase 2. [BLOCK: awaiting approval from Marcus] [HANDOFF:Marcus] please review';
    const actions = extractAgentActions(text);
    expect(actions.map((a) => a.type)).toEqual(['DONE', 'BLOCK', 'HANDOFF']);
  });

  it('ignores unknown tag names', () => {
    const actions = extractAgentActions('[INVALID:foo] some text [HANDOFF:James] real handoff');
    expect(actions).toHaveLength(1);
    expect(actions[0].target).toBe('James');
  });

  it('handles text with no tags', () => {
    expect(extractAgentActions('just a normal message with nothing special')).toEqual([]);
  });

  it('strips all tags from displayable text', () => {
    const text = '[DONE: summary here] Result details. [HANDOFF:James] extra context.';
    expect(stripActionTags(text)).toContain('Result details');
    expect(stripActionTags(text)).not.toContain('[');
    expect(stripActionTags(text)).not.toContain('DONE');
    expect(stripActionTags(text)).not.toContain('HANDOFF');
  });

  it('groupActions partitions by type', () => {
    const actions = extractAgentActions(
      '[HANDOFF:A] x [HANDOFF:B] y [ASK:C] q [BLOCK: r] [APPROVE:T1] [REJECT:T2] [DONE: d]'
    );
    const grouped = groupActions(actions);
    expect(grouped.handoffs).toHaveLength(2);
    expect(grouped.asks).toHaveLength(1);
    expect(grouped.blocks).toHaveLength(1);
    expect(grouped.approvals).toHaveLength(1);
    expect(grouped.rejects).toHaveLength(1);
    expect(grouped.dones).toHaveLength(1);
  });
});
