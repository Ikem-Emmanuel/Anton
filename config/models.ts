// Model routing configuration
// This is the ONLY file that changes when you upgrade hardware.
// Current: Tier 1 (16GB Mac) — single model at a time, swap on task type
// Target:  Tier 2 (64GB Mac Studio) — multiple models loaded simultaneously

export interface ModelConfig {
  provider: 'ollama' | 'claude';
  model: string;
  maxTokens: number;
  temperature?: number;
  description: string;
}

export const models: Record<string, ModelConfig> = {
  // --- Local models (free, via Ollama) ---

  'local-fast': {
    provider: 'ollama',
    model: 'qwen3:8b',
    maxTokens: 2048,
    temperature: 0.3,
    description: 'Primary brain — conversations, routing, delegation (Qwen3 8B, think:false)',
  },

  'local-coder': {
    provider: 'ollama',
    model: 'qwen2.5-coder:7b',
    maxTokens: 8192,
    temperature: 0.2,
    description: 'Code generation, code review, technical tasks',
  },

  'local-embed': {
    provider: 'ollama',
    model: 'nomic-embed-text',
    maxTokens: 8192,
    description: 'Embeddings for RAG (ChromaDB indexing and search)',
  },

  // --- Claude models (paid, via CLI subscription) ---

  'claude-sonnet': {
    provider: 'claude',
    model: 'sonnet',
    maxTokens: 16384,
    description: 'Complex code, research, analysis — best quality for hard tasks',
  },

  'claude-opus': {
    provider: 'claude',
    model: 'opus',
    maxTokens: 16384,
    description: 'Deep strategy, architecture, novel problem-solving — rare use',
  },
};

// Routing: task type -> model
export const taskRouting: Record<string, string> = {
  greeting: 'local-fast',
  status: 'local-fast',
  question_simple: 'local-fast',
  question_complex: 'local-fast', // Tier 1: 8B handles. Tier 2: switch to local-70b
  delegation: 'local-fast',
  classification: 'local-fast',
  memory_query: 'local-fast',
  code_generation: 'claude-sonnet', // Always Claude for code quality
  code_review: 'claude-sonnet',
  web_research: 'claude-sonnet',
  deep_analysis: 'claude-opus',
  finance: 'local-fast', // LLM interprets pre-computed data only
  embedding: 'local-embed',
};

// Ollama connection
export const ollamaConfig = {
  host: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434',
  timeout: 30_000,
};

// Claude CLI connection
export const claudeConfig = {
  command: 'claude',
  flags: '-p',
  defaultModel: 'sonnet',
};

// Hardware tier detection
import { totalmem } from 'node:os';

export function detectTier(): 1 | 2 | 3 {
  const totalRAM = Math.round(totalmem() / 1024 / 1024 / 1024);
  if (totalRAM >= 96) return 3;
  if (totalRAM >= 48) return 2;
  return 1;
}
