// ---- Smart Handoff Engine -------------------------------------------------
// Detects handoff intent from natural agent responses and dispatches automatically.
// Agents don't need to follow any special format — they just talk naturally.
//
// How it works:
//   1. After every agent response, analyzeForHandoffs() scans for signals
//   2. Detects: name mentions + delegation verbs, direct requests, topic mismatch
//   3. Dispatches the handoff with context from the conversation
//
// The system handles routing — agents just be themselves.

import { findByName, HANDOFF_RULES, TEAM } from './team.js';

// Delegation verb patterns — "ask Elena", "ping Marcus", "loop in James"
const DELEGATION_VERBS = [
  'ask',
  'tell',
  'ping',
  'loop in',
  'bring in',
  'reach out to',
  'contact',
  'send to',
  'pass to',
  'delegate to',
  'forward to',
  'notify',
  'let .* know',
  'cc',
  'flag for',
  'get .* input',
  'get .* take',
  'check with',
];

// Past-tense confirmation patterns — "I pinged Elena", "told James", "looped in Marcus"
const PAST_DELEGATION = [
  'pinged',
  'told',
  'looped in',
  'brought in',
  'reached out to',
  'contacted',
  'sent to',
  'passed to',
  'notified',
  'flagged for',
  "cc'd",
  'messaged',
];

// Referral patterns — "that's Elena's area", "James would know", "ask Marcus about this"
const REFERRAL_PATTERNS = [
  /that'?s\s+(\w+)'?s?\s+area/i,
  /(\w+)\s+would\s+(know|handle|be better|be the right)/i,
  /(\w+)\s+(should|can|could)\s+(handle|look at|review|help|take)/i,
  /better\s+suited?\s+for\s+(\w+)/i,
  /routing\s+(?:this\s+)?to\s+(\w+)/i,
  /passing\s+(?:this\s+)?to\s+(\w+)/i,
];

// Build regex for delegation detection
function buildDelegationRegex() {
  const agentNames = Object.values(TEAM)
    .map((m) => m.name)
    .join('|');
  const verbs = DELEGATION_VERBS.join('|');
  const pastVerbs = PAST_DELEGATION.join('|');

  // Separator chars: comma, em dash (U+2014), en dash (U+2013), colon, hyphen (last to avoid range)
  const sep = `[,\u2014\u2013:-]`;

  return {
    // Vocative direct address: "Elena, do X" / "Elena — do X" / "Hey Elena, X"
    vocative: new RegExp(`(?:^|[.!?]\\s+|\\n)(?:hey\\s+|hi\\s+)?(${agentNames})\\s*${sep}\\s*\\S`, 'gi'),
    // @mention at start: "@Elena check this"
    atMention: new RegExp(`(?:^|\\n)@(${agentNames})\\s+\\S`, 'gi'),
    // "I'll ask Elena", "Can ping Marcus", "Let me loop in James"
    future: new RegExp(`(?:i'?ll|let me|can|going to|will|need to)\\s+(?:${verbs})\\s+(${agentNames})`, 'gi'),
    // "Pinged Elena", "Told James", "Looped in Marcus"
    past: new RegExp(`(?:${pastVerbs})\\s+(${agentNames})`, 'gi'),
    // "ask Elena to...", "tell James that..."
    direct: new RegExp(`(?:${verbs})\\s+(${agentNames})\\s+(?:to|that|about|if|whether)\\s+(.{10,})`, 'gi'),
  };
}

let _patterns = null;
function getPatterns() {
  if (!_patterns) _patterns = buildDelegationRegex();
  return _patterns;
}

