# Anton Service

Standalone Slack Socket Mode listener for the Anton AI organization.
Copy this entire `.anton/` folder to any machine and run.

## Setup

```bash
cd .anton/service
npm install
```

## Required files

```
.anton/
├── .env                    # SLACK_BOT_TOKEN and SLACK_APP_TOKEN
├── slack-channels.env      # Channel name=ID map (created by slack-setup.sh)
├── inbox/                  # Commands from Slack land here
└── service/
    ├── package.json
    ├── index.js            # The listener
    └── README.md
```

## Run

```bash
# From project root:
cd .anton/service && npm start

# Or with node directly:
node .anton/service/index.js

# Or with PM2 (production):
pm2 start .anton/service/index.js --name anton-service
```

## How it works

1. Connects to Slack via Socket Mode (WebSocket, no public URL needed)
2. Listens for messages in all #anton-\* channels
3. Reacts with 👀 and acknowledges in a thread
4. Writes the command to `.anton/inbox/{timestamp}-{channel}.md`
5. Agent teams pick up commands from inbox via hooks or polling

## Environment variables

- `SLACK_BOT_TOKEN` — Bot User OAuth Token (xoxb-...)
- `SLACK_APP_TOKEN` — App-Level Token (xapp-...) with connections:write scope
