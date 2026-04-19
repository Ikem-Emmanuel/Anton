#!/usr/bin/env node
// Manual test for the briefing module
// Usage: node scripts/test-briefing.js
//
// Runs the briefing immediately and prints the output.
// No Slack needed — just shows what would be sent.

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initBriefing, runBriefing } from '../src/heart/briefing.js';
import { consumeBriefingBuffer, initNotify, notifyNoel, shutdownNotify } from '../src/heart/notify.js';
import { checkGitState, getHealthSnapshot, initWatcher, shutdownWatcher } from '../src/heart/watcher.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');

console.log('--- Anton Briefing Manual Test ---\n');

// Init watcher to get a health snapshot
initWatcher({
  notifyNoel: async () => {},
  dataDir: DATA_DIR,
});

// Wait for health check
await new Promise((r) => setTimeout(r, 2000));

// Seed some P3 items to show in the briefing
initNotify({ slackClient: null, noelUserId: null });
await notifyNoel('P3', 'Test: deployment completed successfully');
await notifyNoel('P3', 'Test: new PR #42 opened by Marcus');

// Run the briefing
const notifications = [];
initBriefing({
  scheduleJob: () => {},
  getHealthSnapshot,
  checkGitState,
  consumeBriefingBuffer,
  notifyNoel: async (sev, msg) => {
    notifications.push({ sev, msg });
  },
  antonRoot: ROOT,
  dataDir: DATA_DIR,
});

const text = await runBriefing();

console.log('=== Briefing Output ===\n');
console.log(text);
console.log('\n=== Would send as ===');
console.log(`Severity: ${notifications[0]?.sev || 'none'}`);
console.log(`Length: ${text?.length || 0} chars`);

shutdownWatcher();
shutdownNotify();
console.log('\n--- Test complete ---');
process.exit(0);
