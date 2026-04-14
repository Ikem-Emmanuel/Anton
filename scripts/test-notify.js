#!/usr/bin/env node
// Manual test for the notify module
// Usage: node scripts/test-notify.js
//
// Requires .env with SLACK_BOT_TOKEN and NOEL_SLACK_USER_ID
// Optional: PUSHOVER_APP_TOKEN and PUSHOVER_USER_KEY for P0 test

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { consumeBriefingBuffer, forceFlushDigest, initNotify, notifyNoel, shutdownNotify } from '../src/notify.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Load .env
const envFile = join(ROOT, '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf-8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.+)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

const BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const NOEL_USER_ID = process.env.NOEL_SLACK_USER_ID;

if (!BOT_TOKEN) {
  console.error('Missing SLACK_BOT_TOKEN in .env');
  process.exit(1);
}
if (!NOEL_USER_ID) {
  console.error('Missing NOEL_SLACK_USER_ID in .env');
  process.exit(1);
}

// Create a real Slack client
import pkg from '@slack/bolt';

const { App } = pkg;

const app = new App({
  token: BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: !!process.env.SLACK_APP_TOKEN,
  logLevel: 'ERROR',
});

const args = process.argv.slice(2);
const testType = args[0] || 'all';

async function run() {
  console.log('--- Anton Notify Manual Test ---\n');

  initNotify({
    slackClient: app.client,
    noelUserId: NOEL_USER_ID,
  });

  if (testType === 'p0' || testType === 'all') {
    console.log(
      '[Test] P0 - Emergency (Slack DM' +
        (process.env.PUSHOVER_APP_TOKEN ? ' + Pushover' : ', no Pushover configured') +
        ')'
    );
    await notifyNoel('P0', 'TEST: This is a P0 emergency test from Anton notify system.');
    console.log('[Test] P0 sent. Check your Slack DM.\n');
  }

  if (testType === 'p1' || testType === 'all') {
    console.log('[Test] P1 - Urgent (Slack DM)');
    await notifyNoel('P1', 'TEST: This is a P1 urgent test. PR #42 needs your review.');
    console.log('[Test] P1 sent. Check your Slack DM.\n');
  }

  if (testType === 'p2' || testType === 'all') {
    console.log('[Test] P2 - Important (buffered, flushing immediately for test)');
    await notifyNoel('P2', 'TEST: P2 item one - new Asana task assigned');
    await notifyNoel('P2', 'TEST: P2 item two - metrics report ready');
    await forceFlushDigest();
    console.log('[Test] P2 digest flushed. Check your Slack DM.\n');
  }

  if (testType === 'p3' || testType === 'all') {
    console.log('[Test] P3 - Info (buffered for morning briefing)');
    await notifyNoel('P3', 'TEST: P3 info item - FYI deployment completed');
    const items = consumeBriefingBuffer();
    console.log(`[Test] P3 buffered: ${items.length} item(s) in briefing buffer (not sent to Slack).\n`);
  }

  if (testType === 'cooldown' || testType === 'all') {
    console.log('[Test] Cooldown - sending same key twice');
    await notifyNoel('P1', 'TEST: Cooldown first (should send)', { cooldownKey: 'test-cd' });
    await notifyNoel('P1', 'TEST: Cooldown second (should be skipped)', { cooldownKey: 'test-cd' });
    console.log('[Test] Only one message should appear in Slack DM.\n');
  }

  shutdownNotify();
  console.log('--- Tests complete ---');
  process.exit(0);
}

run().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});
