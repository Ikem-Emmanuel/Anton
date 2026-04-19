// Scenario S3 — "Sprint parallel tracks"
//
// Two agents (James backend, Elena frontend) work in parallel on the same
// sprint. Priya (QA) has a dependency on both completing before she reviews.
// Tests: parallel track coordination, merged review gate, cross-department
// delegation within a single sprint.

import type { SimFixture } from '../../src/brain/sim-mode.js';

export const s3SprintParallel: SimFixture = {
  scenario: 'S3 — Sprint parallel tracks (James + Elena in parallel, Priya waits for both)',
  steps: [
    // 1. Anton kicks off — parallel fan-out
    {
      agent: 'Anton',
      matchInput: 'dashboard feature',
      response: {
        text: 'Parallel sprint split. [HANDOFF:James] backend for dashboard: metrics API + websocket. [HANDOFF:Elena] frontend: chart components + live updates.',
        handledLocally: true,
      },
    },
    // 2. James starts backend
    {
      agent: 'James',
      matchInput: 'backend for dashboard',
      response: {
        text: 'Starting metrics API and websocket. Expected in 2 days.',
        handledLocally: true,
      },
    },
    // 3. Elena starts frontend (parallel)
    {
      agent: 'Elena',
      matchInput: 'frontend',
      response: {
        text: 'Starting chart components. Will wait for James API contract before wiring live updates.',
        handoffs: [{ agent: 'James', message: 'Share the websocket event schema when ready.' }],
        handledLocally: true,
      },
    },
    // 4. James answers Elena's dependency question
    {
      agent: 'James',
      matchInput: 'websocket event schema',
      response: {
        text: "Schema: {type: 'metric_update', metric: string, value: number, ts: ISO8601}. Matches the REST endpoint output exactly.",
        handledLocally: true,
      },
    },
    // 5. James DONE
    {
      agent: 'James',
      matchInput: 'finish backend',
      response: {
        text: '[DONE: metrics API + websocket committed on feature/dashboard-api, 12 unit tests passing] Ready for QA.',
        handoffs: [{ agent: 'Priya', message: 'Backend ready for QA review on feature/dashboard-api.' }],
        handledLocally: true,
      },
    },
    // 6. Elena DONE
    {
      agent: 'Elena',
      matchInput: 'finish frontend',
      response: {
        text: '[DONE: chart components + live websocket updates working on feature/dashboard-ui] Storybook updated.',
        handoffs: [{ agent: 'Priya', message: 'Frontend ready for QA review on feature/dashboard-ui.' }],
        handledLocally: true,
      },
    },
    // 7. Priya reviews both (single pass since they're paired)
    {
      agent: 'Priya',
      matchInput: 'QA review',
      response: {
        text: '[APPROVE:DASH-01] Both tracks pass: backend E2E tests green, frontend a11y + cross-browser green. Ready to deploy.',
        handoffs: [{ agent: 'Omar', message: 'Dashboard feature verified. Deploy to staging.' }],
        handledLocally: true,
      },
    },
    // 8. Omar deploys
    {
      agent: 'Omar',
      matchInput: 'Deploy to staging',
      response: {
        text: '[DONE: deployed dashboard@1.0.0 to staging, smoke tests green, production sign-off requested]',
        handledLocally: true,
      },
    },
  ],
};
