#!/usr/bin/env node
// Manual test for trust tiers + audit log
// Usage: node scripts/test-trust.js

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  closeAudit,
  getRecentActions,
  getStats,
  initAudit,
  logAction,
  updateOutcome,
  verifyChain,
} from '../src/audit.js';
import { classifyAction, getAllActions, TIER } from '../src/trust.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

console.log('--- Anton Trust + Audit Manual Test ---\n');

// ---- Trust Classification ----
console.log('[Trust Tiers]\n');

const testActions = [
  ['pm2:restart', {}],
  ['slack:message:send', {}],
  ['git:pr:create', {}],
  ['git:pr:merge', { checksPass: true, approvals: 2, base: 'develop', mergeable: true }],
  ['git:pr:merge', { checksPass: true, approvals: 0, base: 'main', mergeable: true }],
  ['deploy:staging', { testsPass: true, lintPass: true }],
  ['deploy:staging', { testsPass: false, lintPass: true }],
  ['deploy:production', {}],
  ['database:delete', {}],
  ['purchase:any', {}],
  ['totally:unknown:action', {}],
];

for (const [action, context] of testActions) {
  const result = classifyAction(action, context);
  const icon = result.execute ? 'GO' : 'STOP';
  console.log(`  [${icon}] ${action.padEnd(30)} Tier ${result.tier} (${result.label}) — ${result.reason}`);
}

const actions = getAllActions();
console.log(
  `\n  Total: ${actions.tier1.length} auto | ${actions.tier2.length} anton-decides | ${actions.tier3.length} noel-approves\n`
);

// ---- Audit Log ----
console.log('[Audit Log]\n');
initAudit(DATA_DIR);

// Log some actions
const id1 = logAction({
  agent: 'Anton',
  actionType: 'pm2:restart',
  tier: 1,
  status: 'auto',
  reasoning: 'Service crashed',
});
updateOutcome(id1, 'success', 'Restarted in 1.2s');

const id2 = logAction({
  agent: 'Marcus',
  actionType: 'git:pr:merge',
  tier: 2,
  status: 'approved',
  approvedBy: 'Anton',
  reasoning: 'All checks green',
});
updateOutcome(id2, 'success', 'PR #42 merged');

const id3 = logAction({
  agent: 'Anton',
  actionType: 'deploy:production',
  tier: 3,
  status: 'pending',
  reasoning: 'Waiting for Noel',
});

console.log(`  Logged 3 actions (${id1.slice(0, 8)}, ${id2.slice(0, 8)}, ${id3.slice(0, 8)})`);

// Verify chain
const chain = verifyChain();
console.log(
  `  Chain integrity: ${chain.valid ? 'VALID' : 'BROKEN'} (${chain.total} entries, ${chain.failures.length} failures)`
);

// Stats
const stats = getStats();
console.log(`  Total actions: ${stats.total}`);
console.log(`  By tier: ${stats.byTier.map((t) => `T${t.tier}=${t.count}`).join(', ')}`);
console.log(`  By outcome: ${stats.byOutcome.map((o) => `${o.outcome}=${o.count}`).join(', ')}`);

// Recent
const recent = getRecentActions(3);
console.log(`\n  Recent:`);
for (const r of recent) {
  console.log(`    [T${r.tier}] ${r.action_type} by ${r.agent} — ${r.outcome} (${r.approval_status})`);
}

closeAudit();
console.log('\n--- Test complete ---');
process.exit(0);
