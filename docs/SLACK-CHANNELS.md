# Slack Channel Architecture for AI Organization

## Create these channels in your Slack workspace:

### Core Channels

| Channel              | Purpose                                | Who Posts            |
| -------------------- | -------------------------------------- | -------------------- |
| #ai-standup          | Daily standup summaries (all depts)    | All department leads |
| #ai-sprint-updates   | Sprint progress, velocity, burndown    | Engineering Lead     |
| #ai-blockers         | URGENT: blocked tasks, @channel alerts | Any agent            |
| #ai-cross-department | Cross-team coordination                | All leads            |

### Engineering Channels

| Channel           | Purpose                                  | Who Posts                    |
| ----------------- | ---------------------------------------- | ---------------------------- |
| #ai-engineering   | Engineering status updates               | All engineering agents       |
| #ai-pull-requests | PR created/reviewed/merged notifications | Backend, Frontend, Tech Lead |
| #ai-qa-results    | Test pass/fail reports with coverage     | QA Engineer                  |
| #ai-deployments   | Deploy start/success/failure alerts      | DevOps Engineer              |

### Business Channels

| Channel        | Purpose                                       | Who Posts             |
| -------------- | --------------------------------------------- | --------------------- |
| #ai-marketing  | Content, social, email updates                | All marketing agents  |
| #ai-seo        | SEO audits, keyword research, rankings        | All SEO agents        |
| #ai-data       | Data insights, ML experiments, pipelines      | All data agents       |
| #ai-automation | CI/CD, workflow, integration updates          | All automation agents |
| #ai-growth     | Analytics, experiments, attribution, segments | All growth agents     |

### Command Channel

| Channel              | Purpose                    | Who Posts   |
| -------------------- | -------------------------- | ----------- |
| #ai-feature-requests | Drop ideas from your phone | YOU (human) |

## Message Format Standards

- Start every message with: [Agent Name] + emoji prefix
- Emoji prefixes: starting, done, failed, warning, blocked
- PR Created, Review, Deploying, Report, Experiment
- Keep messages to ONE LINE in main channel, use THREADS for details
- Standup format: Yesterday | Today | Blockers

## Notification Priority

- P0 (CRITICAL): @channel in #ai-blockers — deploy failures, data loss, security
- P1 (HIGH): @mention in relevant channel — failed QA, blocked tasks, sprint ending
- P2 (NORMAL): Silent post — PR created, task completed, deploy success
- P3 (LOW): Thread reply — minor updates, non-critical status changes
