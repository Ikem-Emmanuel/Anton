// Agent action tags — the vocabulary agents use to emit structured work signals.
//
// HANDOFF:Name   — delegate a sub-task to another agent
// ASK:Name       — ask another agent a clarifying question mid-task (suspense)
// BLOCK:reason   — cannot proceed, escalate to Noel
// APPROVE:taskId — tech-lead signs off on architecture / QA signs off on output
// REJECT:taskId  — tech-lead rejects design / QA found a bug; requires reason
// DONE:summary   — agent reports task completion with structured summary
//
// Parsing is strict: only these 6 tag names, only the exact bracket form, no
// whitespace inside the tag head. Agents that want to use these tags are
// prompted explicitly on the syntax.

export type ActionType = 'HANDOFF' | 'ASK' | 'BLOCK' | 'APPROVE' | 'REJECT' | 'DONE';

export interface AgentAction {
  type: ActionType;
  target?: string; // HANDOFF/ASK/APPROVE/REJECT: agent name or task id; BLOCK/DONE: undefined
  content: string; // the payload text after the tag
}

// Regex accepts `[TAG:target] content` or `[TAG: content]` (no target).
// Target must be alphanumeric or have a hyphen (e.g., TASK-001).
const ACTION_REGEX = /\[(HANDOFF|ASK|BLOCK|APPROVE|REJECT|DONE)(?::\s*([A-Za-z][\w-]*))?\s*([^\]]*)?\]/g;

// BLOCK and DONE never take a target — everything after the colon is content.
const TARGETLESS_TAGS = new Set<ActionType>(['BLOCK', 'DONE']);

// APPROVE/REJECT targets are task IDs (e.g. TASK-001, PAYMENT-01) — they must
// contain a hyphen or digit. If they don't, the captured word is actually the
// first word of the reason/content, so demote it.
const TASK_ID_PATTERN = /[-\d]/;

export function extractAgentActions(text: string): AgentAction[] {
  const actions: AgentAction[] = [];
  let match: RegExpExecArray | null;
  // reset regex state (global)
  ACTION_REGEX.lastIndex = 0;

  while ((match = ACTION_REGEX.exec(text)) !== null) {
    const type = match[1] as ActionType;
    let target = match[2]?.trim() || undefined;
    let inlineBody = match[3]?.trim() || '';

    // BLOCK and DONE never take a target. If the regex captured something as
    // target (i.e. first word after colon), demote it back into content.
    if (TARGETLESS_TAGS.has(type) && target) {
      inlineBody = inlineBody ? `${target} ${inlineBody}` : target;
      target = undefined;
    }

    // APPROVE/REJECT: target must look like a task ID to be kept.
    if ((type === 'APPROVE' || type === 'REJECT') && target && !TASK_ID_PATTERN.test(target)) {
      inlineBody = inlineBody ? `${target} ${inlineBody}` : target;
      target = undefined;
    }

    // Content = inline body (before the close bracket) + whatever follows the tag up to the
    // next tag or newline. This gives agents flexibility: [DONE: summary] OR [DONE] summary.
    const afterEnd = match.index + match[0].length;
    const nextTagStart = findNextTagStart(text, afterEnd);
    const trailing = text.slice(afterEnd, nextTagStart).trim();

    const content = [inlineBody, trailing].filter(Boolean).join(' ').trim();

    actions.push({ type, target, content });
  }

  return actions;
}

function findNextTagStart(text: string, from: number): number {
  const remainder = text.slice(from);
  const m = remainder.match(/\[(HANDOFF|ASK|BLOCK|APPROVE|REJECT|DONE)\b/);
  return m?.index !== undefined ? from + m.index : text.length;
}

// Strip all action tags + their inline body from response text. Used before
// displaying the text to Noel — the tags are metadata for the orchestrator.
const TAG_STRIP_REGEX = /\[(HANDOFF|ASK|BLOCK|APPROVE|REJECT|DONE)(?::\s*[A-Za-z][\w-]*)?\s*[^\]]*\]\s*/g;

export function stripActionTags(text: string): string {
  return text
    .replace(TAG_STRIP_REGEX, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Partition actions by type for convenient consumer use.
export function groupActions(actions: AgentAction[]): {
  handoffs: AgentAction[];
  asks: AgentAction[];
  blocks: AgentAction[];
  approvals: AgentAction[];
  rejects: AgentAction[];
  dones: AgentAction[];
} {
  return {
    handoffs: actions.filter((a) => a.type === 'HANDOFF'),
    asks: actions.filter((a) => a.type === 'ASK'),
    blocks: actions.filter((a) => a.type === 'BLOCK'),
    approvals: actions.filter((a) => a.type === 'APPROVE'),
    rejects: actions.filter((a) => a.type === 'REJECT'),
    dones: actions.filter((a) => a.type === 'DONE'),
  };
}
