// Scenario S4 — "QA retry exhaustion"
//
// Exercises the retry-count cap on the state machine. QA rejects the dev's
// output three times in a row; on the third rejection, the orchestrator must
// escalate to Noel instead of routing back to the dev for a 4th attempt.

import type { SimFixture } from '../../src/brain/sim-mode.js';

export const s4QaRetryLimit: SimFixture = {
  scenario: 'S4 — QA retry exhaustion (retry_count → escalate)',
  steps: [
    // 1. Anton delegates feature to James
    {
      agent: 'Anton',
      matchInput: 'ship feature',
      response: {
        text: '[HANDOFF:James] ship the profile avatar feature: upload, crop, save to CDN.',
        handledLocally: true,
      },
    },
    // 2. James first DONE
    {
      agent: 'James',
      matchInput: 'profile avatar',
      response: {
        text: '[DONE: avatar upload + crop + CDN save implemented, tests passing]',
        handledLocally: true,
      },
    },
    // 3. Priya REJECT #1
    {
      agent: 'Priya',
      matchInput: 'avatar upload',
      response: {
        text: '[REJECT: uploaded avatars larger than 5MB crash the crop step — no size validation]',
        handledLocally: true,
      },
    },
    // 4. James fix #1
    {
      agent: 'James',
      matchInput: '5MB',
      response: {
        text: '[DONE: added 5MB size limit + friendly error toast on frontend]',
        handledLocally: true,
      },
    },
    // 5. Priya REJECT #2
    {
      agent: 'Priya',
      matchInput: 'size limit',
      response: {
        text: '[REJECT: CDN URL is not signed — any user can fetch any avatar including deleted ones]',
        handledLocally: true,
      },
    },
    // 6. James fix #2
    {
      agent: 'James',
      matchInput: 'CDN URL',
      response: {
        text: '[DONE: switched to signed CDN URLs with 1-hour expiry + server-side revocation on delete]',
        handledLocally: true,
      },
    },
    // 7. Priya REJECT #3 — retry cap hit, should escalate
    {
      agent: 'Priya',
      matchInput: 'signed CDN',
      response: {
        text: '[REJECT: race condition between avatar delete and cache invalidation — stale signed URLs keep working after delete]',
        handledLocally: true,
      },
    },
    // 8. Anton escalates to Noel
    {
      agent: 'Anton',
      matchInput: 'escalate',
      response: {
        text: 'James hit the QA retry cap (3 bounces) on the avatar feature. Pattern: each fix creates a new issue in an adjacent layer. Recommending we scope this to 3 smaller tasks (upload, CDN, cache) before continuing. Escalating to Noel for direction.',
        handledLocally: true,
      },
    },
  ],
};
