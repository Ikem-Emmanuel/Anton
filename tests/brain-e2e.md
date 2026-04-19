# Anton Brain — End-to-End Test Sheet

Open http://localhost:3000 and run each test. Check the expected behavior and mark pass/fail.

---

## 1. Self-Awareness

| #   | Message                  | Expected                                                           | Pass? |
| --- | ------------------------ | ------------------------------------------------------------------ | ----- |
| 1.1 | "Who are you?"           | Says Anton, Noel's AI OS, Qwen3 8B, Ollama, local LLM              |       |
| 1.2 | "What model powers you?" | Says Qwen3 8B (not "neural network", not "I don't have a version") |       |
| 1.3 | "Who created you?"       | Says Noel                                                          |       |
| 1.4 | "Who do you report to?"  | Says Noel                                                          |       |

## 2. Team Knowledge

| #   | Message                                  | Expected                                                     | Pass? |
| --- | ---------------------------------------- | ------------------------------------------------------------ | ----- |
| 2.1 | "Who handles backend development?"       | Says James                                                   |       |
| 2.2 | "Who should fix a dashboard bug?"        | Says Elena (frontend)                                        |       |
| 2.3 | "Who deploys to staging?"                | Says Omar (devops)                                           |       |
| 2.4 | "Who writes blog posts?"                 | Says Alex (content)                                          |       |
| 2.5 | "Who handles SEO?"                       | Says Nina                                                    |       |
| 2.6 | "Who is the tech lead?"                  | Says Marcus                                                  |       |
| 2.7 | "Give me a list of the engineering team" | Lists real names only — no Maya, Kael, Jax, Tessa, Rook, Vex |       |

## 3. Delegation & Handoffs

| #   | Message                                                | Expected                                               | Pass? |
| --- | ------------------------------------------------------ | ------------------------------------------------------ | ----- |
| 3.1 | "Build an API endpoint for user profiles"              | Delegates to James (not self, not generic "DevOps")    |       |
| 3.2 | "Fix the broken dashboard component"                   | Delegates to Elena                                     |       |
| 3.3 | "Deploy auth module to staging"                        | Delegates to Omar                                      |       |
| 3.4 | "Write a blog post about our launch"                   | Delegates to Alex                                      |       |
| 3.5 | "Reach out to Marcus, get his action plan for auth"    | Anton acknowledges, Marcus responds in character       |       |
| 3.6 | "Ask Sarah to create sprint tasks for the auth module" | Anton acknowledges, Sarah responds with PM perspective |       |
| 3.7 | "Tell Priya to test the login flow"                    | Anton acknowledges, Priya responds with QA perspective |       |

## 4. Handoff Quality

| #   | Check                                                        | Expected                                                   | Pass? |
| --- | ------------------------------------------------------------ | ---------------------------------------------------------- | ----- |
| 4.1 | Does the handoff target receive a real message?              | Not empty, not just "Message sent to X:"                   |       |
| 4.2 | Does the agent acknowledge the task first?                   | "Anton flagged this..." or similar human opener            |       |
| 4.3 | Does the agent respond in character?                         | Marcus = technical, Sarah = structured, James = casual dev |       |
| 4.4 | Does the agent mention other team members by name?           | "Need to check with James..." not "the backend team"       |       |
| 4.5 | Does the agent avoid asking for clarification unnecessarily? | Gives substance, doesn't say "Could you clarify?"          |       |

## 5. Conversation Context

| #   | Messages (in sequence)                                   | Expected                                             | Pass? |
| --- | -------------------------------------------------------- | ---------------------------------------------------- | ----- |
| 5.1 | "Ask Marcus about the auth plan" → "he is the team lead" | Second message references Marcus (remembers context) |       |
| 5.2 | "Deploy to staging" → "actually make it production"      | Second message knows what to deploy (remembers)      |       |
| 5.3 | "What did I just ask?"                                   | References the previous message                      |       |

## 6. Response Quality

| #   | Message                                                            | Expected                                                      | Pass? |
| --- | ------------------------------------------------------------------ | ------------------------------------------------------------- | ----- |
| 6.1 | "Hey Anton"                                                        | Short greeting, not a single word ("Status." is bad)          |       |
| 6.2 | "Developer growth and revenue generation"                          | Structured, directional answer — not a generic Wikipedia list |       |
| 6.3 | "What are we missing?"                                             | Contextual answer, not hallucinated capabilities              |       |
| 6.4 | Multi-part: "1. Who are you? 2. What LLM? 3. What are we missing?" | Answers all 3 parts accurately                                |       |

## 7. Routing

| #   | Message                                       | Expected                                                  | Pass? |
| --- | --------------------------------------------- | --------------------------------------------------------- | ----- |
| 7.1 | "@claude explain quantum computing"           | Routes to Claude (paid session), not local LLM            |       |
| 7.2 | "@local what is 2+2?"                         | Forces local LLM even if brain thinks it needs Claude     |       |
| 7.3 | "Build a full authentication system with JWT" | Brain says [NEEDS_CLAUDE] or routes to Claude (code task) |       |

## 8. No Hallucination

| #   | Check                     | Expected                                                     | Pass? |
| --- | ------------------------- | ------------------------------------------------------------ | ----- |
| 8.1 | No invented team members  | Never mentions Maya, Kael, Jax, Tessa, Rook, Vex, etc.       |       |
| 8.2 | No fabricated departments | Never mentions HR, Legal, Finance, Sales (unless they exist) |       |
| 8.3 | No false capabilities     | Doesn't claim to "deploy" or "write code" itself             |       |
| 8.4 | Correct model name        | Says Qwen3 8B, not GPT, not Claude, not "neural network"     |       |

## 9. Speed (check terminal logs)

| #   | Message type                   | Expected time | Pass? |
| --- | ------------------------------ | ------------- | ----- |
| 9.1 | Greeting ("Hey")               | < 15s         |       |
| 9.2 | Simple question                | < 20s         |       |
| 9.3 | Complex question               | < 45s         |       |
| 9.4 | Handoff (total: Anton + agent) | < 90s         |       |

---

## How to Run

1. Start: `npm run dev`
2. Open: http://localhost:3000
3. Watch terminal for `[LOCAL]` / `[CLAUDE]` / `[Handoff]` logs
4. Test each row, mark Pass/Fail
5. Note any hallucinated names or wrong delegations
