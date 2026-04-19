// Settings sub-tab data. Kept in one file because every piece is small
// and settings tabs evolve together.

export type ArchLayer = {
  n: string;
  title: string;
  sub: string;
  /** CSS var name (without var() wrapper) for the left-border accent. */
  color: 'info' | 'work' | 'accent';
  bullets: string[];
};

export const ARCH_LAYERS: ArchLayer[] = [
  {
    n: '0',
    title: 'Deterministic pre-gate',
    sub: '0ms · no LLM',
    color: 'info',
    bullets: [
      '@claude / @local prefix → force path',
      'code block → needsClaude:true · token count > 400 → needsClaude:true',
      'explicit agent ping → routeTo:<agent> · approval regex → approval handler',
    ],
  },
  {
    n: '1',
    title: 'Fast classifier',
    sub: '200–400ms · qwen3:8b · think:false',
    color: 'work',
    bullets: [
      'schema-constrained JSON via Ollama format:<schema> (0.5+)',
      'output: intent · complexity · agent · depth · needsClaude · confidence',
      'confidence < 0.6 → escalate to Claude',
    ],
  },
  {
    n: '2',
    title: 'Responder · depth-controlled',
    sub: 'variable',
    color: 'accent',
    bullets: [
      'minimal/standard (think:false) · detailed/deep (think:true)',
      'system = persona + memory + ambient_context',
      'circuit-breaker open → Claude fallback (shared persona, same voice)',
    ],
  },
];

export type ArchTier = {
  label: string;
  tier: string;
  device: string;
  rows: Array<[string, string]>;
};

export const ARCH_TIER_CURRENT: ArchTier = {
  label: 'HARDWARE TIER · current',
  tier: 'Tier 1',
  device: '16GB · Mac Mini',
  rows: [
    ['local-fast', 'qwen3:8b'],
    ['local-reason', 'qwen3:8b (deep)'],
    ['local-coder', '→ claude'],
    ['local-embed', 'nomic-embed-text'],
    ['claude fallback', '20–30%'],
  ],
};

export const ARCH_TIER_TARGET: ArchTier = {
  label: 'TARGET TIER · when upgraded',
  tier: 'Tier 3',
  device: '128GB · Mac Studio',
  rows: [
    ['local-fast', 'qwen3:8b'],
    ['local-reason', 'qwen3.6:35b-a3b'],
    ['local-coder', 'coder:32b'],
    ['local-embed', 'bge-m3'],
    ['claude fallback', '<5%'],
  ],
};

export type ArchMetricColor = 'ok' | 'work' | 'secondary';
export type ArchMetric = [label: string, value: string, color: ArchMetricColor];

export const ARCH_METRICS: ArchMetric[] = [
  ['p50 latency', '2.1s', 'ok'],
  ['p95 latency', '8.4s', 'ok'],
  ['routing acc.', '96.3%', 'ok'],
  ['claude rate', '22%', 'work'],
  ['memory turns', '1,487', 'secondary'],
  ['up', '3d 14h', 'secondary'],
  ['retries / hr', '0.3', 'secondary'],
  ['circuit', 'closed', 'ok'],
];

export type MemoryStat = [label: string, value: string];

export const MEMORY_STATS: MemoryStat[] = [
  ['memories', '1,487'],
  ['turns', '34,220'],
  ['size', '612 MB'],
  ['FTS5', 'ready'],
];

export type MemoryToggle = {
  t: string;
  s: string;
  on: boolean;
};

export const MEMORY_TOGGLES: MemoryToggle[] = [
  { t: 'Distillation pass', s: 'after every turn · extracts facts · decisions · preferences · commitments', on: true },
  { t: 'Hybrid retrieval', s: 'BM25 (FTS5) + vector similarity via sqlite-vec · RRF fused top-5', on: true },
  { t: 'Nightly consolidation', s: 'per-agent summaries written to agent_journals · 03:00 local', on: true },
  { t: 'Markdown export', s: 'data/memory/YYYY-MM-DD.md · human-readable sidecar', on: true },
  { t: 'Obsidian vault sync', s: "daily commit to ~/vault · noel's notes + long-form knowledge", on: false },
];

export type NotificationRule = {
  w: string;
  c: string;
  s: string;
  on: boolean;
};

export const NOTIFICATION_RULES: NotificationRule[] = [
  { w: 'Proactive briefing', c: '08:00 daily · 18:00 EOD', s: 'Push', on: true },
  { w: 'High-risk approvals', c: 'irreversible · financial · send', s: 'Push + sound', on: true },
  { w: 'Medium-risk approvals', c: 'external-facing · above $100', s: 'Push', on: true },
  { w: 'Low-risk approvals', c: 'reversible · internal', s: 'Badge only', on: true },
  { w: 'Agent errors', c: 'blocked or failing agents', s: 'Push', on: true },
  { w: 'CI failures', c: 'main branch · production', s: 'Push', on: true },
  { w: 'Stalled tasks', c: 'not touched in 48h', s: 'Daily digest', on: true },
  { w: 'Memory corrections', c: 'when you correct a prior answer', s: 'Silent', on: false },
];

export type SafetyStatus = 'ok' | 'warn' | 'error';
export type SafetyRow = [label: string, detail: string, status: SafetyStatus];

export const SAFETY_ROWS: SafetyRow[] = [
  ['Ollama binding', '127.0.0.1:11434 (localhost only)', 'ok'],
  ['External content spotlighting', 'wrapped in <EXTERNAL_CONTENT> before injection', 'ok'],
  ['Secret storage', '.env · rotate quarterly · move to Keychain at v1.0', 'warn'],
  ['Agent name allowlist', 'validated against TEAM_NAMES', 'ok'],
  ['Audit log', 'hashes by default · --verbose for content', 'ok'],
  ['SQLite backups', 'daily to ~/Backups/anton · 30d retention', 'ok'],
  ['Circuit breaker', 'closed · 3 fails in 60s opens for 30s', 'ok'],
];

export const SAFETY_DESTRUCTIVE_ACTIONS = [
  'Production deploy',
  'Send email',
  'Post publicly',
  'Money movement',
  'Delete files',
  'Cancel subscription',
  'Schedule meeting',
  'Edit calendar',
];

export type VoiceStage = {
  k: string;
  impl: string;
  note: string;
};

export const VOICE_STAGES: VoiceStage[] = [
  { k: 'Wake word', impl: 'OpenWakeWord', note: '"Hey Anton"' },
  { k: 'STT', impl: 'whisper.cpp', note: 'base.en · 400ms' },
  { k: 'TTS', impl: 'kokoro-onnx', note: 'streaming · 100ms' },
  { k: 'Target E2E', impl: '<1.5s', note: 'end-of-speech → audio' },
];

export type VoiceBudget = [stage: string, budget: number, actual: number];

export const VOICE_BUDGETS: VoiceBudget[] = [
  ['VAD end-detect', 200, 200],
  ['STT', 400, 380],
  ['Brain (minimal)', 800, 740],
  ['TTS first token', 100, 120],
];

export const VOICE_MODES = ['Push to talk (default)', 'Continuous (opt-in)', 'Wake word only'] as const;
