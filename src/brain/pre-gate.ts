// Deterministic pre-gate — decides routing without an LLM call.
// Runs BEFORE the classifier. If it returns skipClassifier:true, we skip the LLM pass entirely.
// Pure function, zero side effects, fast.

export type PreGateIntent = 'greeting' | 'approval' | 'system_command' | 'schedule' | 'question';

export type AdaptiveDepth = 'minimal' | 'standard' | 'detailed' | 'deep';

export interface RouteHint {
  skipClassifier: boolean;
  intent?: PreGateIntent;
  needsClaude?: boolean;
  forceLocal?: boolean;
  adaptiveDepth?: AdaptiveDepth;
  reason: string;
}

const CODE_BLOCK = /```[\s\S]+```/;
const APPROVAL_PATTERN =
  /^(yes|no|yeah|yep|nope|nah|ok(ay)?|approve(d)?|deny|denied|reject(ed)?|confirmed?|👍|👎|✅|❌)\.?$/iu;
const GREETING_PATTERN =
  /^(hey|hi|hello|yo|sup|gm|gn|good\s?morning|good\s?night|good\s?evening|good\s?afternoon|morning|evening|afternoon|night)[.,!?\s]*$/i;
const SCHEDULE_PATTERN =
  /^(schedule|remind(\s+me)?|notify(\s+me)?|at\s+\d|in\s+\d+\s*(min|mins|minute|minutes|hr|hour|hours|day|days))/i;
const SYS_CMD_PATTERN = /^(shutdown|restart|reboot|status|health|ping)\s*$/i;

const LONG_INPUT_CHAR_THRESHOLD = 1600; // ~400 tokens rule-of-thumb (4 chars/token)

export function preGate(message: string): RouteHint {
  const msg = message.trim();

  // 1. Override prefixes — highest priority
  if (msg.startsWith('@claude ') || msg.startsWith('@claude:')) {
    return { skipClassifier: true, needsClaude: true, reason: 'forced:@claude' };
  }
  if (msg.startsWith('@local ') || msg.startsWith('@local:')) {
    return { skipClassifier: true, forceLocal: true, reason: 'forced:@local' };
  }

  // 2. System commands
  if (SYS_CMD_PATTERN.test(msg)) {
    return {
      skipClassifier: true,
      intent: 'system_command',
      adaptiveDepth: 'minimal',
      reason: 'system-cmd',
    };
  }

  // 3. Code blocks → Claude handles code, always
  if (CODE_BLOCK.test(msg)) {
    return { skipClassifier: true, needsClaude: true, reason: 'code-block' };
  }

  // 4. Long inputs → likely complex, Claude handles long contexts better on Tier 1
  if (msg.length > LONG_INPUT_CHAR_THRESHOLD) {
    return { skipClassifier: true, needsClaude: true, reason: 'long-input' };
  }

  // 5. Schedule — keep local but mark intent
  if (SCHEDULE_PATTERN.test(msg)) {
    return {
      skipClassifier: true,
      intent: 'schedule',
      adaptiveDepth: 'standard',
      reason: 'schedule',
    };
  }

  // 6. Approvals — minimal depth, no thinking needed
  if (APPROVAL_PATTERN.test(msg)) {
    return {
      skipClassifier: true,
      intent: 'approval',
      adaptiveDepth: 'minimal',
      reason: 'approval',
    };
  }

  // 7. Greetings — minimal depth, instant response
  if (GREETING_PATTERN.test(msg)) {
    return {
      skipClassifier: true,
      intent: 'greeting',
      adaptiveDepth: 'minimal',
      reason: 'greeting',
    };
  }

  // 8. Default: defer to classifier
  return { skipClassifier: false, reason: 'classify' };
}
