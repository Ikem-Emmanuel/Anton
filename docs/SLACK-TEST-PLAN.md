# Anton Slack Integration — Test Plan

Run all tests in order. Mark pass/fail for each.

## Pre-Test Setup

```bash
pm2 restart anton-service && sleep 3 && pm2 logs anton-service --lines 10 --nostream
```

Verify you see: "Anton is online" with 14 channels and 26 team members.

---

## T1: Routing Tests (verify the right person answers)

Post each message in `#anton-engineering`. Check the ack message says the correct name.

| #    | Message to send                      | Expected agent                  | Pass? |
| ---- | ------------------------------------ | ------------------------------- | ----- |
| T1.1 | "Marcus, who are you?"               | Marcus (name match)             |       |
| T1.2 | "Elena, what do you work on?"        | Elena (name match)              |       |
| T1.3 | "build a new API endpoint for users" | James (keyword: api, endpoint)  |       |
| T1.4 | "fix the CSS on the dashboard page"  | Elena (keyword: ui, dashboard)  |       |
| T1.5 | "deploy the backend to staging"      | Omar (keyword: deploy, staging) |       |
| T1.6 | "write tests for the auth module"    | Priya (keyword: test, auth)     |       |
| T1.7 | "who is on the team?"                | Marcus (team question)          |       |
| T1.8 | "what's the sprint status?"          | Sarah (keyword: sprint)         |       |

## T2: Cross-Department Routing (post in different channels)

| #    | Channel          | Message                           | Expected agent              | Pass? |
| ---- | ---------------- | --------------------------------- | --------------------------- | ----- |
| T2.1 | #anton-marketing | "what's our content plan?"        | Diana (mktg lead)           |       |
| T2.2 | #anton-seo       | "how are our rankings?"           | Nina (seo lead)             |       |
| T2.3 | #anton-data      | "run a query on user signups"     | Ben (keyword: query)        |       |
| T2.4 | #anton-growth    | "what's our current CAC?"         | Nadia (keyword: cac)        |       |
| T2.5 | #anton-standup   | "give me a standup from everyone" | Marcus (cross-dept default) |       |

## T3: Persona Tests (verify human-like responses)

Post in `#anton-engineering`. Check that responses feel natural, not robotic.

| #    | Message                             | Check for                                                 | Fail if                                                 |
| ---- | ----------------------------------- | --------------------------------------------------------- | ------------------------------------------------------- |
| T3.1 | "Marcus, introduce the team"        | First-name references, casual tone, personality           | Bullet list of names+titles, formal language            |
| T3.2 | "Elena, who are you?"               | Personal introduction, mentions what she works on         | "I am the frontend-developer agent"                     |
| T3.3 | "James, the login page is broken"   | Asks what's wrong, offers to look, mentions checking code | "I will investigate the issue and provide a resolution" |
| T3.4 | "what's the status of the project?" | Conversational summary with specifics                     | Bullet list with headers and markdown                   |
| T3.5 | "Omar, can you deploy?"             | Practical response about deploy process                   | "I will initiate the deployment process"                |

## T4: Session Persistence (verify memory across messages)

Send messages 30 seconds apart to the same agent. Second message should reference first.

| #    | First message                          | Second message             | Expected                    | Pass? |
| ---- | -------------------------------------- | -------------------------- | --------------------------- | ----- |
| T4.1 | "James, build a health check endpoint" | "what did I just ask you?" | References the health check |       |
| T4.2 | "Elena, fix the sidebar"               | "is it done?"              | References the sidebar work |       |

## T5: Error Handling

| #    | Test                           | Expected                       | Pass? |
| ---- | ------------------------------ | ------------------------------ | ----- |
| T5.1 | Send empty message             | No response (ignored)          |       |
| T5.2 | Very long message (500+ words) | Agent still responds, no crash |       |
| T5.3 | Message in non-anton channel   | No response (not monitored)    |       |

## T6: Report Generation

Post in `#anton-standup`:

| #    | Message                                   | Expected response format                             |
| ---- | ----------------------------------------- | ---------------------------------------------------- |
| T6.1 | "daily standup"                           | Marcus gives a conversational summary of team status |
| T6.2 | "what did the team accomplish this week?" | Marcus summarizes recent work naturally              |
| T6.3 | "what's blocking us?"                     | Marcus lists blockers conversationally               |

---

## Scoring

- **Pass**: 80%+ tests pass, all T1 routing correct, all T3 persona checks pass
- **Needs work**: 60-80% pass, some routing issues or robotic responses
- **Fail**: <60% pass, agents not responding or wrong routing
