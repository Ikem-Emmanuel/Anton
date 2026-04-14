// ─── Agent Analytics ─────────────────────────────────────────
// Tracks token usage, response times, task completions per agent

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

let analyticsDir;
let dailyFile;

const dailyStats = {
  date: new Date().toISOString().split('T')[0],
  agents: {},
  sessions: {},       // agentName → sessionId
  totals: { messages: 0, errors: 0, total_response_ms: 0, avg_response_ms: 0, tokens_est: 0 },
  startedAt: new Date().toISOString(),
};

export function initAnalytics(dataDir) {
  // Always reset in-memory state first (ensures test isolation and clean restarts)
  dailyStats.date = new Date().toISOString().split('T')[0];
  dailyStats.agents = {};
  dailyStats.sessions = {};
  dailyStats.totals = { messages: 0, errors: 0, total_response_ms: 0, avg_response_ms: 0, tokens_est: 0 };
  dailyStats.startedAt = new Date().toISOString();

  analyticsDir = join(dataDir, 'analytics');
  mkdirSync(analyticsDir, { recursive: true });
  dailyFile = join(analyticsDir, `daily-${dailyStats.date}.json`);

  try {
    if (existsSync(dailyFile)) {
      const saved = JSON.parse(readFileSync(dailyFile, 'utf-8'));
      if (saved.date === dailyStats.date && saved.totals?.errors < 100) {
        Object.assign(dailyStats, saved);
      }
    }
  } catch (err) {
    console.warn('[analytics] Failed to load daily stats from disk — starting fresh:', err.message);
  }
}

export function trackRequest(agentName, startTime, success, responseLength) {
  const elapsed = Date.now() - startTime;

  if (!dailyStats.agents[agentName]) {
    dailyStats.agents[agentName] = {
      messages: 0,
      successful: 0,
      errors: 0,
      tokens_est: 0,
      total_response_ms: 0,
      avg_response_ms: 0,
      min_response_ms: Infinity,
      max_response_ms: 0,
      last_active: null,
      last_message: null,
    };
  }

  const agent = dailyStats.agents[agentName];
  agent.messages++;
  if (success) agent.successful++;
  else agent.errors++;
  agent.total_response_ms += elapsed;
  agent.avg_response_ms = Math.round(agent.total_response_ms / agent.messages);
  agent.min_response_ms = Math.min(agent.min_response_ms, elapsed);
  agent.max_response_ms = Math.max(agent.max_response_ms, elapsed);
  agent.tokens_est += Math.round((responseLength || 0) / 4);
  agent.last_active = new Date().toISOString();

  // Update totals
  dailyStats.totals.messages++;
  if (!success) dailyStats.totals.errors++;
  dailyStats.totals.tokens_est += Math.round((responseLength || 0) / 4);
  dailyStats.totals.total_response_ms += elapsed;
  dailyStats.totals.avg_response_ms = Math.round(
    dailyStats.totals.total_response_ms / dailyStats.totals.messages
  );

  save();
  return { elapsed, agentName };
}

export function trackSession(agentName, sessionId) {
  dailyStats.sessions[agentName] = sessionId?.slice(0, 8) || 'unknown';
  save();
}

function save() {
  try {
    writeFileSync(dailyFile, JSON.stringify(dailyStats, null, 2));
  } catch {}
}