// ---- Core Analysis ----
// Analyze an agent response for handoff signals. Returns structured handoffs.
export function analyzeForHandoffs(agentName, responseText, originalMessage) {
  if (!responseText || responseText.length < 10) return [];

  const patterns = getPatterns();
  const handoffs = [];
  const seen = new Set(); // Prevent duplicate handoffs to same agent

  // 1. Check explicit HANDOFF: lines (backward compat, agents can still use this)
  for (const match of responseText.matchAll(/^HANDOFF:\s*(\w+)\s*[—-]\s*(.+)$/gim)) {
    const target = findByName(match[1]);
    if (target && !seen.has(target.name) && target.name !== agentName) {
      handoffs.push({ target, message: match[2].trim(), signal: 'explicit', confidence: 1 });
      seen.add(target.name);
    }
  }

  // 1.5 Vocative direct address — "Elena, do X" / "Elena — prep" / "Hey Elena, X" / "@Elena X"
  for (const match of responseText.matchAll(patterns.vocative)) {
    const target = findByName(match[1]);
    if (target && !seen.has(target.name) && target.name !== agentName) {
      // Extract the instruction after the separator (up to next sentence boundary)
      const afterMatch = responseText.slice(match.index + match[0].length);
      const instruction = afterMatch.split(/[.!?\n]/)[0].trim();
      handoffs.push({
        target,
        message: instruction || originalMessage?.slice(0, 300) || '',
        signal: 'vocative',
        confidence: 0.92,
      });
      seen.add(target.name);
    }
  }

  // 1.6 @mention — "@Elena check this out"
  for (const match of responseText.matchAll(patterns.atMention)) {
    const target = findByName(match[1]);
    if (target && !seen.has(target.name) && target.name !== agentName) {
      const afterMatch = responseText.slice(match.index + match[0].length);
      const instruction = afterMatch.split(/[.!?\n]/)[0].trim();
      handoffs.push({
        target,
        message: instruction || originalMessage?.slice(0, 300) || '',
        signal: 'at-mention',
        confidence: 0.9,
      });
      seen.add(target.name);
    }
  }

  // 2. Check direct delegation — "ask Elena to prepare for interviews"
  for (const match of responseText.matchAll(patterns.direct)) {
    const target = findByName(match[1]);
    if (target && !seen.has(target.name) && target.name !== agentName) {
      handoffs.push({ target, message: match[2].trim().slice(0, 500), signal: 'direct-delegation', confidence: 0.9 });
      seen.add(target.name);
    }
  }

  // 3. Check future delegation — "I'll ping Elena", "Let me loop in James"
  for (const match of responseText.matchAll(patterns.future)) {
    const target = findByName(match[1]);
    if (target && !seen.has(target.name) && target.name !== agentName) {
      const afterName = responseText.slice(match.index + match[0].length, match.index + match[0].length + 200).trim();
      const context = afterName || originalMessage?.slice(0, 300) || '';
      handoffs.push({ target, message: context, signal: 'future-delegation', confidence: 0.8 });
      seen.add(target.name);
    }
  }

  // 4. Check past delegation — "Pinged Elena", "Told James"
  for (const match of responseText.matchAll(patterns.past)) {
    const target = findByName(match[1]);
    if (target && !seen.has(target.name) && target.name !== agentName) {
      handoffs.push({
        target,
        message: originalMessage?.slice(0, 300) || 'Follow up from conversation',
        signal: 'past-delegation',
        confidence: 0.7,
      });
      seen.add(target.name);
    }
  }

  // 5. Check referral patterns — "that's Elena's area"
  for (const pattern of REFERRAL_PATTERNS) {
    const refMatch = pattern.exec(responseText);
    if (refMatch) {
      const targetName = refMatch[1];
      const target = findByName(targetName);
      if (target && !seen.has(target.name) && target.name !== agentName) {
        handoffs.push({
          target,
          message: originalMessage?.slice(0, 300) || 'Referred from conversation',
          signal: 'referral',
          confidence: 0.6,
        });
        seen.add(target.name);
      }
    }
  }

  // Filter by handoff allowlist
  return handoffs.filter((h) => {
    const permitted = HANDOFF_RULES[agentName] || [];
    if (!permitted.includes(h.target.name)) {
      console.log(`[Handoff] Blocked: ${agentName} → ${h.target.name} (not in allowlist)`);
      return false;
    }
    return true;
  });
}

// Strip explicit HANDOFF: lines from the visible response
export function stripExplicitHandoffs(text) {
  if (!text) return text;
  return text.replace(/^HANDOFF:\s*\w+\s*[—-]\s*.+$/gim, '').trim();
}

// Build a contextual message for the target agent
export function buildHandoffMessage(fromAgent, _toAgent, signal, message, originalMessage) {
  const parts = [`${fromAgent} (via conversation with Noel) needs you:`];

  if (message) {
    parts.push(`\n"${message.slice(0, 500)}"`);
  }

  if (originalMessage && signal !== 'explicit') {
    parts.push(`\nOriginal request from Noel: "${originalMessage.slice(0, 300)}"`);
  }

  parts.push('\nRespond directly — your reply goes back to the conversation.');

  return parts.join('');
}
