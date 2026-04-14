// ---- Three-Tier Trust Model ----------------------------------------------
// Classifies actions into tiers that determine execution behavior:
//
//   TIER 1 — AUTO: Execute immediately, log it, report to Noel after.
//   TIER 2 — ANTON DECIDES: Evaluate deterministic criteria. Execute if met, escalate if not.
//   TIER 3 — NOEL APPROVES: Must get explicit human sign-off before any action.
//
// Rule-based for known actions (fast, no LLM cost).
// Unknown actions default to TIER 3 (safe).
//
// Usage:
//   import { classifyTier, getTierLabel, TIER } from './trust.js';
//   const tier = classifyTier('pm2:restart');  // => 1
//   const label = getTierLabel(1);              // => 'AUTO'

export const TIER = { AUTO: 1, ANTON_DECIDES: 2, NOEL_APPROVES: 3 };

// ---- Tier 1: Auto-execute (low risk, easily reversible) ----
const TIER1_ACTIONS = new Set([
  // Process management (read + restart)
  'pm2:status',
  'pm2:logs:read',
  'pm2:restart',
  'pm2:reload',

  // Messaging
  'slack:message:send',
  'slack:reaction:add',
  'slack:dm:send',

  // Task management (create, update — not delete)
  'asana:task:create',
  'asana:task:update:status',
  'asana:comment:add',

  // Code (read-only + branch + commit + PR creation)
  'git:status',
  'git:log',
  'git:branch:create',
  'git:commit',
  'git:push:feature',
  'git:pr:create',

  // Testing and building
  'tests:run',
  'lint:run',
  'build:run',

  // Observability
  'analytics:read',
  'logs:read',
  'health:check',
  'briefing:send',

  // Agent operations
  'agent:session:create',
  'agent:session:resume',
  'agent:handoff',
]);

// ---- Tier 2: Anton evaluates criteria, executes if met ----
const TIER2_ACTIONS = new Set([
  // Git operations (higher impact but reversible)
  'git:pr:merge',
  'git:branch:delete:feature',

  // Deployment (non-production)
  'deploy:staging',
  'deploy:preview',

  // Process scaling
  'pm2:scale',
  'pm2:stop',

  // External communication (template-based, no PII)
  'email:send:internal',
  'notification:external',

  // Task lifecycle
  'asana:task:close',
  'asana:sprint:archive',

  // Dependency management
  'npm:install:patch',
  'npm:update:minor',
]);

// ---- Tier 3: Noel must approve (irreversible, high impact) ----
const TIER3_ACTIONS = new Set([
  // Production
  'deploy:production',
  'database:migrate:production',
  'database:delete',
  'database:seed:production',

  // Destructive git
  'git:force-push',
  'git:branch:delete:main',
  'git:rewrite-history',
  'git:pr:merge:main',

  // Access and security
  'permission:change',
  'api-key:rotate',
  'secrets:modify',
  'env:production:write',

  // Financial
  'purchase:any',
  'billing:change',
  'expense:approve',

  // Process destruction
  'pm2:kill',
  'pm2:delete',

  // External (user-facing)
  'email:send:external',
  'social:post',
  'calendar:event:create',

  // Self-modification
  'trust:tier:modify',
  'monitoring:disable',
  'approval:gate:bypass',
]);

// ---- Tier 2 Criteria (deterministic checks, NOT LLM-judged) ----
const TIER2_CRITERIA = {
  'git:pr:merge': (context) => {
    return (
      context.checksPass === true && context.approvals >= 1 && context.base !== 'main' && context.mergeable === true
    );
  },

  'deploy:staging': (context) => {
    return context.testsPass === true && context.lintPass === true;
  },

  'pm2:scale': (context) => {
    const { current, requested } = context;
    return requested <= current * 2 && requested <= 16;
  },

  'pm2:stop': (context) => {
    return context.healthCheckFailing === true && context.restartAttempted === true;
  },

  'git:branch:delete:feature': (context) => {
    return context.merged === true && context.branch !== 'main';
  },

  'npm:install:patch': (context) => {
    return context.semverChange === 'patch';
  },

  'npm:update:minor': (context) => {
    return context.semverChange === 'minor' && context.testsPass === true;
  },
};

// ---- Classification ----

export function classifyTier(actionType) {
  if (TIER1_ACTIONS.has(actionType)) return TIER.AUTO;
  if (TIER2_ACTIONS.has(actionType)) return TIER.ANTON_DECIDES;
  if (TIER3_ACTIONS.has(actionType)) return TIER.NOEL_APPROVES;
  // Unknown actions default to TIER 3 (safe)
  return TIER.NOEL_APPROVES;
}

export function getTierLabel(tier) {
  switch (tier) {
    case TIER.AUTO:
      return 'AUTO';
    case TIER.ANTON_DECIDES:
      return 'ANTON_DECIDES';
    case TIER.NOEL_APPROVES:
      return 'NOEL_APPROVES';
    default:
      return 'UNKNOWN';
  }
}

// Check Tier 2 criteria. Returns { approved, reason }.
export function evaluateTier2(actionType, context = {}) {
  const criteria = TIER2_CRITERIA[actionType];
  if (!criteria) {
    return { approved: false, reason: 'No criteria defined — escalating to Tier 3' };
  }

  try {
    const met = criteria(context);
    if (met) {
      return { approved: true, reason: 'Criteria met' };
    }
    return { approved: false, reason: 'Criteria not met — escalating to Tier 3' };
  } catch (e) {
    return { approved: false, reason: `Criteria check failed: ${e.message}` };
  }
}

// Full classification with execution decision
export function classifyAction(actionType, context = {}) {
  const tier = classifyTier(actionType);
  const label = getTierLabel(tier);

  if (tier === TIER.AUTO) {
    return { tier, label, execute: true, reason: 'Auto-execute (Tier 1)' };
  }

  if (tier === TIER.ANTON_DECIDES) {
    const { approved, reason } = evaluateTier2(actionType, context);
    if (approved) {
      return { tier, label, execute: true, reason: `Anton approved: ${reason}` };
    }
    // Escalate to Tier 3
    return { tier: TIER.NOEL_APPROVES, label: 'NOEL_APPROVES', execute: false, reason: `Escalated: ${reason}` };
  }

  // Tier 3
  return { tier, label, execute: false, reason: 'Requires Noel approval' };
}

// Get all action definitions (for status display)
export function getAllActions() {
  return {
    tier1: [...TIER1_ACTIONS],
    tier2: [...TIER2_ACTIONS],
    tier3: [...TIER3_ACTIONS],
  };
}
