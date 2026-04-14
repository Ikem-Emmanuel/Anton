/**
 * taskqueue.test.js — Tests for the local task queue, state machine, and board report.
 *
 * Uses a real temp directory for persistence. All logic is pure JS — no SDK calls.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  initTaskQueue,
  createTask,
  getTask,
  updateTask,
  moveTask,
  addComment,
  getTasksForAgent,
  getNextTask,
  getBlockedTasks,
  getActiveTasks,
  getAllTasks,
  getSprintSummary,
  getBoardReport,
} from './taskqueue.js';

let testDir;

beforeEach(() => {
  testDir = join(tmpdir(), `anton-tasks-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(testDir, { recursive: true });
  initTaskQueue(testDir);
});

afterEach(() => {
  try { rmSync(testDir, { recursive: true, force: true }); } catch {}
});

// ─────────────────────────────────────────────────────────────
// createTask
// ─────────────────────────────────────────────────────────────
describe('createTask', () => {
  it('returns a task with generated ID', () => {
    const t = createTask({ title: 'Build auth endpoint', assignee: 'James' });
    expect(t.id).toMatch(/^T-\d{3}$/);
    expect(t.title).toBe('Build auth endpoint');
    expect(t.assignee).toBe('James');
  });

  it('starts in backlog status', () => {
    const t = createTask({ title: 'Fix login page' });
    expect(t.status).toBe('backlog');
  });

  it('defaults to P2 priority', () => {
    const t = createTask({ title: 'Add tests' });
    expect(t.priority).toBe('P2');
  });

  it('accepts custom priority and points', () => {
    const t = createTask({ title: 'Critical bug', priority: 'P0', points: 5 });
    expect(t.priority).toBe('P0');
    expect(t.points).toBe(5);
  });

  it('accepts dependencies array', () => {
    const t1 = createTask({ title: 'Task A' });
    const t2 = createTask({ title: 'Task B', deps: [t1.id] });
    expect(t2.deps).toContain(t1.id);
  });

  it('sets createdAt and updatedAt', () => {
    const t = createTask({ title: 'Check timestamps' });
    expect(t.createdAt).toBeTruthy();
    expect(t.updatedAt).toBeTruthy();
  });

  it('increments IDs across multiple tasks', () => {
    const t1 = createTask({ title: 'Task 1' });
    const t2 = createTask({ title: 'Task 2' });
    expect(t1.id).not.toBe(t2.id);
  });
});

// ─────────────────────────────────────────────────────────────
// getTask
// ─────────────────────────────────────────────────────────────
describe('getTask', () => {
  it('returns task by id', () => {
    const created = createTask({ title: 'My task' });
    const found = getTask(created.id);
    expect(found).not.toBeNull();
    expect(found.title).toBe('My task');
  });

  it('returns null for unknown id', () => {
    expect(getTask('T-999')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// updateTask
// ─────────────────────────────────────────────────────────────
describe('updateTask', () => {
  it('updates fields and refreshes updatedAt', async () => {
    const t = createTask({ title: 'Original title' });
    const originalUpdated = t.updatedAt;

    await new Promise(r => setTimeout(r, 5)); // ensure timestamp differs
    const updated = updateTask(t.id, { title: 'New title', priority: 'P1' });

    expect(updated.title).toBe('New title');
    expect(updated.priority).toBe('P1');
    expect(updated.updatedAt).not.toBe(originalUpdated);
  });

  it('returns null for unknown id', () => {
    expect(updateTask('T-999', { title: 'Ghost' })).toBeNull();
  });

  it('can attach Asana ID', () => {
    const t = createTask({ title: 'With Asana link' });
    const updated = updateTask(t.id, { asanaId: '1213281083480354' });
    expect(updated.asanaId).toBe('1213281083480354');
  });
});

// ─────────────────────────────────────────────────────────────
// moveTask — state machine
// ─────────────────────────────────────────────────────────────
describe('moveTask — state machine', () => {
  it('backlog → assigned is valid', () => {
    const t = createTask({ title: 'Assign me' });
    const result = moveTask(t.id, 'assigned');
    expect(result.status).toBe('assigned');
  });

  it('assigned → in_progress is valid', () => {
    const t = createTask({ title: 'Start me' });
    moveTask(t.id, 'assigned');
    const result = moveTask(t.id, 'in_progress');
    expect(result.status).toBe('in_progress');
    expect(result.startedAt).not.toBeNull();
  });

  it('in_progress → in_review is valid', () => {
    const t = createTask({ title: 'PR time' });
    moveTask(t.id, 'assigned');
    moveTask(t.id, 'in_progress');
    const result = moveTask(t.id, 'in_review');
    expect(result.status).toBe('in_review');
  });

  it('in_review → qa is valid', () => {
    const t = createTask({ title: 'QA me' });
    moveTask(t.id, 'assigned');
    moveTask(t.id, 'in_progress');
    moveTask(t.id, 'in_review');
    const result = moveTask(t.id, 'qa');
    expect(result.status).toBe('qa');
  });

  it('qa → done is valid, sets completedAt', () => {
    const t = createTask({ title: 'Ship it' });
    moveTask(t.id, 'assigned');
    moveTask(t.id, 'in_progress');
    moveTask(t.id, 'in_review');
    moveTask(t.id, 'qa');
    const result = moveTask(t.id, 'done');
    expect(result.status).toBe('done');
    expect(result.completedAt).not.toBeNull();
  });

  it('in_review → in_progress (changes requested) is valid', () => {
    const t = createTask({ title: 'Review cycle' });
    moveTask(t.id, 'assigned');
    moveTask(t.id, 'in_progress');
    moveTask(t.id, 'in_review');
    const result = moveTask(t.id, 'in_progress');
    expect(result.status).toBe('in_progress');
  });

  it('qa → in_progress (QA failed) is valid', () => {
    const t = createTask({ title: 'QA fail' });
    moveTask(t.id, 'assigned');
    moveTask(t.id, 'in_progress');
    moveTask(t.id, 'in_review');
    moveTask(t.id, 'qa');
    const result = moveTask(t.id, 'in_progress');
    expect(result.status).toBe('in_progress');
  });

  it('backlog → done is INVALID', () => {
    const t = createTask({ title: 'Skip the queue' });
    const result = moveTask(t.id, 'done');
    expect(result.error).toBeDefined();
    expect(result.error).toContain("Can't move");
  });

  it('done → anything is INVALID', () => {
    const t = createTask({ title: 'Already done' });
    moveTask(t.id, 'assigned');
    moveTask(t.id, 'in_progress');
    moveTask(t.id, 'in_review');
    moveTask(t.id, 'qa');
    moveTask(t.id, 'done');
    const result = moveTask(t.id, 'in_progress');
    expect(result.error).toBeDefined();
  });

  it('returns null for unknown task', () => {
    expect(moveTask('T-999', 'assigned')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// addComment
// ─────────────────────────────────────────────────────────────
describe('addComment', () => {
  it('adds a comment to a task', () => {
    const t = createTask({ title: 'Comment test' });
    addComment(t.id, 'Priya', 'Found a bug in the edge case');

    const found = getTask(t.id);
    expect(found.comments).toHaveLength(1);
    expect(found.comments[0].author).toBe('Priya');
    expect(found.comments[0].text).toBe('Found a bug in the edge case');
  });

  it('accumulates multiple comments', () => {
    const t = createTask({ title: 'Multi-comment' });
    addComment(t.id, 'James', 'First comment');
    addComment(t.id, 'Marcus', 'Second comment');
    expect(getTask(t.id).comments).toHaveLength(2);
  });

  it('returns null for unknown task', () => {
    expect(addComment('T-999', 'James', 'Ghost comment')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────
describe('getTasksForAgent', () => {
  it('returns only tasks for the given agent that are not done', () => {
    createTask({ title: 'James task 1', assignee: 'James' });
    createTask({ title: 'James task 2', assignee: 'James' });
    createTask({ title: 'Elena task', assignee: 'Elena' });

    const jamesTasks = getTasksForAgent('James');
    expect(jamesTasks).toHaveLength(2);
    expect(jamesTasks.every(t => t.assignee === 'James')).toBe(true);
  });

  it('excludes done tasks', () => {
    const t = createTask({ title: 'Done task', assignee: 'Omar' });
    moveTask(t.id, 'assigned');
    moveTask(t.id, 'in_progress');
    moveTask(t.id, 'in_review');
    moveTask(t.id, 'qa');
    moveTask(t.id, 'done');

    expect(getTasksForAgent('Omar')).toHaveLength(0);
  });
});

describe('getNextTask', () => {
  it('returns highest priority unblocked task', () => {
    createTask({ title: 'P2 task', assignee: 'James', priority: 'P2' });
    createTask({ title: 'P0 task', assignee: 'James', priority: 'P0' });

    const next = getNextTask('James');
    expect(next.priority).toBe('P0');
  });

  it('skips tasks with unresolved deps', () => {
    const blocker = createTask({ title: 'Blocker' });
    createTask({ title: 'Blocked task', assignee: 'James', priority: 'P0', deps: [blocker.id] });
    createTask({ title: 'Free task', assignee: 'James', priority: 'P2' });

    const next = getNextTask('James');
    expect(next.title).toBe('Free task'); // blocked P0 is skipped, free P2 is next
  });

  it('returns null when no tasks', () => {
    expect(getNextTask('Kai')).toBeNull();
  });

  it('resolves blocked task when dep is done', () => {
    const dep = createTask({ title: 'Dependency' });
    createTask({ title: 'Was blocked', assignee: 'James', priority: 'P0', deps: [dep.id] });

    // Complete the dependency
    moveTask(dep.id, 'assigned');
    moveTask(dep.id, 'in_progress');
    moveTask(dep.id, 'in_review');
    moveTask(dep.id, 'qa');
    moveTask(dep.id, 'done');

    const next = getNextTask('James');
    expect(next).not.toBeNull();
    expect(next.title).toBe('Was blocked');
  });
});

describe('getBlockedTasks', () => {
  it('returns tasks with unresolved deps', () => {
    const dep = createTask({ title: 'Dep' });
    createTask({ title: 'Blocked', assignee: 'James', deps: [dep.id] });

    const blocked = getBlockedTasks();
    expect(blocked).toHaveLength(1);
    expect(blocked[0].title).toBe('Blocked');
  });

  it('does not include tasks with resolved deps', () => {
    const dep = createTask({ title: 'Dep 2' });
    createTask({ title: 'Unblocked', assignee: 'James', deps: [dep.id] });

    moveTask(dep.id, 'assigned');
    moveTask(dep.id, 'in_progress');
    moveTask(dep.id, 'in_review');
    moveTask(dep.id, 'qa');
    moveTask(dep.id, 'done');

    expect(getBlockedTasks()).toHaveLength(0);
  });
});

describe('getActiveTasks', () => {
  it('returns only in_progress tasks', () => {
    const t1 = createTask({ title: 'Active', assignee: 'James' });
    const t2 = createTask({ title: 'Backlog', assignee: 'Elena' });
    moveTask(t1.id, 'assigned');
    moveTask(t1.id, 'in_progress');

    const active = getActiveTasks();
    expect(active).toHaveLength(1);
    expect(active[0].title).toBe('Active');
  });
});

// ─────────────────────────────────────────────────────────────
// getSprintSummary
// ─────────────────────────────────────────────────────────────
describe('getSprintSummary', () => {
  it('counts tasks by status', () => {
    createTask({ title: 'T1', assignee: 'James' });
    const t2 = createTask({ title: 'T2', assignee: 'Elena' });
    moveTask(t2.id, 'assigned');
    moveTask(t2.id, 'in_progress');

    const summary = getSprintSummary();
    expect(summary.total).toBe(2);
    expect(summary.byStatus['backlog']).toBe(1);
    expect(summary.byStatus['in_progress']).toBe(1);
  });

  it('sums story points correctly', () => {
    const t1 = createTask({ title: 'Big task', assignee: 'James', points: 8 });
    const t2 = createTask({ title: 'Small task', assignee: 'James', points: 3 });

    moveTask(t1.id, 'assigned');
    moveTask(t1.id, 'in_progress');
    moveTask(t1.id, 'in_review');
    moveTask(t1.id, 'qa');
    moveTask(t1.id, 'done');

    const summary = getSprintSummary();
    expect(summary.totalPoints).toBe(11);
    expect(summary.donePoints).toBe(8);
  });
});

// ─────────────────────────────────────────────────────────────
// getBoardReport
// ─────────────────────────────────────────────────────────────
describe('getBoardReport', () => {
  it('returns a string with Sprint Board header', () => {
    const report = getBoardReport();
    expect(typeof report).toBe('string');
    expect(report).toContain('Sprint Board');
  });

  it('shows "0 tasks" on empty board', () => {
    expect(getBoardReport()).toContain('0 tasks');
  });

  it('includes task assignees in the report', () => {
    createTask({ title: 'Auth endpoint', assignee: 'James', points: 3 });
    expect(getBoardReport()).toContain('James');
  });

  it('shows active task in In Progress section', () => {
    const t = createTask({ title: 'Auth endpoint', assignee: 'James', points: 3 });
    moveTask(t.id, 'assigned');
    moveTask(t.id, 'in_progress');

    const report = getBoardReport();
    expect(report).toContain('In Progress');
    expect(report).toContain('Auth endpoint');
  });

  it('shows blocked task in Blocked section', () => {
    const dep = createTask({ title: 'API contract' });
    createTask({ title: 'Mobile notifications', assignee: 'Kai', deps: [dep.id] });

    const report = getBoardReport();
    expect(report).toContain('Blocked');
    expect(report).toContain('Mobile notifications');
  });
});
