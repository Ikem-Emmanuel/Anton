# Anton — Go-Live Checklist

Everything needed before Anton is fully operational. Check off as you complete each item.

## Environment Variables (.env)

```
# Required (already working)
SLACK_BOT_TOKEN=           # Slack bot token (xoxb-)
SLACK_APP_TOKEN=           # Slack app token for Socket Mode (xapp-)
NOEL_SLACK_USER_ID=        # Your Slack user ID (for approval gate)

# Optional — Pushover (P0 emergency phone alerts)
PUSHOVER_APP_TOKEN=        # From pushover.net dashboard after creating an app
PUSHOVER_USER_KEY=         # Your Pushover user key
# Setup: Buy Pushover app ($5 one-time), create an app, add tokens above.
# Without this, P0 alerts go to Slack DM only (no phone buzz).
```

## Services to Configure

- [ ] **Pushover** — $5 one-time (iOS/Android). Creates phone buzz for P0 emergencies even on DND.
  - Buy at pushover.net
  - Create an "Anton" application in your dashboard
  - Add PUSHOVER_APP_TOKEN and PUSHOVER_USER_KEY to .env
  - Test: `node scripts/test-notify.js p0`

- [ ] **Slack App Permissions** — Verify these scopes are enabled:
  - `chat:write` (post messages)
  - `channels:history` (read channels)
  - `im:history` (read DMs)
  - `im:write` (open DMs)
  - `reactions:write` (add emoji reactions)
  - `users:read` (resolve user IDs)
  - `files:read` (read uploaded images)
  - `connections:write` (Socket Mode)

## Pre-Launch Verification

- [ ] `npm test` — all tests passing
- [ ] `npm run dev` — service starts without errors
- [ ] DM Anton in Slack — responds as PA
- [ ] Web interface at localhost:3000 — loads, can chat
- [ ] Health bar shows CPU/MEM/DISK in web UI
- [ ] Morning briefing test: `node scripts/test-briefing.js`
- [ ] Notification test: `node scripts/test-notify.js`
- [ ] Event system test: `node scripts/test-events.js`
- [ ] Watcher test: `node scripts/test-watcher.js`
- [ ] Image upload works in web UI

## Production Deployment

- [ ] **PM2 setup** — `pm2 start ecosystem.config.cjs`
- [ ] **PM2 startup** — `pm2 startup` to survive reboots
- [ ] **PM2 save** — `pm2 save` to persist process list
- [ ] Set `NODE_ENV=production` in .env
- [ ] Verify `data/` directory exists with proper subdirs
- [ ] Verify `slack-channels.env` has channel mappings
- [ ] Clear stale sessions: `echo '{}' > data/sessions.json`

## Post-Launch

- [ ] Verify morning briefing fires at scheduled time
- [ ] Verify watcher alerts on threshold breach
- [ ] Verify approval gate works (trigger a gated action)
- [ ] Monitor `data/logs/` for agent activity
- [ ] Set briefing time via Slack: "set standup at 9am"

## Future Configuration (as features ship)

- [ ] **Pushover** — Phase 2 P0 alerts (see above)
- [ ] **Google Calendar API** — Phase 5 calendar awareness (needs OAuth setup)
- [ ] **Gmail API** — Phase 5 email awareness (needs OAuth + Pub/Sub)
- [ ] **Deepgram API key** — Phase 7 speech-to-text ($7/month)
- [ ] **OpenAI/ElevenLabs API key** — Phase 7 text-to-speech
- [ ] **Tailscale Funnel** — If you want real-time webhooks (GitHub, Asana) instead of polling
