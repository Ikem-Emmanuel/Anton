// Task state machine — pure transition function with authority enforcement.
//
// States form a directed graph:
//
//   planned
//     → needs-clarification  (ASK fired)
//     → pending-approval     (design needs tech-lead sign-off)
//     → in-progress          (APPROVE or direct assignment)
//     → needs-review         (DONE from dev)
//     → in-review            (QA picked it up)
//       → verified           (APPROVE from QA)
//       → needs-fix          (REJECT from QA) → needs-retest → in-review (cycle, cap 3)
//     → verified → done
//
//   any → blocked → escalated → in-progress (after human resolves)
//
// Authority rules live in the transition table. The orchestrator passes the
// emitting agent + a context object (isQA, isTechLead) so the pure function
// can enforce who is allowed to trigger each transition without pulling in
// a persona module.

export type TaskState =
  | 'planned'
  | 'needs-clarification'
  | 'pending-approval'
  | 'in-progress'
  | 'needs-review'
  | 'in-review'
  | 'needs-fix'
  | 'needs-retest'
  | 'verified'
  | 'done'
  | 'blocked'
  | 'escalated';

export type TaskEvent =
  | 'ASSIGN' // orchestrator assigns a task
  | 'ASK' // agent asks another agent
  | 'ANSWER' // ASK resolved
  | 'REQUEST_APPROVAL' // dev asks tech lead to sign off
  | 'APPROVE' // tech lead signs off OR QA verifies
  | 'REJECT' // tech lead rejects OR QA finds bug
  | 'DONE' // dev reports completion
  | 'REVIEW_START' // QA picks up for review
  | 'BLOCK' // agent blocked
  | 'ESCALATE' // orchestrator escalates after retry exhaustion or timeout
  | 'UNBLOCK' // human resolves a block
  | 'COMPLETE'; // move verified → done

export interface AgentContext {
  agent: string;
  isQA?: boolean;
  isTechLead?: boolean;
  isOrchestrator?: boolean;
  isHuman?: boolean;
}

export interface TransitionOptions {
  retryCount?: number;
  maxRetry?: number;
  hopCount?: number;
  maxHop?: number;
}

export interface TransitionResult {
  ok: boolean;
  newState?: TaskState;
  error?: string;
  shouldIncrementRetry?: boolean;
  shouldIncrementHop?: boolean;
  shouldEscalate?: boolean;
}

const DEFAULT_MAX_RETRY = 3;
const DEFAULT_MAX_HOP = 20;

