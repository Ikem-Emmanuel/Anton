# Anton Service — Test Report

**Date:** 2026-04-13
**Runner:** Vitest v4.1.4
**Node:** ESM (`"type": "module"`)

## Summary

**70 tests — 70 passed, 0 failed**

## Per-File Breakdown

| File                       | Tests | Passed | Failed |
| -------------------------- | ----- | ------ | ------ |
| `src/team.test.js`         | 14    | 14     | 0      |
| `src/router.test.js`       | 18    | 18     | 0      |
| `src/scheduler.test.js`    | 18    | 18     | 0      |
| `src/orchestrator.test.js` | 13    | 13     | 0      |
| `src/slack.test.js`        | 5     | 5      | 0      |
| `src/sessions.test.js`     | 2     | 2      | 0      |

## Bugs Found and Fixed in Source

### `src/router.js` — direct-address regex too broad

**File:** `src/router.js`, line 50

**Before:**

```js
if (new RegExp(`^(?:hey\\s+)?${member.name}[,!:\\s]`, 'i').test(text))
```

**After:**

```js
if (new RegExp(`^(?:hey\\s+)?${member.name}[,!:]`, 'i').test(text))
```

**What changed:** `\s` (whitespace) was included as a valid direct-address terminator in the character class. This caused any message starting with a team member's name followed by a space to be treated as a direct address — e.g. `"Marcus and James should discuss"` would match Marcus as a direct address and return `TEAM.marcus` before ever reaching the ambiguity check (step 5). The intent, as documented in the comment, is to match patterns like `"Riley, ..."` / `"Hey James, ..."` / `"James:"` — all of which use explicit punctuation. Removing `\s` from the character class fixes the false match and allows the ambiguity check to fire correctly when two names appear in the same message.

## Tests Adjusted and Why

None. All test expectations matched documented behavior after the bug fix above.

## Coverage Notes

- `analytics.js`, `vision.js`, `taskqueue.js`, `logger.js` are not covered by this suite. These modules depend on external APIs (Anthropic SDK, file I/O side effects, Slack client internals) and their public contracts are not amenable to pure unit testing without a more involved integration harness. They are out of scope for this test pass.
- `sessions.js` — only `consumeHandoffs` is tested. The full `ask` / `getOrCreate` / `_ask` chain requires a live Anthropic SDK session and is intentionally excluded. The critical observable contract (handoff queue draining) is covered.
- `orchestrator.js` — only `detectCommand` (pure function) is tested. `startTeam`, `runSprint`, `teamStatus`, `stopTeam` require a live Slack client and agent sessions.
- `scheduler.js` — `initInboxProcessor` and `initNightlyConsolidation` are not unit-tested; they start `setInterval` loops with file system polling and are better covered by integration tests against a real temp directory.