function fms(ms) {
  if (!ms || ms === Infinity || isNaN(ms)) return '-';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function ftok(n) {
  if (!n || isNaN(n)) return '0';
  if (n > 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n > 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${n}`;
}

function pad(str, len) {
  str = String(str);
  return str + ' '.repeat(Math.max(0, len - str.length));
}

function rpad(str, len) {
  str = String(str);
  return ' '.repeat(Math.max(0, len - str.length)) + str;
}

export function getReport() {
  const t = dailyStats.totals;
  const uptime = Math.round((Date.now() - new Date(dailyStats.startedAt).getTime()) / 60000);
  const uptimeStr = uptime >= 60 ? `${Math.floor(uptime/60)}h ${uptime%60}m` : `${uptime}m`;
  const agentCount = Object.keys(dailyStats.agents).length;
  const activeCount = Object.values(dailyStats.agents).filter(a =>
    a.last_active && (Date.now() - new Date(a.last_active).getTime()) < 600000
  ).length;
  const successRate = t.messages > 0 ? Math.round(((t.messages - (t.errors || 0)) / t.messages) * 100) : 0;

  const sorted = Object.entries(dailyStats.agents)
    .sort((a, b) => b[1].messages - a[1].messages);

  const opusAgents = ['Marcus', 'Sarah', 'Diana', 'Ada', 'Nadia'];
  const haikuAgents = ['Priya', 'Ben', 'Yuki'];

  const lines = [];

  // ── Header ──
  lines.push(`:bar_chart: *Anton Analytics — ${dailyStats.date}*`);
  lines.push('');

  // ── Overview box ──
  lines.push('```');
  lines.push(`┌─────────────────────────────────────────────┐`);
  lines.push(`│  Uptime: ${pad(uptimeStr, 8)} │  Agents: ${pad(agentCount + ' total, ' + activeCount + ' active', 16)} │`);
  lines.push(`│  Messages: ${pad(t.messages || 0, 6)} │  Errors: ${pad(t.errors || 0, 17)} │`);
  lines.push(`│  Success: ${pad(successRate + '%', 7)} │  Avg Response: ${pad(fms(t.avg_response_ms), 10)} │`);
  lines.push(`│  Tokens: ~${pad(ftok(t.tokens_est || 0), 7)} │                                │`);
  lines.push(`└─────────────────────────────────────────────┘`);
  lines.push('```');
  lines.push('');

  // ── Agent table ──
  if (sorted.length > 0) {
    lines.push('*Agent Performance*');
    lines.push('```');
    lines.push(`${pad('Agent', 10)} ${pad('Model', 7)} ${rpad('Msgs', 5)} ${rpad('OK', 4)} ${rpad('Err', 4)} ${rpad('Tokens', 7)} ${rpad('Avg', 7)} ${rpad('Min', 7)} ${rpad('Max', 7)} Active`);
    lines.push(`${'─'.repeat(80)}`);

    for (const [name, s] of sorted) {
      const model = opusAgents.includes(name) ? 'Opus' : haikuAgents.includes(name) ? 'Haiku' : 'Sonnet';
      const ago = s.last_active ? Math.round((Date.now() - new Date(s.last_active).getTime()) / 60000) : '-';
      const agoStr = ago === '-' ? '-' : ago < 60 ? `${ago}m ago` : `${Math.floor(ago/60)}h ago`;
      const errMark = (s.errors || 0) > 0 ? ' ⚠' : '';

      lines.push(
        `${pad(name, 10)} ${pad(model, 7)} ${rpad(s.messages || 0, 5)} ${rpad(s.successful || 0, 4)} ${rpad(s.errors || 0, 4)} ${rpad('~' + ftok(s.tokens_est || 0), 7)} ${rpad(fms(s.avg_response_ms), 7)} ${rpad(fms(s.min_response_ms), 7)} ${rpad(fms(s.max_response_ms), 7)} ${agoStr}${errMark}`
      );
    }
    lines.push('```');
    lines.push('');
  } else {
    lines.push('_No agent activity yet._');
    lines.push('');
  }

  // ── Model breakdown ──
  let opusTok = 0, sonnetTok = 0, haikuTok = 0;
  let opusMsg = 0, sonnetMsg = 0, haikuMsg = 0;
  for (const [name, s] of sorted) {
    if (opusAgents.includes(name)) { opusTok += (s.tokens_est || 0); opusMsg += (s.messages || 0); }
    else if (haikuAgents.includes(name)) { haikuTok += (s.tokens_est || 0); haikuMsg += (s.messages || 0); }
    else { sonnetTok += (s.tokens_est || 0); sonnetMsg += (s.messages || 0); }
  }

  lines.push('*Model Usage*');
  lines.push('```');
  lines.push(`${pad('Model', 8)} ${rpad('Agents', 7)} ${rpad('Messages', 9)} ${rpad('Tokens', 8)} ${rpad('% of total', 10)}`);
  lines.push(`${'─'.repeat(45)}`);
  const totalTok = (opusTok + sonnetTok + haikuTok) || 1;
  lines.push(`${pad('Opus', 8)} ${rpad(opusAgents.filter(n => dailyStats.agents[n]).length, 7)} ${rpad(opusMsg, 9)} ${rpad('~' + ftok(opusTok), 8)} ${rpad(Math.round(opusTok/totalTok*100) + '%', 10)}`);
  lines.push(`${pad('Sonnet', 8)} ${rpad(sorted.length - opusAgents.filter(n => dailyStats.agents[n]).length - haikuAgents.filter(n => dailyStats.agents[n]).length, 7)} ${rpad(sonnetMsg, 9)} ${rpad('~' + ftok(sonnetTok), 8)} ${rpad(Math.round(sonnetTok/totalTok*100) + '%', 10)}`);
  lines.push(`${pad('Haiku', 8)} ${rpad(haikuAgents.filter(n => dailyStats.agents[n]).length, 7)} ${rpad(haikuMsg, 9)} ${rpad('~' + ftok(haikuTok), 8)} ${rpad(Math.round(haikuTok/totalTok*100) + '%', 10)}`);
  lines.push('```');
  lines.push('');

  // ── Sessions ──
  const sessionEntries = Object.entries(dailyStats.sessions);
  if (sessionEntries.length > 0) {
    lines.push(`*Sessions: ${sessionEntries.length} active*`);
    lines.push('```');
    for (const [name, sid] of sessionEntries) {
      const agent = dailyStats.agents[name];
      const lastAgo = agent?.last_active ? Math.round((Date.now() - new Date(agent.last_active).getTime()) / 60000) : '?';
      lines.push(`${pad(name, 10)} ${sid}  (${lastAgo}m ago)`);
    }
    lines.push('```');
  }

  return lines.join('\n');
}

export function getStats() {
  return dailyStats;
}
