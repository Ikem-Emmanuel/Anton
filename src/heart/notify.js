// ---- Notification System ------------------------------------------------
// Core push function for proactive alerts. Everything in Anton that needs
// to reach Noel unprompted goes through notifyNoel().
//
// Severity tiers:
//   P0 — Emergency: Slack DM + Pushover (phone buzz, bypasses DND)
//   P1 — Urgent:    Slack DM with mention
//   P2 — Important: Batched into hourly digest
//   P3 — Info:      Included in morning briefing only
//
// Usage:
//   import { initNotify, notifyNoel } from './notify.js';
//   initNotify({ slackClient, noelUserId, pushoverToken, pushoverUser });
//   await notifyNoel('P1', 'PM2: api-service crashed. Restarted automatically.');

import https from 'node:https';
import querystring from 'node:querystring';

let _slackClient = null;
let _noelUserId = null;
let _noelDmChannel = null;
let _pushoverToken = null;
let _pushoverUser = null;
let _quietStart = 23; // 11pm
let _quietEnd = 7; // 7am

// P2 digest buffer — flushed hourly
const digestBuffer = [];
let digestInterval = null;

// P3 briefing buffer — flushed at morning briefing time
const briefingBuffer = [];

// Cooldown per message key to prevent alert storms
const cooldowns = new Map(); // key -> timestamp
const COOLDOWN_MS = 5 * 60 * 1000; // 5 min default

export function initNotify({ slackClient, noelUserId, pushoverToken, pushoverUser, quietStart, quietEnd }) {
  _slackClient = slackClient;
  _noelUserId = noelUserId;
  _noelDmChannel = null;
  _pushoverToken = pushoverToken || process.env.PUSHOVER_APP_TOKEN || null;
  _pushoverUser = pushoverUser || process.env.PUSHOVER_USER_KEY || null;
  _quietStart = quietStart ?? 23;
  _quietEnd = quietEnd ?? 7;

  // Reset state
  digestBuffer.length = 0;
  briefingBuffer.length = 0;
  cooldowns.clear();

  // Flush P2 digest every hour
  if (digestInterval) clearInterval(digestInterval);
  digestInterval = setInterval(flushDigest, 60 * 60 * 1000);

  console.log(
    '[Notify] Ready' + (_pushoverToken ? ' (Pushover enabled)' : ' (Pushover not configured — P0 will use Slack only)')
  );
}

function isQuietHours() {
  const hour = new Date().getHours();
  if (_quietStart > _quietEnd) {
    return hour >= _quietStart || hour < _quietEnd;
  }
  return hour >= _quietStart && hour < _quietEnd;
}

function checkCooldown(key) {
  if (!key) return false;
  const last = cooldowns.get(key);
  if (last && Date.now() - last < COOLDOWN_MS) return true;
  cooldowns.set(key, Date.now());
  return false;
}

async function getNoelDm() {
  if (_noelDmChannel) return _noelDmChannel;
  if (!_slackClient || !_noelUserId) return null;
  try {
    const result = await _slackClient.conversations.open({ users: _noelUserId });
    _noelDmChannel = result.channel.id;
    return _noelDmChannel;
  } catch (e) {
    console.error('[Notify] Failed to open DM:', e.message);
    return null;
  }
}

// ---- Slack DM ----
async function sendSlackDM(text, severity) {
  const dm = await getNoelDm();
  if (!dm) return;

  const colorMap = { P0: '#FF0000', P1: '#FF8C00', P2: '#FFD700', P3: '#4A90D9' };
  const labelMap = { P0: 'EMERGENCY', P1: 'URGENT', P2: 'IMPORTANT', P3: 'INFO' };

  try {
    await _slackClient.chat.postMessage({
      channel: dm,
      text: `[${severity}] ${text}`,
      attachments: [
        {
          color: colorMap[severity] || '#808080',
          title: `${labelMap[severity] || severity}`,
          text,
          footer: `Anton | ${new Date().toLocaleTimeString()}`,
        },
      ],
    });
  } catch (e) {
    console.error('[Notify] Slack DM failed:', e.message);
  }
}

// ---- Pushover (P0 only) ----
async function sendPushover(title, message, priority) {
  if (!_pushoverToken || !_pushoverUser) {
    console.warn('[Notify] Pushover not configured — P0 alert going to Slack only');
    return;
  }

  const body = querystring.stringify({
    token: _pushoverToken,
    user: _pushoverUser,
    title,
    message,
    priority,
    ...(priority === 2 ? { retry: 60, expire: 3600 } : {}),
    sound: priority === 2 ? 'siren' : 'pushover',
  });

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.pushover.net',
        path: '/1/messages.json',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
      (res) => {
        let data = '';
        res.on('data', (d) => {
          data += d;
        });
        res.on('end', () => {
          if (res.statusCode !== 200) {
            console.error('[Notify] Pushover error:', res.statusCode, data);
          }
          resolve();
        });
      }
    );
    req.on('error', (e) => {
      console.error('[Notify] Pushover request failed:', e.message);
      resolve();
    });
    req.write(body);
    req.end();
  });
}

// ---- Core function ----
export async function notifyNoel(severity, message, { cooldownKey, force } = {}) {
  if (!_slackClient) {
    console.warn('[Notify] Not initialized — dropping:', severity, message);
    return;
  }

  // Cooldown check (unless forced)
  if (!force && cooldownKey && checkCooldown(cooldownKey)) {
    console.log(`[Notify] Cooldown active for ${cooldownKey}, skipping ${severity}`);
    return;
  }

  const timestamp = new Date().toISOString();
  console.log(`[Notify] ${severity}: ${message.slice(0, 100)}`);

  switch (severity) {
    case 'P0':
      // Emergency — always send, ignore quiet hours
      await sendSlackDM(message, 'P0');
      await sendPushover('Anton P0', message, 2);
      break;

    case 'P1':
      // Urgent — Slack DM, respect quiet hours (downgrade to P2 if quiet)
      if (isQuietHours()) {
        digestBuffer.push({ severity: 'P1', message, timestamp });
        console.log('[Notify] P1 during quiet hours — buffered to digest');
      } else {
        await sendSlackDM(message, 'P1');
      }
      break;

    case 'P2':
      // Important — buffer for hourly digest
      digestBuffer.push({ severity: 'P2', message, timestamp });
      break;

    case 'P3':
      // Info — buffer for morning briefing
      briefingBuffer.push({ severity: 'P3', message, timestamp });
      break;

    default:
      console.warn(`[Notify] Unknown severity: ${severity}`);
      await sendSlackDM(message, severity);
  }
}

// ---- Digest flush (P2, hourly) ----
async function flushDigest() {
  if (digestBuffer.length === 0) return;

  const items = digestBuffer.splice(0);
  const lines = items.map((i) => `[${i.severity}] ${i.message}`).join('\n');
  const summary = `*Hourly Digest* (${items.length} item${items.length > 1 ? 's' : ''})\n\n${lines}`;

  await sendSlackDM(summary, 'P2');
  console.log(`[Notify] Flushed ${items.length} digest items`);
}

// ---- Briefing buffer access (consumed by briefing.js) ----
export function consumeBriefingBuffer() {
  return briefingBuffer.splice(0);
}

// ---- Force flush digest (for testing or shutdown) ----
export async function forceFlushDigest() {
  await flushDigest();
}

// ---- Cleanup ----
export function shutdownNotify() {
  if (digestInterval) {
    clearInterval(digestInterval);
    digestInterval = null;
  }
}
