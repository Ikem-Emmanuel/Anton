// Scenario S8 — "Hallucinated agent name rejected"
//
// Agent attempts HANDOFF and ASK to teammates that don't exist ("Dave",
// "Rachel"). The validator drops these before they can dispatch, while
// legitimate handoffs still fire. Tests the TEAM_NAMES allowlist.

import type { SimFixture } from '../../src/brain/sim-mode.js';

export const s8HallucinatedAgent: SimFixture = {
  scenario: 'S8 — Hallucinated agent name rejected, valid handoffs still fire',
  steps: [
    // 1. Agent emits a mix of invalid (Dave, Rachel) and valid (Marcus) handoffs
    {
      agent: 'Anton',
      matchInput: 'architecture review',
      response: {
        text: 'Routing this. [HANDOFF:Dave] please help. [HANDOFF:Marcus] review the auth scope. [ASK:Rachel] any thoughts?',
        handledLocally: true,
      },
    },
    // 2. Only Marcus should receive a handoff; Dave and Rachel are dropped
    {
      agent: 'Marcus',
      matchInput: 'review the auth scope',
      response: {
        text: '[APPROVE:AUTH-01] scope looks good, proceed.',
        handledLocally: true,
      },
    },
  ],
};
