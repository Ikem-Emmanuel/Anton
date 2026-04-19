// ─── Agent Activity Logger ───────────────────────────────────
// Per-agent log files tracking everything: messages, tool calls, files edited, tokens

import { writeFileSync, appendFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

let logsDir;

export function initLogger(dataDir) {
  logsDir = join(dataDir, 'logs');
  mkdirSync(logsDir, { recursive: true });
}

function getLogFile(agentName) {
  const date = new Date().toISOString().split('T')[0];
  const dir = join(logsDir, agentName.toLowerCase());
  mkdirSync(dir, { recursive: true });
  return join(dir, `${date}.jsonl`);
}

function logEntry(agentName, entry) {
  const file = getLogFile(agentName);
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    agent: agentName,
    ...entry,
  });
  try {
    appendFileSync(file, line + '\n');
  } catch (e) {
    console.error(`[Logger] Failed to write log for ${agentName}:`, e.message?.slice(0, 100));
  }
}

// Log when an agent receives a message
export function logMessage(agentName, message, source) {
  logEntry(agentName, {
    type: 'message_received',
    source,          // 'dm', 'anton-engineering', etc
    message: message.slice(0, 500),
  });
}

// Log the agent's response
export function logResponse(agentName, response, durationMs, tokensEst) {
  logEntry(agentName, {
    type: 'response',
    duration_ms: durationMs,
    tokens_est: tokensEst,
    response_length: response?.length || 0,
    response_preview: response?.slice(0, 300) || null,
  });
}

// Log errors
export function logError(agentName, error, context) {
  logEntry(agentName, {
    type: 'error',
    error: error?.message || String(error),
    context: context?.slice(0, 200),
  });
}

// Log session creation/resume
export function logSession(agentName, sessionId, isResume) {
  logEntry(agentName, {
    type: isResume ? 'session_resumed' : 'session_created',
    session_id: sessionId?.slice(0, 12),
  });
}

// Log tool usage (parsed from SDK stream if available)
export function logToolUse(agentName, toolName, filePath) {
  logEntry(agentName, {
    type: 'tool_use',
    tool: toolName,
    file: filePath || null,
  });
}

// Log agent-to-agent communication
export function logHandoff(fromAgent, toAgent, reason) {
  logEntry(fromAgent, {
    type: 'handoff_sent',
    to: toAgent,
    reason: reason?.slice(0, 200),
  });
  logEntry(toAgent, {
    type: 'handoff_received',
    from: fromAgent,
    reason: reason?.slice(0, 200),
  });
}

// Log Asana task updates
export function logAsanaAction(agentName, action, taskId, details) {
  logEntry(agentName, {
    type: 'asana_action',
    action,      // 'created', 'updated', 'moved', 'commented'
    task_id: taskId,
    details: details?.slice(0, 200),
  });
}

// Get a summary of an agent's activity for a given day
export function getAgentSummary(agentName) {
  const date = new Date().toISOString().split('T')[0];
  const file = join(logsDir, agentName.toLowerCase(), `${date}.jsonl`);

  if (!existsSync(file)) return null;

  try {
    const lines = readFileSync(file, 'utf-8').split('\n').filter(Boolean);
    const entries = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

    const messages = entries.filter(e => e.type === 'message_received').length;
    const responses = entries.filter(e => e.type === 'response');
    const errors = entries.filter(e => e.type === 'error').length;
    const tools = entries.filter(e => e.type === 'tool_use');
    const handoffs = entries.filter(e => e.type === 'handoff_sent').length;
    const asanaActions = entries.filter(e => e.type === 'asana_action').length;

    const totalTokens = responses.reduce((sum, r) => sum + (r.tokens_est || 0), 0);
    const avgDuration = responses.length > 0
      ? Math.round(responses.reduce((sum, r) => sum + (r.duration_ms || 0), 0) / responses.length)
      : 0;

    const filesEdited = [...new Set(tools.filter(t => t.tool === 'Write' || t.tool === 'Edit').map(t => t.file).filter(Boolean))];
    const filesRead = [...new Set(tools.filter(t => t.tool === 'Read').map(t => t.file).filter(Boolean))];

    return {
      agent: agentName,
      date,
      messages,
      responses: responses.length,
      errors,
      tokens_est: totalTokens,
      avg_response_ms: avgDuration,
      handoffs,
      asana_actions: asanaActions,
      files_edited: filesEdited,
      files_read: filesRead,
      tools_used: tools.length,
    };
  } catch {
    return null;
  }
}
