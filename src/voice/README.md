# Voice

> Anton speaks and listens. Fully local, zero cloud dependency.

## What It Does

Voice gives Anton ears and a mouth. It converts speech to text, processes it through the brain, and speaks the response back. Everything runs locally — no audio data leaves your machine. Total latency target: ~1.4 seconds from speech to spoken response.

```
🎙️ Microphone captures audio
  -> voice.wakeWord()      "Hey Anton" detected (~10ms)
  -> voice.listen()        Silero VAD detects speech boundaries (~50ms)
  -> voice.transcribe()    Whisper.cpp converts to text (~800ms)
  -> brain.process()       Brain thinks and responds (~300ms)
  -> voice.speak()         Piper TTS generates audio (~200ms)
  -> 🔊 Speaker plays response
```

## Responsibilities

| Function                 | Description                                                       |
| ------------------------ | ----------------------------------------------------------------- |
| Wake word                | Detect "Hey Anton" using OpenWakeWord (always listening, low CPU) |
| Voice Activity Detection | Silero VAD determines when you start and stop talking             |
| Speech-to-Text           | Whisper.cpp transcribes audio to text (local, base.en model)      |
| Text-to-Speech           | Piper generates natural speech from text (lessac-medium voice)    |
| Audio routing            | Manage microphone input and speaker output                        |
| Mobile voice             | Push-to-talk via WebSocket audio streaming                        |
| Voice commands           | "Hey Anton, what's the sprint status?" -> spoken response         |

## How It Communicates

### Receives from:

- **Microphone** — raw PCM audio (16kHz, mono)
- **Brain** — text responses to speak aloud
- **Heart** (notify) — P0/P1 alerts to announce vocally
- **Spine** (WebSocket) — audio chunks from mobile push-to-talk

### Sends to:

- **Brain** — transcribed text (same as a typed message)
- **Speaker** — synthesized audio
- **Spine** (WebSocket) — audio response to mobile client

### Voice pipeline:

```typescript
interface VoicePipeline {
  // Input
  startListening(): void;         // Begin wake word detection
  stopListening(): void;          // Pause listening

  // Processing
  transcribe(audio: Buffer): Promise<string>;    // PCM -> text
  speak(text: string): Promise<Buffer>;           // text -> PCM

  // Events
  on('wakeWord', callback): void;         // "Hey Anton" detected
  on('speechStart', callback): void;      // User started talking
  on('speechEnd', callback): void;        // User stopped talking
  on('transcript', callback): void;       // Transcription ready
}
```

## How It Scales

| Component           | 16GB Mac        | 64GB Mac Studio   | 128GB Mac Studio |
| ------------------- | --------------- | ----------------- | ---------------- |
| Whisper model       | base.en (141MB) | medium.en (769MB) | large-v3 (1.5GB) |
| Transcription speed | ~800ms          | ~400ms            | ~300ms           |
| Accuracy (WER)      | ~10%            | ~6%               | ~4%              |
| Piper voice         | lessac-medium   | lessac-high       | lessac-high      |
| TTS latency         | ~200ms          | ~150ms            | ~100ms           |
| Total round-trip    | ~1.4s           | ~1.0s             | ~0.7s            |

## Voice vs Text

Voice messages enter the exact same pipeline as typed messages. After transcription, the text goes to `brain.process()` — the brain doesn't know or care if it came from voice or keyboard. The only difference is the response is spoken back instead of displayed.

## Mobile Voice

Mobile uses push-to-talk over WebSocket:

```
Phone mic -> MediaRecorder (Opus/WebM)
  -> WebSocket chunks -> Voice container
  -> Whisper.cpp transcription
  -> Brain processes
  -> Piper TTS generates audio
  -> WebSocket audio back -> Phone speaker
```

No wake word on mobile — push-to-talk is more reliable and uses less battery.

## Privacy

- All audio processed locally (Whisper.cpp, Piper TTS)
- No audio sent to any cloud service
- No audio stored by default (configurable)
- Wake word runs on-device (OpenWakeWord)

## Dependencies

- Whisper.cpp (speech-to-text, C++ with Node.js bindings)
- Piper (text-to-speech, local neural voices)
- OpenWakeWord (wake word detection)
- Silero VAD (voice activity detection)
- Brain organ (processes transcribed text)
- Spine organ (WebSocket for mobile audio streaming)

## Files

```
src/voice/
  README.md         This file
  stt.ts            Whisper.cpp client (speech-to-text)
  tts.ts            Piper client (text-to-speech)
  wake.ts           OpenWakeWord detection
  vad.ts            Silero VAD (voice activity detection)
  pipeline.ts       End-to-end voice loop orchestration
  voice.test.ts     Tests
```

## Configuration

```typescript
// config/voice.ts
export const voiceConfig = {
  stt: { model: "base.en", language: "en", threads: 4 },
  tts: { voice: "lessac-medium", speed: 1.0, sampleRate: 22050 },
  wakeWord: { phrase: "hey anton", sensitivity: 0.5 },
  vad: { threshold: 0.5, minSpeechMs: 250, maxSilenceMs: 1000 },
};
```
