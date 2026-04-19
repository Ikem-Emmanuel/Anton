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
  'flag to',
  'get .* input',
  'get .* take',
  'check with',
  // Action verbs
  'hit up',
  'grab',
  'rope in',
  'pull in',
  'sync with',
  'connect with',
  'touch base with',
  'circle back with',
  'run (?:it |this )?by',
  'talk to',
  'chat with',
  'speak (?:with|to)',
  'shoot .* a (?:message|ping|dm|note)',
  'drop .* a (?:line|message|note|dm)',
  'put .* on',
  'get .* on',
  'assign (?:this )?to',
  'hand (?:this )?(?:off )?to',
  'kick (?:(?:it|this) )?over to',
  'throw (?:(?:it|this) )?to',
  'toss (?:(?:it|this) )?to',
  'bounce (?:(?:it|this) )?to',
  'bump to',
  'escalate to',
  'route to',
  'surface to',
  'raise with',
  'share with',
  'copy .* in',
  'include',
  'involve',
  'tag .* in',
  'have .* (?:look at|review|check|take a look)',
  'get .* (?:to|eyes on)',
  'bring .* (?:up to speed|into the loop)',
  'keep .* in the loop',
  'follow up with',
  'align with',
  'coordinate with',
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
  // Extended past forms
  'hit up',
  'grabbed',
  'roped in',
  'pulled in',
  'tagged in',
  'synced with',
  'connected with',
  'bumped to',
  'escalated to',
  'kicked (?:it )?over to',
  'tossed to',
  'bounced to',
  'ran (?:it )?by',
  'shared with',
  'assigned to',
  'handed (?:off )?to',
  'routed to',
  'surfaced to',
  'raised with',
  'flagged to',
  'copied in',
  'alerted',
  'informed',
  'updated',
  'briefed',
  'gave .* a (?:heads.?up|ping)',
  'dropped .* a (?:line|message|note|dm)',
  'shot .* a (?:message|ping)',
];

// Referral patterns — "that's Elena's area", "James would know"
const REFERRAL_PATTERNS = [
  // Territory / ownership
  /that'?s\s+(\w+)'?s?\s+(?:area|domain|wheelhouse|territory|specialty|expertise|lane|purview|thing|call)/i,
  /this\s+(?:is|falls\s+(?:under|into))\s+(\w+)'?s?\s+(?:area|domain|lane|remit|purview)/i,
  /(\w+)\s+(?:owns|handles|manages|leads|runs)\s+(?:this|that|the\s+\w+)/i,
  // Capability
  /(\w+)\s+would\s+(know|handle|be better|be the right|have better|have more)/i,
  /(\w+)\s+(?:is|'s)\s+(?:the\s+)?(?:right\s+(?:person|one)|owner|go.?to|expert|specialist)\s+(?:for|on|here)/i,
  /(\w+)\s+(should|can|could)\s+(handle|look at|review|help|take|weigh in|sign off|approve)/i,
  /better\s+suited?\s+for\s+(\w+)/i,
  // Routing
  /routing\s+(?:this\s+)?to\s+(\w+)/i,
  /passing\s+(?:this\s+)?to\s+(\w+)/i,
  /defer(?:ring)?\s+(?:this\s+)?to\s+(\w+)/i,
  /handing\s+(?:this\s+)?(?:off\s+)?to\s+(\w+)/i,
  /kicking\s+(?:this\s+)?(?:over\s+)?to\s+(\w+)/i,
  // Implicit need
  /(?:sounds?|seems?)\s+like\s+(?:one\s+for|a\s+job\s+for|something\s+for)\s+(\w+)/i,
  /(?:sounds?|seems?|looks?)\s+like\s+a\s+(\w+)\s+(?:thing|question|call|decision)/i,
  /(\w+)'?s?\s+(?:sign.?off|approval|input|eyes|review)\s+(?:is|are|would be)\s+(?:needed|required)/i,
  /need\s+(\w+)'?s?\s+(?:eyes|input|thoughts|sign.?off|approval)\s+(?:on|here|before)/i,
  /(\w+)\s+needs?\s+to\s+(?:see|know about|be aware of|review|weigh in on)\s+(?:this|that|it)/i,
  /(?:this|that|it)\s+(?:needs?\s+to|should)\s+go\s+(?:through|to)\s+(\w+)/i,
  /we\s+need\s+(\w+)\s+(?:on\s+(?:this|it)|here|involved)/i,
  /(\w+)'?s?\s+(?:expertise|background|experience)\s+(?:would|could)\s+(?:help|be\s+(?:useful|valuable|needed))/i,
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
