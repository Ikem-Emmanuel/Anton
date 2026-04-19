// Scenario S1 — "Ship user login"
//
// Full feedback-loop cycle exercising: sprint kickoff, architecture review,
// parallel backend+frontend, dev asks PM for clarification, QA finds a bug,
// dev fixes, QA re-approves, deploy. 12 steps, ~300ms to run in sim mode
// (vs ~5+ minutes on live Ollama with likely timeouts).

import type { SimFixture } from '../../src/brain/sim-mode.js';

export const s1ShipLogin: SimFixture = {
  scenario: 'S1 — Ship user login (full feedback cycle)',
  steps: [
    // 1. Noel asks Anton to ship login
    {
      agent: 'Anton',
      matchInput: 'login',
      response: {
        text: 'On it. Sarah will draft stories; Marcus will sign off on architecture.',
        handoffs: [
          {
            agent: 'Sarah',
            message:
              'Kick off Sprint 9 on user auth. Draft a sprint goal and top 5 user stories (email/password, MFA, session strategy, password reset, OAuth).',
          },
        ],
        handledLocally: true,
        classification: {
          intent: 'task',
          depth: 'detailed',
          confidence: 0.95,
          route: 'local-fast',
          reason: 'classify:task/complex',
        },
      },
    },
    // 2. Sarah drafts stories, hands to Marcus
    {
      agent: 'Sarah',
      matchInput: 'Sprint 9',
      response: {
        text: 'Goal: ship secure login with MFA by end of sprint. 5 stories drafted in Asana.',
        handoffs: [
          {
            agent: 'Marcus',
            message: 'Review auth scope. Decide: mechanism, session strategy, password storage.',
          },
        ],
        handledLocally: true,
      },
    },
    // 3. Marcus approves architecture, hands to James
    {
      agent: 'Marcus',
      matchInput: 'auth scope',
      response: {
        text: 'Approved: TOTP + password with bcrypt(12), HMAC-signed sessions with idle timeout, refresh at 2h.',
        handoffs: [
          {
            agent: 'James',
            message:
              'Build backend: POST /auth/login, POST /auth/refresh, TOTP verify endpoint. HMAC session tokens. Ask Sarah if you need clarification.',
          },
          {
            agent: 'Elena',
            message: 'Build login form with MFA input screen, OAuth entry points.',
          },
        ],
        handledLocally: true,
      },
    },
    // 4. James starts, asks Sarah for parameters (ASK pattern — for Phase 3A)
    {
      agent: 'James',
      matchInput: 'backend',
      response: {
        text: 'Starting on /auth/login. One question before I commit: should refresh tokens rotate on every use or only at expiry?',
        handoffs: [{ agent: 'Sarah', message: 'Token refresh policy — rotate on every use or only at expiry?' }],
        handledLocally: true,
      },
    },
    // 5. Sarah answers James
    {
      agent: 'Sarah',
      matchInput: 'refresh',
      response: {
        text: 'Rotate on every use. Security > convenience here.',
        handoffs: [],
        handledLocally: true,
      },
    },
    // 6. James completes backend, signals DONE
    {
      agent: 'James',
      matchInput: 'Rotate on every use',
      response: {
        text: '[DONE: backend auth endpoints committed, ready for review] /auth/login + /auth/refresh + /auth/totp/verify live on branch feature/auth. Tests passing.',
        handoffs: [{ agent: 'Priya', message: 'Backend auth ready for review. Branch feature/auth.' }],
        handledLocally: true,
      },
    },
    // 7. Elena completes frontend in parallel
    {
      agent: 'Elena',
      matchInput: 'login form',
      response: {
        text: '[DONE: login UI + MFA screen + OAuth buttons ready] on branch feature/auth-ui. Works with both password and OAuth flows.',
        handoffs: [{ agent: 'Priya', message: 'Frontend auth UI ready for review.' }],
        handledLocally: true,
      },
    },
    // 8. Priya finds a bug (REJECT pattern — for Phase 3A)
    {
      agent: 'Priya',
      matchInput: 'Backend auth',
      response: {
        text: '[REJECT: refresh token not invalidated on logout] Logout endpoint returns 200 but old refresh token still works. Security hole.',
        handoffs: [{ agent: 'James', message: 'Refresh token not invalidated on logout. Needs fix.' }],
        handledLocally: true,
      },
    },
    // 9. James fixes and re-signals DONE
    {
      agent: 'James',
      matchInput: 'Refresh token not invalidated',
      response: {
        text: '[DONE: logout now invalidates the refresh token chain] Added revocation list check on refresh endpoint. Re-tested.',
        handoffs: [{ agent: 'Priya', message: 'Fixed. Ready for re-test.' }],
        handledLocally: true,
      },
    },
    // 10. Priya re-tests and approves
    {
      agent: 'Priya',
      matchInput: 'Fixed',
      response: {
        text: '[APPROVE: all auth tests pass — unit + integration + E2E] Bug reproduced is fixed. Edge cases hold.',
        handoffs: [{ agent: 'Omar', message: 'Auth feature verified. Ready for staging deploy.' }],
        handledLocally: true,
      },
    },
    // 11. Omar deploys
    {
      agent: 'Omar',
      matchInput: 'staging deploy',
      response: {
        text: '[DONE: deployed auth@1.0.0 to staging, smoke test green] Staging URL live. Monitoring active. Ready for production sign-off from Noel.',
        handoffs: [],
        handledLocally: true,
      },
    },
    // 12. Anton summarizes back to Noel
    {
      agent: 'Anton',
      matchInput: 'status',
      response: {
        text: 'Login shipped to staging. 1 QA cycle (refresh-token bug, fixed). Awaiting your production sign-off.',
        handoffs: [],
        handledLocally: true,
      },
    },
  ],
};
