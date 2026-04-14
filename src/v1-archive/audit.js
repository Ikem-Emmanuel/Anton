// ---- Audit Log -----------------------------------------------------------
// Hash-chained SQLite log of every action Anton takes or approves.
// Every entry links to the previous via SHA-256, making tampering detectable.
//
// Usage:
//   import { initAudit, logAction, updateOutcome, verifyChain, getRecentActions } from './audit.js';
//   initAudit(dataDir);
//   const logId = logAction({ agent, actionType, tier, context, status, reasoning });
//   updateOutcome(logId, 'success', 'Restarted in 2s');

import { createHash, randomUUID } from 'node:crypto';
import { join } from 'node:path';
import Database from 'better-sqlite3';

let db = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS audit_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  log_id          TEXT NOT NULL UNIQUE,
  timestamp       TEXT NOT NULL,
  agent           TEXT NOT NULL,
  action_type     TEXT NOT NULL,
  tier            INTEGER NOT NULL,
  context         TEXT,
  approval_status TEXT NOT NULL,
  approved_by     TEXT,
  reasoning       TEXT,
  outcome         TEXT DEFAULT 'pending',
  outcome_detail  TEXT,
  prev_hash       TEXT NOT NULL,
  row_hash        TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_tier ON audit_log(tier);
CREATE INDEX IF NOT EXISTS idx_audit_agent ON audit_log(agent);
`;

export function initAudit(dataDir) {
  const dbPath = join(dataDir, 'audit.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);
  console.log(`[Audit] Ready (${dbPath})`);
}

function sha256(input) {
  return createHash('sha256').update(input).digest('hex');
}

function canonicalize(obj) {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalize).join(',') + ']';
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(',') + '}';
}

export function logAction({ agent, actionType, tier, context, status, approvedBy, reasoning }) {
  if (!db) throw new Error('Audit not initialized');

  const lastRow = db.prepare('SELECT row_hash FROM audit_log ORDER BY id DESC LIMIT 1').get();
  const prevHash = lastRow?.row_hash ?? 'GENESIS';
  const logId = randomUUID();
  const timestamp = new Date().toISOString();

  const content = {
    log_id: logId,
    timestamp,
    agent: agent || 'Anton',
    action_type: actionType,
    tier,
    context: typeof context === 'string' ? context : JSON.stringify(context || {}),
    approval_status: status || 'pending',
    approved_by: approvedBy || null,
    reasoning: reasoning || null,
    outcome: 'pending',
    outcome_detail: null,
    prev_hash: prevHash,
  };

  const rowHash = sha256(prevHash + canonicalize(content));

  db.prepare(`
    INSERT INTO audit_log
    (log_id, timestamp, agent, action_type, tier, context, approval_status,
     approved_by, reasoning, outcome, outcome_detail, prev_hash, row_hash)
    VALUES
    (@log_id, @timestamp, @agent, @action_type, @tier, @context, @approval_status,
     @approved_by, @reasoning, @outcome, @outcome_detail, @prev_hash, @row_hash)
  `).run({ ...content, row_hash: rowHash });

  return logId;
}

export function updateOutcome(logId, outcome, detail) {
  if (!db) return;
  db.prepare('UPDATE audit_log SET outcome = ?, outcome_detail = ? WHERE log_id = ?').run(
    outcome,
    detail?.slice(0, 2000) || null,
    logId
  );
}

export function verifyChain() {
  if (!db) return { valid: false, failures: [{ issue: 'not_initialized' }], total: 0 };

  const rows = db.prepare('SELECT * FROM audit_log ORDER BY id ASC').all();
  const failures = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const expectedPrevHash = i === 0 ? 'GENESIS' : rows[i - 1].row_hash;

    if (row.prev_hash !== expectedPrevHash) {
      failures.push({ id: row.id, log_id: row.log_id, issue: 'prev_hash_mismatch' });
      continue;
    }

    const content = {
      log_id: row.log_id,
      timestamp: row.timestamp,
      agent: row.agent,
      action_type: row.action_type,
      tier: row.tier,
      context: row.context,
      approval_status: row.approval_status,
      approved_by: row.approved_by,
      reasoning: row.reasoning,
      outcome: 'pending',
      outcome_detail: null,
      prev_hash: row.prev_hash,
    };

    const recomputed = sha256(row.prev_hash + canonicalize(content));
    if (row.row_hash !== recomputed) {
      failures.push({ id: row.id, log_id: row.log_id, issue: 'hash_mismatch' });
    }
  }

  return { valid: failures.length === 0, failures, total: rows.length };
}

export function getRecentActions(limit = 20) {
  if (!db) return [];
  return db.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT ?').all(limit);
}

export function getActionsByAgent(agent, limit = 20) {
  if (!db) return [];
  return db.prepare('SELECT * FROM audit_log WHERE agent = ? ORDER BY id DESC LIMIT ?').all(agent, limit);
}

export function getActionsByTier(tier, limit = 20) {
  if (!db) return [];
  return db.prepare('SELECT * FROM audit_log WHERE tier = ? ORDER BY id DESC LIMIT ?').all(tier, limit);
}

export function getStats() {
  if (!db) return null;
  const total = db.prepare('SELECT COUNT(*) as count FROM audit_log').get().count;
  const byTier = db.prepare('SELECT tier, COUNT(*) as count FROM audit_log GROUP BY tier').all();
  const byOutcome = db.prepare('SELECT outcome, COUNT(*) as count FROM audit_log GROUP BY outcome').all();
  const byAgent = db
    .prepare('SELECT agent, COUNT(*) as count FROM audit_log GROUP BY agent ORDER BY count DESC LIMIT 10')
    .all();
  return { total, byTier, byOutcome, byAgent };
}

export function closeAudit() {
  if (db) {
    db.close();
    db = null;
  }
}
