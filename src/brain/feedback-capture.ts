// Implicit feedback capture (Phase 3.5 §4.5.3).
//
// When Noel sends his next message after an agent response, we infer whether
// he accepted the output ("yes", "ship it", "thanks"), corrected it ("no",
// "actually", significant rewording of prior content), or the signal is
// ambiguous. This writes `implicit_signal` onto the prior turn's
// turn_evaluations row — composes with §4.5.2's explicit verdict.
//
// Three-stage pipeline:
//   1. Explicit keyword patterns (fast path)
//   2. Edit-distance / token-overlap against the prior agent text
//   3. Default to ambiguous (don't invent signal on uncertain inputs)

export type ImplicitSignal = 'accepted' | 'corrected' | 'ambiguous';

// Emoji-first so `\b` doesn't strand them. Match anywhere in the message head.
const ACCEPT_EMOJI = /(👍|✅|💯|🙌)/u;
const CORRECT_EMOJI = /(👎|❌)/u;

const ACCEPT_PATTERNS = [
  /\b(yes|yep|yeah|yup|sure|ok(ay)?|perfect|great|nice|done|ship|ship it|go|do it|proceed|approved?)\b/i,
  /\b(thanks?|thank you|ty|tysm|appreciated|good\s*(work|job|stuff|call))\b/i,
  /\b(that'?s?\s*(right|correct|the|good|great|perfect|it))\b/i,
  /\blove (it|that)\b/i,
];

const CORRECT_PATTERNS = [
  /\b(no|nope|nah|wrong|incorrect|not (quite|right|it|that)|actually,?|not really)\b/i,
  /\b(redo|try again|that'?s not|should be|more like|different|instead|rather)\b/i,
  /\b(fix|correct|change|update|reword|rewrite|re-?do)\s*(this|that|it)?\b/i,
  /\bnot what i (meant|said|asked|wanted)\b/i,
];

// Normalize for edit-distance comparison.
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\[(HANDOFF|ASK|BLOCK|APPROVE|REJECT|DONE)[^\]]*\]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(s: string): Set<string> {
  return new Set(
    normalize(s)
      .split(/\s+/)
      .filter((t) => t.length > 3)
  );
}

// Jaccard-ish overlap — 0 = no shared tokens, 1 = identical token set
function tokenOverlap(a: string, b: string): number {
  const sa = tokenSet(a);
  const sb = tokenSet(b);
  if (sa.size === 0 || sb.size === 0) return 0;
  let shared = 0;
  for (const t of sa) if (sb.has(t)) shared++;
  return shared / Math.min(sa.size, sb.size);
}

export function captureImplicitFeedback(priorAgentText: string, currentUserText: string): ImplicitSignal {
  const current = currentUserText.trim();
  if (!current) return 'ambiguous';

  // Stage 1 — explicit patterns on the current message (emoji first)
  const firstSentence = current.slice(0, 200);
  if (ACCEPT_EMOJI.test(firstSentence)) return 'accepted';
  if (CORRECT_EMOJI.test(firstSentence)) return 'corrected';
  for (const pat of ACCEPT_PATTERNS) {
    if (pat.test(firstSentence)) return 'accepted';
  }
  for (const pat of CORRECT_PATTERNS) {
    if (pat.test(firstSentence)) return 'corrected';
  }

  // Stage 2 — token overlap. A user reply that restates ≥40% of the agent's
  // tokens while adding negation is likely a correction. Very short replies
  // with no overlap are likely a follow-up topic, which is ambiguous.
  const overlap = tokenOverlap(priorAgentText, current);
  if (overlap > 0.4) {
    // Significant quoting — check if it's framed as contradiction
    if (/\b(but|however|actually|not|rather|instead)\b/i.test(current)) {
      return 'corrected';
    }
  }

  // Stage 3 — default to ambiguous rather than invent a signal
  return 'ambiguous';
}
