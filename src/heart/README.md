# Heart

> Keeps Anton alive. Scheduling, monitoring, alerting, and proactive outreach.

## What It Does

The heart is the always-running core that keeps Anton operational. It monitors system health, schedules recurring jobs, sends proactive alerts, and delivers briefings. If the brain is how Anton thinks, the heart is how Anton stays aware and reaches out without being asked.

```
Every 60 seconds:
  -> heart.checkHealth()       CPU, memory, disk, battery
  -> heart.emitAlerts()        Threshold breaches -> nervous system
  -> heart.broadcastHealth()   Live stats -> web UI header

Every morning:
  -> heart.briefing()          Daily push with health + git + tasks

On event:
  -> heart.notify(P1, msg)     Slack DM, Pushover, digest, or briefing
```

## Responsibilities

| Function             | Description                                                     |
| -------------------- | --------------------------------------------------------------- |
| System monitoring    | CPU, memory, disk, battery every 60s via systeminformation      |
| Log watching         | Tail JSONL logs for ERROR/FATAL lines                           |
| Git state            | Branch, uncommitted changes, ahead/behind                       |
| Proactive alerts     | Threshold-based alerts via nervous system event bus             |
| Morning briefing     | Scheduled daily push: health, git, tasks, P3 buffer, activity   |
| Notification routing | P0: Pushover + DM. P1: DM. P2: hourly digest. P3: briefing only |
| Quiet hours          | No P1/P2 alerts between 11pm-7am (P0 always goes through)       |
| Cooldown             | Per-alert-key cooldown (5 min) prevents alert storms            |
| Health broadcast     | Live health data to web UI via WebSocket                        |

## How It Communicates

### Receives from:

- **Nervous** (event bus) — events that need notification (via priority engine)
- **Brain** — "schedule a standup at 9am", "set briefing time"
- **Spine** (config) — threshold configuration, quiet hours

### Sends to:

- **Nervous** (event bus) — `health:cpu:critical`, `health:mem:critical`, etc.
- **Slack** — DM notifications to Noel
- **Pushover** — P0 emergency phone alerts
- **Web UI** — live health bar data via WebSocket broadcast
- **Memory** — daily/weekly summaries for vault

### Notification flow:

```
Event detected (CPU > 85%)
  -> nervous.emit('health:cpu:critical', { percent: 92 })
  -> priority engine: P1
  -> heart.notify('P1', 'CPU at 92%')
  -> isQuietHours()? -> buffer to digest
  -> checkCooldown()? -> skip if recent
  -> sendSlackDM() + optional sendPushover()
```

## How It Scales

The heart is lightweight — it's timers and HTTP calls, not compute-heavy.

| Component     | Current                         | Scaled                              |
| ------------- | ------------------------------- | ----------------------------------- |
| Health check  | 60s interval, systeminformation | Same (no scaling needed)            |
| Log watching  | chokidar on data/logs/          | Same                                |
| Notifications | Direct Slack API                | Add SMS, email, Discord as channels |
| Briefing      | Local LLM generates text        | Same                                |
| Digest buffer | In-memory, flushed hourly       | Redis-backed for persistence        |

## Alert Severity Tiers

| Tier | Meaning   | Delivery                                            | Bypasses quiet hours? |
| ---- | --------- | --------------------------------------------------- | --------------------- |
| P0   | Emergency | Slack DM + Pushover (phone buzz, repeats until ack) | Yes                   |
| P1   | Urgent    | Slack DM with colored attachment                    | No (downgrades to P2) |
| P2   | Important | Batched into hourly digest                          | No                    |
| P3   | Info      | Included in morning briefing only                   | N/A                   |

## Configurable Thresholds

```typescript
const THRESHOLDS = {
  cpuPercent: 85, // P1 above this
  memPercent: 85, // P1 above this
  diskPercent: 80, // P2 above this
  batteryPercent: 15, // P1 below this (and not charging)
};
```

## Dependencies

- systeminformation (CPU, memory, disk, battery)
- @slack/bolt (Slack DM notifications)
- Pushover API (P0 emergency alerts)
- Nervous organ (event bus for emitting and receiving)
- Memory organ (briefing reads health snapshot, daily notes)
- Web UI (health bar broadcast via WebSocket)

## Files

```
src/heart/
  README.md          This file
  watcher.ts         System health monitoring (60s interval)
  notify.ts          Notification routing (P0-P3, cooldown, quiet hours)
  briefing.ts        Morning briefing generation
  digest.ts          Hourly P2 digest buffer
  heart.test.ts      Tests
  watcher.test.ts    Watcher-specific tests
  notify.test.ts     Notification tests
  briefing.test.ts   Briefing tests
```
