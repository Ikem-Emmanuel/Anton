# Anton Architecture

How the official Claude Code Agent Teams architecture maps to our Slack-first system.

## Official vs Anton

```text
OFFICIAL (Terminal)              ANTON (Slack)
─────────────────               ────────────────
Terminal window        →        Slack workspace
tmux panes             →        Slack channels
Shift+Down to cycle    →        @name to address
Team lead session      →        Anton service (Node.js)
SendMessage/broadcast  →        Slack posts + auto-dispatch
~/.claude/tasks/       →        .anton/tasks/ + Asana
TeammateIdle hook      →        Service idle detection
Plan approval          →        Marcus reviews, Noel merges
```

## System Layers

```text
┌──────────────────────────────────────────────────┐
│              SLACK (UI Layer)                     │
│                                                  │
│  You type here. Agents respond here.             │
│  Each channel = a tmux pane.                     │
│  DM = clicking into a specific agent.            │
│                                                  │
│  #anton-engineering    All eng activity           │
│  #anton-marketing      Marketing activity         │
│  #anton-standup        Cross-team standup         │
│  #anton-analytics      Model performance          │
│  DM @Anton             Direct to any agent        │
└──────────────────┬───────────────────────────────┘
                   │ Socket Mode (real-time)
┌──────────────────▼───────────────────────────────┐
│           ANTON SERVICE (Coordinator)             │
│                                                  │
│  This replaces the "team lead" session.          │
│  Routes messages, orchestrates sprints,          │
│  tracks analytics, manages sessions.             │
│                                                  │
│  ┌─────────┐ ┌───────────┐ ┌──────────┐        │
│  │ Router  │ │Orchestrat.│ │Analytics │        │
│  │         │ │           │ │          │        │
│  │ Name    │ │ Sprint    │ │ Tokens   │        │
│  │ Keyword │ │ Dispatch  │ │ Response │        │
│  │ Channel │ │ Auto-hand │ │ Per-agent│        │
│  └─────────┘ └───────────┘ └──────────┘        │
│                                                  │
│  ┌─────────┐ ┌───────────┐                      │
│  │ Logger  │ │Task Queue │                      │
│  │         │ │           │                      │
│  │ Per-agnt│ │ Local     │                      │
│  │ JSONL   │ │ deps      │                      │
│  │ Tools   │ │ status    │                      │
│  └─────────┘ └───────────┘                      │
└──────────────────┬───────────────────────────────┘
                   │ Agent SDK (persistent sessions)
┌──────────────────▼───────────────────────────────┐
│           AGENT SESSIONS (Workers)               │
│                                                  │
│  Each agent = persistent SDK session.            │
│  Sessions survive PM2 restarts.                  │
│  Each has persona, tools, project context.       │
│                                                  │
│  Opus (planning only, no code):                  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│  │Marcus  │ │Sarah   │ │Diana   │ │Nadia   │   │
│  │TechLead│ │PM      │ │CMO     │ │Growth  │   │
│  └────────┘ └────────┘ └────────┘ └────────┘   │
│                                                  │
│  Sonnet (writes code, creates content):          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│  │James   │ │Elena   │ │Kai     │ │Omar    │   │
│  │Backend │ │Frontend│ │Mobile  │ │DevOps  │   │
│  └────────┘ └────────┘ └────────┘ └────────┘   │
│  + 14 more (marketing, SEO, data, growth, auto) │
│                                                  │
│  Haiku (testing, analytics):                     │
│  ┌────────┐ ┌────────┐ ┌────────┐              │
│  │Priya   │ │Ben     │ │Yuki    │              │
│  │QA      │ │Analyst │ │SEO     │              │
│  └────────┘ └────────┘ └────────┘              │
└──────────────────┬───────────────────────────────┘
                   │ Read/Write/Bash/Asana MCP
┌──────────────────▼───────────────────────────────┐
│            SHARED STATE                          │
│                                                  │
│  .anton/tasks/       Local task queue + deps     │
│  .anton/logs/        Per-agent activity logs     │
│  .anton/analytics/   Token usage, response times │
│  .anton/sessions.json Session ID persistence     │
│  Asana (MCP)         Project management          │
│  Git repo            The actual codebase         │
└──────────────────────────────────────────────────┘
```

## Task Flow (maps to official task list)

```text
Official:  pending → in_progress → completed
Anton:     backlog → assigned → in_progress → in_review → qa → done

The Anton service manages task state transitions:
1. Sarah creates tasks in Asana (backlog)
2. Sarah assigns to dev, moves to "assigned"
3. Service auto-dispatches: tells the assigned agent to start
4. Agent works, moves to "in_progress"
5. Agent finishes, creates PR, moves to "in_review"
6. Marcus reviews (LGTM or changes requested)
7. Priya tests (pass or fail with bug report)
8. Noel merges, task → "done"
9. Omar deploys
```

## Communication (maps to official mailbox)

```text
Official:  SendMessage(teammate, message)
           broadcast(message)

Anton:     postAs(client, member, channel, thread, message)
           handleEveryone(text, channel, ...)

Routes:
  Name mention     → direct to that agent
  Keyword match    → route to specialist
  Channel default  → department lead
  "everyone"       → fan out to all dept members
  Agent response   → auto-detect handoffs and dispatch
```

## Quality Gates (maps to official hooks)

```text
Official:
  TeammateIdle → exit 2 to keep working
  TaskCompleted → exit 2 to reject completion

Anton:
  Agent finishes → service checks for handoff triggers
  Sarah assigns → service auto-dispatches to agents
  Dev finishes → service triggers Marcus review + Priya QA
  Priya passes → service notifies Noel
  Priya fails → service routes back to dev
```
