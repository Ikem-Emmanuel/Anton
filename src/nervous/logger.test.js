/**
 * logger.test.js — Tests for the agent activity logger.
 *
 * Uses a real temp directory — logger writes JSONL files to disk.
 * Verifies that every log function writes valid JSONL with correct structure.
 */

import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  getAgentSummary,
  initLogger,
  logAsanaAction,
  logError,
  logHandoff,
  logMessage,
  logResponse,
  logSession,
  logToolUse,
} from './logger.js';

let testDir;
const TODAY = new Date().toISOString().split('T')[0];

function getLogLines(agentName) {
  const file = join(testDir, 'logs', agentName.toLowerCase(), `${TODAY}.jsonl`);
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

beforeEach(() => {
  testDir = join(tmpdir(), `anton-logger-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(testDir, { recursive: true });
  initLogger(testDir);
});

afterEach(() => {
  try {
    rmSync(testDir, { recursive: true, force: true });
  } catch {}
});

// ─────────────────────────────────────────────────────────────
// initLogger
// ─────────────────────────────────────────────────────────────
describe('initLogger', () => {
  it('creates the logs directory', () => {
    expect(existsSync(join(testDir, 'logs'))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// logMessage
// ─────────────────────────────────────────────────────────────
describe('logMessage', () => {
  it('writes a message_received entry', () => {
    logMessage('James', 'Build the auth endpoint', 'dm');
    const lines = getLogLines('James');
    expect(lines).toHaveLength(1);
    expect(lines[0].type).toBe('message_received');
    expect(lines[0].agent).toBe('James');
    expect(lines[0].source).toBe('dm');
    expect(lines[0].message).toBe('Build the auth endpoint');
  });

  it('truncates long messages to 500 chars', () => {
    const longMsg = 'x'.repeat(600);
    logMessage('Elena', longMsg, 'dm');
    const lines = getLogLines('Elena');
    expect(lines[0].message.length).toBe(500);
  });

  it('includes timestamp', () => {
    logMessage('Marcus', 'Hello', 'dm');
    const lines = getLogLines('Marcus');
    expect(lines[0].timestamp).toBeTruthy();
    expect(new Date(lines[0].timestamp)).toBeInstanceOf(Date);
  });

  it('creates per-agent subdirectory', () => {
    logMessage('Priya', 'test', 'dm');
    expect(existsSync(join(testDir, 'logs', 'priya'))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// logResponse
// ─────────────────────────────────────────────────────────────
describe('logResponse', () => {
  it('writes a response entry with correct fields', () => {
    logResponse('James', 'Done, shipped.', 1250, 45);
    const lines = getLogLines('James');
    expect(lines[0].type).toBe('response');
    expect(lines[0].duration_ms).toBe(1250);
    expect(lines[0].tokens_est).toBe(45);
    expect(lines[0].response_length).toBe(14); // "Done, shipped." is 14 chars
    expect(lines[0].response_preview).toBe('Done, shipped.');
  });

  it('handles null response', () => {
    logResponse('Marcus', null, 500, 0);
    const lines = getLogLines('Marcus');
    expect(lines[0].response_length).toBe(0);
    expect(lines[0].response_preview).toBeNull();
  });

  it('truncates long response preview to 300 chars', () => {
    const longResponse = 'r'.repeat(400);
    logResponse('Elena', longResponse, 200, 100);
    const lines = getLogLines('Elena');
    expect(lines[0].response_preview.length).toBe(300);
    expect(lines[0].response_length).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────
// logError
// ─────────────────────────────────────────────────────────────
describe('logError', () => {
  it('writes an error entry', () => {
    const err = new Error('SDK timeout');
    logError('James', err, 'processing auth request');
    const lines = getLogLines('James');
    expect(lines[0].type).toBe('error');
    expect(lines[0].error).toBe('SDK timeout');
    expect(lines[0].context).toBe('processing auth request');
  });

  it('handles string errors', () => {
    logError('Marcus', 'some string error', 'context');
    const lines = getLogLines('Marcus');
    expect(lines[0].error).toBe('some string error');
  });

  it('truncates context to 200 chars', () => {
    logError('Elena', new Error('fail'), 'c'.repeat(300));
    const lines = getLogLines('Elena');
    expect(lines[0].context.length).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────
// logSession
// ─────────────────────────────────────────────────────────────
describe('logSession', () => {
  it('writes session_created entry', () => {
    logSession('James', 'session-abc123', false);
    const lines = getLogLines('James');
    expect(lines[0].type).toBe('session_created');
    expect(lines[0].session_id).toBe('session-abc1');
  });

  it('writes session_resumed entry', () => {
    logSession('James', 'session-xyz999', true);
    const lines = getLogLines('James');
    expect(lines[0].type).toBe('session_resumed');
  });

  it('truncates session ID to 12 chars', () => {
    logSession('Elena', 'session-verylongid123456', false);
    const lines = getLogLines('Elena');
    expect(lines[0].session_id.length).toBe(12);
  });
});

// ─────────────────────────────────────────────────────────────
// logToolUse
// ─────────────────────────────────────────────────────────────
describe('logToolUse', () => {
  it('writes a tool_use entry with tool name and file', () => {
    logToolUse('James', 'Read', '/src/auth.ts');
    const lines = getLogLines('James');
    expect(lines[0].type).toBe('tool_use');
    expect(lines[0].tool).toBe('Read');
    expect(lines[0].file).toBe('/src/auth.ts');
  });

  it('writes null file when not provided', () => {
    logToolUse('Marcus', 'Bash', null);
    const lines = getLogLines('Marcus');
    expect(lines[0].file).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// logHandoff
// ─────────────────────────────────────────────────────────────
describe('logHandoff', () => {
  it('writes handoff_sent to fromAgent log', () => {
    logHandoff('Marcus', 'James', 'Auth PR ready for review');
    const marcusLines = getLogLines('Marcus');
    expect(marcusLines[0].type).toBe('handoff_sent');
    expect(marcusLines[0].to).toBe('James');
    expect(marcusLines[0].reason).toContain('Auth PR');
  });

  it('writes handoff_received to toAgent log', () => {
    logHandoff('Marcus', 'James', 'Auth PR ready');
    const jamesLines = getLogLines('James');
    expect(jamesLines[0].type).toBe('handoff_received');
    expect(jamesLines[0].from).toBe('Marcus');
  });

  it('truncates reason to 200 chars', () => {
    logHandoff('Marcus', 'James', 'r'.repeat(300));
    const lines = getLogLines('Marcus');
    expect(lines[0].reason.length).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────
// logAsanaAction
// ─────────────────────────────────────────────────────────────
describe('logAsanaAction', () => {
  it('writes an asana_action entry', () => {
    logAsanaAction('Sarah', 'created', 'TASK-123', 'New auth endpoint task');
    const lines = getLogLines('Sarah');
    expect(lines[0].type).toBe('asana_action');
    expect(lines[0].action).toBe('created');
    expect(lines[0].task_id).toBe('TASK-123');
    expect(lines[0].details).toBe('New auth endpoint task');
  });
});

// ─────────────────────────────────────────────────────────────
// getAgentSummary
// ─────────────────────────────────────────────────────────────
describe('getAgentSummary', () => {
  it('returns null when no log file exists', () => {
    expect(getAgentSummary('UnknownAgent')).toBeNull();
  });

  it('returns correct message and response counts', () => {
    logMessage('James', 'First task', 'dm');
    logMessage('James', 'Second task', 'dm');
    logResponse('James', 'Done.', 500, 10);
    logError('James', new Error('oops'), 'test');

    const summary = getAgentSummary('James');
    expect(summary).not.toBeNull();
    expect(summary.agent).toBe('James');
    expect(summary.messages).toBe(2);
    expect(summary.responses).toBe(1);
    expect(summary.errors).toBe(1);
  });

  it('counts handoffs', () => {
    logHandoff('James', 'Priya', 'review the PR');
    const summary = getAgentSummary('James');
    expect(summary.handoffs).toBe(1);
  });

  it('counts Asana actions', () => {
    logAsanaAction('Sarah', 'updated', 'T-001', 'moved to in progress');
    const summary = getAgentSummary('Sarah');
    expect(summary.asana_actions).toBe(1);
  });

  it('lists files edited (Write/Edit tools)', () => {
    logToolUse('James', 'Write', '/src/auth.ts');
    logToolUse('James', 'Edit', '/src/auth.ts'); // same file — deduplicated
    logToolUse('James', 'Write', '/src/db.ts');

    const summary = getAgentSummary('James');
    expect(summary.files_edited).toHaveLength(2);
    expect(summary.files_edited).toContain('/src/auth.ts');
    expect(summary.files_edited).toContain('/src/db.ts');
  });

  it('lists files read (Read tool)', () => {
    logToolUse('Elena', 'Read', '/src/components/Login.tsx');
    const summary = getAgentSummary('Elena');
    expect(summary.files_read).toContain('/src/components/Login.tsx');
  });

  it('calculates total tokens from responses', () => {
    logResponse('Marcus', 'Response A', 500, 50);
    logResponse('Marcus', 'Response B', 300, 30);
    const summary = getAgentSummary('Marcus');
    expect(summary.tokens_est).toBe(80);
  });

  it('calculates average response time', () => {
    logResponse('Elena', 'Reply 1', 1000, 20);
    logResponse('Elena', 'Reply 2', 500, 10);
    const summary = getAgentSummary('Elena');
    expect(summary.avg_response_ms).toBe(750);
  });
});

// ─────────────────────────────────────────────────────────────
// Multiple agents in the same run
// ─────────────────────────────────────────────────────────────
describe('multi-agent logging isolation', () => {
  it("James logs do not appear in Elena's log file", () => {
    logMessage('James', 'James message', 'dm');
    logMessage('Elena', 'Elena message', 'dm');

    const jamesLines = getLogLines('James');
    const elenaLines = getLogLines('Elena');

    expect(jamesLines).toHaveLength(1);
    expect(elenaLines).toHaveLength(1);
    expect(jamesLines[0].message).not.toBe('Elena message');
  });

  it('both agents can be summarised independently', () => {
    logMessage('Marcus', 'task 1', 'dm');
    logMessage('Priya', 'review 1', 'dm');

    expect(getAgentSummary('Marcus')?.messages).toBe(1);
    expect(getAgentSummary('Priya')?.messages).toBe(1);
  });
});
