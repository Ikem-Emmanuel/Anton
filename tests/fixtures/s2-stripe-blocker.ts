// Scenario S2 — "Add Stripe payment" (blocker escalation)
//
// Exercises the BLOCK / UNBLOCK cycle: a developer hits an external dependency
// they can't resolve, emits [BLOCK: reason], Anton escalates to Noel, Noel
// provides the resolution, and the developer resumes work.

import type { SimFixture } from '../../src/brain/sim-mode.js';

export const s2StripeBlocker: SimFixture = {
  scenario: 'S2 — Stripe blocker escalation',
  steps: [
    // 1. Noel → Anton kicks off ticket
    {
      agent: 'Anton',
      matchInput: 'Stripe',
      response: {
        text: 'On it. [HANDOFF:Sarah] draft Stripe payment ticket for Sprint 9.',
        handledLocally: true,
      },
    },
    // 2. Sarah drafts, hands to Marcus
    {
      agent: 'Sarah',
      matchInput: 'Stripe payment ticket',
      response: {
        text: 'Ticket drafted: PAYMENT-01, scope is Stripe checkout + webhook + refund flow. [HANDOFF:Marcus] review Stripe integration scope.',
        handledLocally: true,
      },
    },
    // 3. Marcus approves scope, hands to James
    {
      agent: 'Marcus',
      matchInput: 'Stripe integration scope',
      response: {
        text: '[APPROVE:PAYMENT-01] Scope is tight. Use Stripe SDK v14, webhook signing required. [HANDOFF:James] implement PAYMENT-01.',
        handledLocally: true,
      },
    },
    // 4. James hits a blocker — no Stripe creds
    {
      agent: 'James',
      matchInput: 'implement PAYMENT-01',
      response: {
        text: 'Started on Stripe integration. [BLOCK: missing STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in .env — need credentials from Noel to proceed]',
        handledLocally: true,
      },
    },
    // 5. Anton escalates to Noel (one hop for DM)
    {
      agent: 'Anton',
      matchInput: 'escalate',
      response: {
        text: 'James is blocked on Stripe — needs STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET. DMing Noel now.',
        handledLocally: true,
      },
    },
    // 6. Noel unblocks via UNBLOCK event (in a real run this would be a human reply)
    {
      agent: 'Anton',
      matchInput: 'credentials provided',
      response: {
        text: 'Credentials received. [HANDOFF:James] resume PAYMENT-01, creds are in .env.',
        handledLocally: true,
      },
    },
    // 7. James resumes and completes
    {
      agent: 'James',
      matchInput: 'resume PAYMENT-01',
      response: {
        text: '[DONE: Stripe checkout + webhook + refund flow committed on feature/payment. Webhook signature verified on local test harness.] Ready for review.',
        handledLocally: true,
      },
    },
  ],
};
