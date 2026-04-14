// ─── Task Queue ──────────────────────────────────────────────
// Local task management with dependencies and auto-dispatch.
// Maps to the official Agent Teams task list (~/.claude/tasks/)

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

let tasksFile;
let tasks = [];  // Array of task objects
let nextId = 1;  // Declared here so initTaskQueue can reset it

export function initTaskQueue(antonRoot) {
  // Always reset in-memory state first (ensures test isolation)
  tasks = [];
  nextId = 1;

  const dir = join(antonRoot, 'tasks');
  mkdirSync(dir, { recursive: true });
  tasksFile = join(dir, 'queue.json');

  try {
    if (existsSync(tasksFile)) {
      tasks = JSON.parse(readFileSync(tasksFile, 'utf-8'));
      // Derive next ID from loaded tasks so IDs stay monotonic after restart
      if (tasks.length > 0) {
        const maxId = tasks.reduce((max, t) => {
          const n = parseInt(t.id?.replace('T-', '') || '0', 10);
          return isNaN(n) ? max : Math.max(max, n);
        }, 0);
        nextId = maxId + 1;
      }
    }
  } catch {}
}

function save() {
  try { writeFileSync(tasksFile, JSON.stringify(tasks, null, 2)); } catch {}
}

// ─── Task CRUD ───────────────────────────────────────────────


export function createTask({ title, assignee, priority, points, deps, asanaId, description }) {
  const id = `T-${String(nextId++).padStart(3, '0')}`;
  const task = {
    id,
    title,
    assignee: assignee || null,        // agent name (e.g. "James")
    status: 'backlog',                  // backlog → assigned → in_progress → in_review → qa → done
    priority: priority || 'P2',         // P0, P1, P2, P3
    points: points || 0,
    deps: deps || [],                   // array of task IDs that must complete first
    asanaId: asanaId || null,
    description: description || '',
    prLink: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    comments: [],
  };
  tasks.push(task);
  save();
  return task;
}

export function getTask(id) {
  return tasks.find(t => t.id === id) || null;
}

export function updateTask(id, updates) {
  const task = getTask(id);
  if (!task) return null;
  Object.assign(task, updates, { updatedAt: new Date().toISOString() });
  save();
  return task;
}

export function moveTask(id, newStatus) {
  const task = getTask(id);
  if (!task) return null;

  const validTransitions = {
    'backlog': ['assigned'],
    'assigned': ['in_progress'],
    'in_progress': ['in_review'],
    'in_review': ['qa', 'in_progress'],   // can go back if changes requested
    'qa': ['done', 'in_progress'],        // can go back if QA fails
    'done': [],
  };

  const allowed = validTransitions[task.status] || [];
  if (!allowed.includes(newStatus)) {
    return { error: `Can't move from ${task.status} to ${newStatus}` };
  }

  task.status = newStatus;
  task.updatedAt = new Date().toISOString();
  if (newStatus === 'in_progress' && !task.startedAt) task.startedAt = new Date().toISOString();
  if (newStatus === 'done') task.completedAt = new Date().toISOString();

  save();
  return task;
}

export function addComment(id, author, text) {
  const task = getTask(id);
  if (!task) return null;
  task.comments.push({ author, text, at: new Date().toISOString() });
  task.updatedAt = new Date().toISOString();
  save();
  return task;
}

// ─── Queries ─────────────────────────────────────────────────

export function getTasksForAgent(agentName) {
  return tasks.filter(t => t.assignee === agentName && t.status !== 'done');
}

export function getNextTask(agentName) {
  // Find the highest priority assigned task that is unblocked
  const agentTasks = tasks
    .filter(t => t.assignee === agentName && (t.status === 'assigned' || t.status === 'backlog'))
    .filter(t => areDepsResolved(t))
    .sort((a, b) => priorityOrder(a.priority) - priorityOrder(b.priority));

  return agentTasks[0] || null;
}

export function getBlockedTasks() {
  return tasks.filter(t => t.status !== 'done' && t.deps.length > 0 && !areDepsResolved(t));
}

export function getActiveTasks() {
  return tasks.filter(t => t.status === 'in_progress');
}

export function getAllTasks() {
  return [...tasks];
}

export function getSprintSummary() {
  const byStatus = {};
  const byAgent = {};
  let totalPoints = 0, donePoints = 0;

  for (const t of tasks) {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    if (t.assignee) {
      if (!byAgent[t.assignee]) byAgent[t.assignee] = { total: 0, done: 0, points: 0, donePoints: 0 };
      byAgent[t.assignee].total++;
      byAgent[t.assignee].points += t.points;
      if (t.status === 'done') {
        byAgent[t.assignee].done++;
        byAgent[t.assignee].donePoints += t.points;
      }
    }
    totalPoints += t.points;
    if (t.status === 'done') donePoints += t.points;
  }

  return { total: tasks.length, byStatus, byAgent, totalPoints, donePoints };
}

// ─── Helpers ─────────────────────────────────────────────────

function areDepsResolved(task) {
  return task.deps.every(depId => {
    const dep = getTask(depId);
    return dep && dep.status === 'done';
  });
}

function priorityOrder(p) {
  return { P0: 0, P1: 1, P2: 2, P3: 3 }[p] ?? 4;
}

// ─── Sprint Board Report ─────────────────────────────────────

export function getBoardReport() {
  const summary = getSprintSummary();
  const lines = [];

  lines.push(`:clipboard: *Sprint Board* — ${summary.total} tasks, ${summary.donePoints}/${summary.totalPoints} points`);
  lines.push('');
  lines.push('```');
  lines.push(`Status        Count`);
  lines.push(`───────────── ─────`);
  for (const [status, count] of Object.entries(summary.byStatus)) {
    lines.push(`${status.padEnd(14)}${count}`);
  }
  lines.push('');
  lines.push(`Agent         Tasks  Done  Points`);
  lines.push(`───────────── ────── ───── ──────`);
  for (const [agent, s] of Object.entries(summary.byAgent)) {
    lines.push(`${agent.padEnd(14)}${String(s.total).padEnd(7)}${String(s.done).padEnd(6)}${s.donePoints}/${s.points}`);
  }
  lines.push('```');

  // Active tasks
  const active = getActiveTasks();
  if (active.length > 0) {
    lines.push('');
    lines.push('*In Progress*');
    for (const t of active) {
      const elapsed = t.startedAt ? Math.round((Date.now() - new Date(t.startedAt).getTime()) / 60000) : 0;
      lines.push(`• ${t.id} ${t.title} — ${t.assignee} (${elapsed}min)`);
    }
  }

  // Blocked tasks
  const blocked = getBlockedTasks();
  if (blocked.length > 0) {
    lines.push('');
    lines.push('*Blocked*');
    for (const t of blocked) {
      lines.push(`• ${t.id} ${t.title} — waiting on ${t.deps.join(', ')}`);
    }
  }

  return lines.join('\n');
}
