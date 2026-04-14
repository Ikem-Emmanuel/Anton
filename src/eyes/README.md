# Eyes

> Anton sees. Images, screens, documents, and the environment around him.

## What It Does

Eyes give Anton visual perception and environmental awareness. It analyzes images sent by Noel, reads documents, detects what's on screen, and senses the local environment (battery, WiFi, active app, calendar, Focus mode). Eyes turn raw visual and environmental data into structured information the brain can act on.

```
Image uploaded
  -> eyes.analyze(image)     Classify: code screenshot? receipt? document? UI?
  -> brain.process()         Respond based on what was seen

Every 60 seconds:
  -> eyes.sense()            Battery, WiFi, active app, Focus mode, calendar
  -> memory.storeContext()   Current environment stored for brain injection
```

## Responsibilities

| Function                | Description                                                                   |
| ----------------------- | ----------------------------------------------------------------------------- |
| Image analysis          | Classify and describe uploaded images (code, receipts, docs, UI, whiteboards) |
| Receipt detection       | Detect purchase receipts, extract vendor + amount, trigger approval gate      |
| Code screenshot reading | OCR code from screenshots, identify language and errors                       |
| Document processing     | Extract text and structure from documents and PDFs                            |
| Environment sensing     | Battery %, WiFi SSID, active app, screen lock, Focus/DND mode                 |
| Calendar awareness      | Next meeting time, today's schedule                                           |
| Working hours detection | Is Noel active or away? (screen lock + idle time)                             |
| Git awareness           | Uncommitted changes, branch state across repos                                |

## How It Communicates

### Receives from:

- **Web UI** — uploaded images (saved to temp file, path passed)
- **Slack** — image attachments (downloaded via Slack API)
- **Brain** — "analyze this image", "what's on screen?"
- **macOS** — system state via osascript and systeminformation

### Sends to:

- **Brain** — structured description of what was seen
- **Memory** — environment context (updated every 60s)
- **Heart** (notify) — receipt detected -> approval gate
- **Nervous** (event bus) — `environment:changed`, `image:analyzed`

### Interfaces:

```typescript
interface Eyes {
  // Vision
  analyzeImage(filepath: string, userText?: string): Promise<ImageAnalysis>;
  classifyImage(filepath: string): Promise<ImageType>;

  // Environment sensing
  sense(): Promise<EnvironmentSnapshot>;
  getActiveApp(): Promise<string>;
  getNextMeeting(): Promise<CalendarEvent | null>;
  isUserActive(): Promise<boolean>;
  isFocusMode(): Promise<boolean>;

  // Context
  getEnvironmentContext(): string; // Formatted for brain injection
}

interface EnvironmentSnapshot {
  battery: { percent: number; charging: boolean } | null;
  wifi: { ssid: string; signal: number } | null;
  activeApp: string;
  focusMode: boolean;
  screenLocked: boolean;
  nextMeeting: { title: string; inMinutes: number } | null;
  git: { branch: string; uncommitted: number; ahead: number } | null;
  timestamp: string;
}

type ImageType =
  | "code"
  | "receipt"
  | "document"
  | "ui-screenshot"
  | "whiteboard"
  | "photo"
  | "unknown";
```

## How It Scales

| Capability          | 16GB Mac                                        | 64GB Mac Studio         | Notes                         |
| ------------------- | ----------------------------------------------- | ----------------------- | ----------------------------- |
| Image analysis      | Via Ollama vision model                         | Via larger vision model | Model size determines quality |
| Environment sensing | Full (osascript, systeminformation)             | Full                    | No scaling needed             |
| Calendar            | osascript (Apple Calendar)                      | + Google Calendar API   | Add more sources              |
| Git state           | simple-git polling                              | Same                    | No scaling needed             |
| Document OCR        | Basic (Whisper for audio, Tesseract for images) | + higher quality models | Better OCR models             |

## Environment Context Injection

Every 60 seconds, eyes produce a context string injected into the brain's prompt:

```
[ENVIRONMENT]
Battery: 72% (charging)
WiFi: HomeOffice-5G
Active app: VS Code
Focus mode: OFF
Next meeting: "Sprint Planning" in 23 minutes
Git: branch feature/brain, 3 uncommitted files
```

This lets the brain make contextual decisions:

- "You have a meeting in 23 minutes — want me to wrap up the current task?"
- "You're in VS Code — want me to review what you're working on?"
- "Focus mode is on — I'll hold non-urgent notifications."

## macOS Permissions

Eyes need these macOS permissions (granted once in System Settings > Privacy):

| Permission                 | What for                             | Required?   |
| -------------------------- | ------------------------------------ | ----------- |
| Automation (Calendar)      | Read calendar events via AppleScript | Optional    |
| Automation (System Events) | Detect active app, screen lock       | Optional    |
| Accessibility              | Screen reading, idle detection       | Optional    |
| Camera                     | Future: visual awareness             | No (future) |

Eyes degrade gracefully — if a permission isn't granted, that sensor returns null and the rest still work.

## Image Processing Pipeline

```
Image received (file path)
  -> Detect type (receipt? code? document?)
  -> If receipt: extract vendor + amount -> AWAITING_APPROVAL
  -> If code: identify language, errors, context
  -> If document: extract text, summarize
  -> If UI screenshot: describe layout, identify elements
  -> Return structured analysis to brain
```

## Dependencies

- systeminformation (battery, WiFi, CPU)
- node-osascript (active app, calendar, Focus mode via AppleScript)
- macos-notification-state (DND/Focus detection)
- Ollama vision model (image analysis)
- Brain organ (receives structured descriptions)
- Memory organ (stores environment context)
- Heart organ (receipt -> approval notification)

## Files

```
src/eyes/
  README.md          This file
  vision.ts          Image analysis and classification
  sensors.ts         Environment sensing (battery, WiFi, app, calendar)
  context.ts         Build environment context string for brain injection
  receipt.ts         Receipt detection and amount extraction
  eyes.test.ts       Tests
  sensors.test.ts    Sensor tests
```

## Configuration

```typescript
// config/eyes.ts
export const eyesConfig = {
  sensing: {
    intervalMs: 60_000, // Environment check every 60s
    enableCalendar: true, // Requires macOS Automation permission
    enableActiveApp: true, // Requires macOS Automation permission
    enableFocusMode: true, // macos-notification-state package
  },
  vision: {
    model: "llava:7b", // Ollama vision model for image analysis
    maxImageSize: 10_000_000, // 10MB max
    tempDir: "data/tmp/", // Temp storage for uploaded images
    cleanupAfter: true, // Delete temp files after analysis
  },
};
```
