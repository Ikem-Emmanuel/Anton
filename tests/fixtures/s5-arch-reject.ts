// Scenario S5 — "Tech Lead rejects architecture"
//
// Tests REJECT at pending-approval stage (distinct from S4 which tests
// REJECT at in-review). Sarah drafts, Marcus finds a layering violation,
// Sarah revises, Marcus then APPROVEs. Exercises the rejection feedback
// loop before development starts.

import type { SimFixture } from '../../src/brain/sim-mode.js';

export const s5ArchReject: SimFixture = {
  scenario: 'S5 — Tech Lead rejects architecture, Sarah revises, then approved',
  steps: [
    // 1. Anton delegates to Sarah
    {
      agent: 'Anton',
      matchInput: 'data export feature',
      response: {
        text: '[HANDOFF:Sarah] scope a data export feature: users download their data as JSON/CSV.',
        handledLocally: true,
      },
    },
    // 2. Sarah drafts — naive approach with layering issue
    {
      agent: 'Sarah',
      matchInput: 'scope a data export',
      response: {
        text: 'Drafted EXPORT-01. Plan: frontend queries the DB directly via a new SQL endpoint. 3 stories.',
        handoffs: [{ agent: 'Marcus', message: 'Review EXPORT-01 architecture.' }],
        handledLocally: true,
      },
    },
    // 3. Marcus REJECTs — layering violation
    {
      agent: 'Marcus',
      matchInput: 'Review EXPORT-01',
      response: {
        text: '[REJECT:EXPORT-01 direct DB access from frontend violates layering — must go through a service API that enforces auth + rate limits] Revise with a /api/export endpoint.',
        handoffs: [{ agent: 'Sarah', message: 'Revise EXPORT-01: add service API layer, no direct DB from frontend.' }],
        handledLocally: true,
      },
    },
    // 4. Sarah revises
    {
      agent: 'Sarah',
      matchInput: 'Revise EXPORT-01',
      response: {
        text: 'Revised EXPORT-01. New plan: POST /api/export with auth middleware, job-queued, results emailed. 4 stories now (added jobs infra).',
        handoffs: [{ agent: 'Marcus', message: 'Re-review EXPORT-01 with service API + job queue.' }],
        handledLocally: true,
      },
    },
    // 5. Marcus APPROVEs
    {
      agent: 'Marcus',
      matchInput: 'Re-review EXPORT-01',
      response: {
        text: '[APPROVE:EXPORT-01] Clean layering, good async pattern. Kick off dev.',
        handoffs: [
          { agent: 'James', message: 'Implement EXPORT-01: /api/export, auth middleware, job queue, email delivery.' },
        ],
        handledLocally: true,
      },
    },
  ],
};