// Transition table: for a given (from, event, authority check), what's the new state?
// If authority check fails, result.ok = false with an explanation.
export function transition(
  from: TaskState,
  event: TaskEvent,
  by: AgentContext,
  opts?: TransitionOptions
): TransitionResult {
  const maxRetry = opts?.maxRetry ?? DEFAULT_MAX_RETRY;
  const maxHop = opts?.maxHop ?? DEFAULT_MAX_HOP;
  const retryCount = opts?.retryCount ?? 0;
  const hopCount = opts?.hopCount ?? 0;

  // Hard hop cap — auto-escalate regardless of from-state.
  if (hopCount >= maxHop && from !== 'escalated' && from !== 'done') {
    return {
      ok: true,
      newState: 'escalated',
      shouldEscalate: true,
    };
  }

  // Universal BLOCK transition from any active state.
  if (event === 'BLOCK') {
    if (from === 'done' || from === 'blocked' || from === 'escalated') {
      return { ok: false, error: `cannot BLOCK from terminal state ${from}` };
    }
    return { ok: true, newState: 'blocked', shouldIncrementHop: true };
  }

  // ESCALATE — only orchestrator or when block is unresolved.
  if (event === 'ESCALATE') {
    if (!by.isOrchestrator && !by.isHuman) {
      return { ok: false, error: `only orchestrator can ESCALATE (got ${by.agent})` };
    }
    return { ok: true, newState: 'escalated', shouldEscalate: true };
  }

  // UNBLOCK — human-only.
  if (event === 'UNBLOCK') {
    if (!by.isHuman) {
      return { ok: false, error: `only Noel can UNBLOCK (got ${by.agent})` };
    }
    if (from !== 'blocked' && from !== 'escalated') {
      return { ok: false, error: `cannot UNBLOCK from ${from}` };
    }
    return { ok: true, newState: 'in-progress', shouldIncrementHop: true };
  }

  // ASSIGN — orchestrator only; from planned → in-progress.
  if (event === 'ASSIGN') {
    if (!by.isOrchestrator) {
      return { ok: false, error: `only orchestrator can ASSIGN (got ${by.agent})` };
    }
    if (from !== 'planned' && from !== 'needs-clarification') {
      return { ok: false, error: `cannot ASSIGN from ${from}` };
    }
    return { ok: true, newState: 'in-progress', shouldIncrementHop: true };
  }

  // ASK — dev asks another agent a clarifying question.
  if (event === 'ASK') {
    if (from !== 'in-progress' && from !== 'planned') {
      return { ok: false, error: `cannot ASK from ${from}` };
    }
    return { ok: true, newState: 'needs-clarification', shouldIncrementHop: true };
  }

  // ANSWER — resumes from needs-clarification back to in-progress.
  if (event === 'ANSWER') {
    if (from !== 'needs-clarification') {
      return { ok: false, error: `cannot ANSWER when not in needs-clarification (was ${from})` };
    }
    return { ok: true, newState: 'in-progress', shouldIncrementHop: true };
  }

  // REQUEST_APPROVAL — dev sends design to tech lead before starting.
  if (event === 'REQUEST_APPROVAL') {
    if (from !== 'planned' && from !== 'in-progress') {
      return { ok: false, error: `cannot REQUEST_APPROVAL from ${from}` };
    }
    return { ok: true, newState: 'pending-approval', shouldIncrementHop: true };
  }

  // APPROVE — tech-lead approves design OR QA verifies output.
  if (event === 'APPROVE') {
    if (from === 'pending-approval') {
      if (!by.isTechLead && !by.isHuman) {
        return { ok: false, error: `only tech lead can APPROVE design (got ${by.agent})` };
      }
      return { ok: true, newState: 'in-progress', shouldIncrementHop: true };
    }
    if (from === 'in-review') {
      if (!by.isQA && !by.isHuman) {
        return { ok: false, error: `only QA can APPROVE review (got ${by.agent})` };
      }
      return { ok: true, newState: 'verified', shouldIncrementHop: true };
    }
    return { ok: false, error: `cannot APPROVE from ${from}` };
  }

  // REJECT — tech-lead rejects design OR QA finds bug.
  if (event === 'REJECT') {
    if (from === 'pending-approval') {
      if (!by.isTechLead && !by.isHuman) {
        return { ok: false, error: `only tech lead can REJECT design (got ${by.agent})` };
      }
      return { ok: true, newState: 'needs-clarification', shouldIncrementHop: true };
    }
    if (from === 'in-review') {
      if (!by.isQA && !by.isHuman) {
        return { ok: false, error: `only QA can REJECT review (got ${by.agent})` };
      }
      // Check retry cap BEFORE transitioning to needs-fix.
      if (retryCount + 1 >= maxRetry) {
        return {
          ok: true,
          newState: 'escalated',
          shouldIncrementRetry: true,
          shouldIncrementHop: true,
          shouldEscalate: true,
        };
      }
      return {
        ok: true,
        newState: 'needs-fix',
        shouldIncrementRetry: true,
        shouldIncrementHop: true,
      };
    }
    return { ok: false, error: `cannot REJECT from ${from}` };
  }

  // DONE — dev reports completion.
  if (event === 'DONE') {
    if (from === 'in-progress') {
      return { ok: true, newState: 'needs-review', shouldIncrementHop: true };
    }
    if (from === 'needs-fix') {
      return { ok: true, newState: 'needs-retest', shouldIncrementHop: true };
    }
    return { ok: false, error: `cannot DONE from ${from}` };
  }

  // REVIEW_START — QA picks up for review.
  if (event === 'REVIEW_START') {
    if (!by.isQA && !by.isHuman) {
      return { ok: false, error: `only QA can REVIEW_START (got ${by.agent})` };
    }
    if (from !== 'needs-review' && from !== 'needs-retest') {
      return { ok: false, error: `cannot REVIEW_START from ${from}` };
    }
    return { ok: true, newState: 'in-review', shouldIncrementHop: true };
  }

  // COMPLETE — verified → done. Orchestrator only.
  if (event === 'COMPLETE') {
    if (!by.isOrchestrator && !by.isHuman) {
      return { ok: false, error: `only orchestrator can COMPLETE (got ${by.agent})` };
    }
    if (from !== 'verified') {
      return { ok: false, error: `cannot COMPLETE from ${from}` };
    }
    return { ok: true, newState: 'done' };
  }

  return { ok: false, error: `unknown event ${event} from ${from}` };
}

// Derive agent context from our 15-name persona list.
const QA_AGENTS = new Set(['Priya']);
const TECH_LEADS = new Set(['Marcus']);
const ORCHESTRATORS = new Set(['Anton']);

export function agentContext(agent: string, overrides?: Partial<AgentContext>): AgentContext {
  return {
    agent,
    isQA: QA_AGENTS.has(agent),
    isTechLead: TECH_LEADS.has(agent),
    isOrchestrator: ORCHESTRATORS.has(agent),
    isHuman: false,
    ...overrides,
  };
}
