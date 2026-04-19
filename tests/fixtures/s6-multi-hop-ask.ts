// Scenario S6 — "Multi-hop ASK chain"
//
// James asks Sarah, Sarah doesn't know, asks Marcus. Marcus answers Sarah,
// Sarah answers James, James resumes work. Tests suspense across multiple
// agents and correct resume behavior.

import type { SimFixture } from '../../src/brain/sim-mode.js';

export const s6MultiHopAsk: SimFixture = {
  scenario: 'S6 — Multi-hop ASK chain (James → Sarah → Marcus → back)',
  steps: [
    // 1. Anton kicks off
    {
      agent: 'Anton',
      matchInput: 'build rate limiter',
      response: {
        text: '[HANDOFF:James] build the rate limiter middleware for the API.',
        handledLocally: true,
      },
    },
    // 2. James starts, ASKs Sarah about target SLA
    {
      agent: 'James',
      matchInput: 'rate limiter middleware',
      response: {
        text: 'Starting. [ASK:Sarah] what SLA target are we committing to — 100 req/s per user or global?',
        handledLocally: true,
      },
    },
    // 3. Sarah doesn't know, escalates to Marcus
    {
      agent: 'Sarah',
      matchInput: 'SLA target',
      response: {
        text: "Good question — that's a tech decision. [ASK:Marcus] rate limit granularity — per-user 100 req/s or global? James is blocked.",
        handledLocally: true,
      },
    },
    // 4. Marcus answers Sarah
    {
      agent: 'Marcus',
      matchInput: 'rate limit granularity',
      response: {
        text: 'Per-user 100 req/s with a global ceiling of 10K req/s as safety net. Use sliding window algorithm for both.',
        handoffs: [{ agent: 'Sarah', message: 'Rate limit: per-user 100 req/s, global 10K ceiling, sliding window.' }],
        handledLocally: true,
      },
    },
    // 5. Sarah relays to James
    {
      agent: 'Sarah',
      matchInput: 'per-user 100 req/s, global 10K',
      response: {
        text: 'Answer: per-user 100 req/s, global 10K ceiling, sliding window. Marcus called it.',
        handoffs: [
          { agent: 'James', message: 'Rate limit answer: per-user 100 req/s + global 10K ceiling + sliding window.' },
        ],
        handledLocally: true,
      },
    },
    // 6. James resumes + DONE
    {
      agent: 'James',
      matchInput: 'Rate limit answer',
      response: {
        text: '[DONE: rate limiter middleware implemented with sliding window, per-user + global tiers, redis backed] Tests green.',
        handledLocally: true,
      },
    },
  ],
};
