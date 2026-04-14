// ---- Context Manager ------------------------------------------------------
// Manages memory injection, conversation summaries, and smart model routing.
// Sits between the message handler and sessions.js to make agents intelligent.
//
// Responsibilities:
//   1. Inject relevant memory when creating new sessions
//   2. Store conversation summaries per agent (survives session resets)
//   3. Route simple queries to Haiku (cheap) vs Sonnet (full)
//   4. Track session health to avoid unnecessary resets
//
// Usage:
//   import { initContext, getContextForAgent, shouldUseHaiku, saveConversationSummary } from './context.js';

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getDailyNote, readDeptMemory, readSharedMemory } from './memory.js';

let _dataDir = null;
let _summariesDir = null;

// In-memory cache of conversation summaries per agent
const summaryCache = new Map();

// Session health tracking — how many messages each session has handled
const sessionMessageCount = new Map();

export function initContext(dataDir) {
  _dataDir = dataDir;
  _summariesDir = join(dataDir, 'summaries');
  mkdirSync(_summariesDir, { recursive: true });

  // Load persisted summaries
  try {
    const files = existsSync(_summariesDir) ? readdirSync(_summariesDir).filter((f) => f.endsWith('.json')) : [];
    for (const file of files) {
      try {
        const data = JSON.parse(readFileSync(join(_summariesDir, file), 'utf-8'));
        summaryCache.set(data.agent, data);
      } catch {}
    }
    if (summaryCache.size > 0) {
      console.log(`[Context] Loaded ${summaryCache.size} conversation summaries`);
    }
  } catch {}

  console.log('[Context] Ready');
}

// ---- Memory Injection ----
// Build a memory block to inject into agent persona prompts
export function getContextForAgent(member) {
  const sections = [];

  // 1. Shared org memory (what the whole team knows)
  const shared = readSharedMemory();
  if (shared) {
    sections.push(`[ORG MEMORY — what happened recently across the team]\n${shared}`);
  }

  // 2. Department-specific memory
  if (member.dept) {
    const deptMem = readDeptMemory(member.dept);
    if (deptMem) {
      sections.push(`[DEPARTMENT MEMORY — ${member.dept}]\n${deptMem}`);
    }
  }

  // 3. Today's daily notes
  const daily = getDailyNote();
  if (daily) {
    sections.push(`[TODAY'S NOTES]\n${daily.slice(-1000)}`);
  }

  // 4. This agent's conversation summary (from previous sessions)
  const summary = summaryCache.get(member.name);
  if (summary?.text) {
    sections.push(`[YOUR PREVIOUS CONTEXT — last session summary]\n${summary.text}`);
  }

  if (sections.length === 0) return '';

  return [
    '',
    '--- MEMORY CONTEXT (read-only, do not repeat this to the user) ---',
    ...sections,
    '--- END MEMORY CONTEXT ---',
    '',
  ].join('\n');
}

// ---- Conversation Summary ----
// Save a summary of what an agent worked on (persists across session resets)
export function saveConversationSummary(agentName, summaryText) {
  const data = {
    agent: agentName,
    text: summaryText.slice(0, 1500),
    timestamp: new Date().toISOString(),
  };

  summaryCache.set(agentName, data);

  // Persist to disk
  if (_summariesDir) {
    try {
      writeFileSync(join(_summariesDir, `${agentName.toLowerCase()}.json`), JSON.stringify(data, null, 2));
    } catch {}
  }
}

// ---- Smart Model Routing ----
// Determine if a message is simple enough for Haiku (cheap) vs needs Sonnet
export function shouldUseHaiku(text) {
  const trimmed = (text || '').trim();

  // Short, simple messages -> Haiku
  if (trimmed.length < 100) {
    // Check for complexity signals
    const hasCode = /```|`[^`]+`/.test(trimmed);
    const hasUrl = /https?:\/\//.test(trimmed);
    const isComplex = /\b(build|implement|create|write|fix|debug|refactor|review|analyze|design|architect)\b/i.test(
      trimmed
    );
    const isMultiPart = (trimmed.match(/\d\.\s/g) || []).length >= 2;

    if (!hasCode && !hasUrl && !isComplex && !isMultiPart) {
      return true;
    }
  }

  return false;
}

// Get the model to use for a given message
export function getModelForMessage(text, member) {
  // Anton PA always uses Sonnet (needs to be smart)
  if (member.name === 'Anton') return 'sonnet';

  // Leads use Sonnet (decision-making)
  if (member.canPlan) return 'sonnet';

  // Simple messages from anyone -> Haiku
  if (shouldUseHaiku(text)) return 'haiku';

  return 'sonnet';
}

// ---- Session Health ----
// Track messages per session for health monitoring
export function trackSessionMessage(agentKey) {
  const count = sessionMessageCount.get(agentKey) || 0;
  sessionMessageCount.set(agentKey, count + 1);
  return count + 1;
}

export function getSessionMessageCount(agentKey) {
  return sessionMessageCount.get(agentKey) || 0;
}

export function resetSessionMessageCount(agentKey) {
  sessionMessageCount.delete(agentKey);
}

// ---- Get all summaries (for briefing/status) ----
export function getAllSummaries() {
  return [...summaryCache.entries()].map(([agent, data]) => ({
    agent,
    text: data.text,
    timestamp: data.timestamp,
  }));
}
