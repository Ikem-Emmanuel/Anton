#!/usr/bin/env node

// Manual test for the watcher module
// Usage: node scripts/test-watcher.js
//
// Runs a one-shot health check and prints the results.
// No Slack needed — just shows what the watcher sees.

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkGitState, getHealthSnapshot, initWatcher, shutdownWatcher } from '../src/heart/watcher.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');

const alerts = [];

console.log('--- Anton Watcher Manual Test ---\n');

// Init with a mock notifier that just collects alerts
initWatcher({
  notifyNoel: async (severity, message, opts) => {
    alerts.push({ severity, message, ...opts });
    console.log(`  [ALERT] ${severity}: ${message}`);
  },
  dataDir: DATA_DIR,
});

// Wait for the initial health check
await new Promise((r) => setTimeout(r, 2000));

const snap = getHealthSnapshot();
if (snap) {
  console.log('\n[System Health]');
  console.log(`  CPU:     ${snap.cpu}%`);
  console.log(`  Memory:  ${snap.memUsed}% of ${snap.memTotal}GB`);
  console.log(`  Disk:    ${snap.diskUsed}% of ${snap.diskTotal}GB`);
  if (snap.batteryPercent !== null) {
    console.log(`  Battery: ${snap.batteryPercent}%${snap.batteryCharging ? ' (charging)' : ''}`);
  }
} else {
  console.log('\n[System Health] No snapshot available');
}

// Git state
const git = await checkGitState(ROOT);
if (git) {
  console.log('\n[Git State]');
  console.log(`  Branch:      ${git.branch}`);
  console.log(`  Uncommitted: ${git.uncommitted} file(s)`);
  console.log(`  Ahead:       ${git.ahead} commit(s)`);
  console.log(`  Behind:      ${git.behind} commit(s)`);
}

console.log(`\n[Alerts Triggered] ${alerts.length}`);
for (const a of alerts) {
  console.log(`  ${a.severity}: ${a.message}`);
}

shutdownWatcher();
console.log('\n--- Test complete ---');
process.exit(0);
