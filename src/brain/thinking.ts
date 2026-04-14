// Adaptive Thinking — adjusts reasoning depth based on message complexity
//
// Qwen3 supports a /think mode where it reasons inside <think>...</think> tags
// before producing the final answer. We control when and how deep it thinks.
//
// Depth levels:
//   minimal:  No thinking. Direct response. ("hey" -> "Hey.")
//   standard: Brief think. One reasoning step. ("what time is standup?" -> checks, answers)
//   detailed: Multi-step think. Consider context and alternatives. (analysis, explanations)
//   deep:     Full chain-of-thought. Explore multiple angles, weigh tradeoffs. (strategy, architecture)

export type ThinkingDepth = 'minimal' | 'standard' | 'detailed' | 'deep';

// Build a system prompt that controls thinking depth
export function buildThinkingPrompt(baseSystem: string, depth: ThinkingDepth, agentContext?: string): string {
  const thinkingInstructions = getThinkingInstructions(depth);
  const contextBlock = agentContext ? `\n\nCurrent context: ${agentContext}` : '';

  return `${baseSystem}${contextBlock}\n\n${thinkingInstructions}`;
}

function getThinkingInstructions(depth: ThinkingDepth): string {
  switch (depth) {
    case 'minimal':
      return `Respond immediately and concisely. No analysis needed. 1-2 sentences max.
Do NOT use <think> tags. Just answer directly.`;

    case 'standard':
      return `Think briefly before responding. Consider the question, then give a clear answer.
Use <think> tags for your brief reasoning (1-2 sentences), then respond outside the tags.
Keep your response focused and under 3 sentences.`;

    case 'detailed':
      return `Think through this carefully before responding.
Use <think> tags to:
1. Identify what's being asked
2. Consider relevant context and facts
3. Think about the best approach

Then respond outside the tags with a thorough but readable answer.
Use bullet points or short paragraphs. Be specific, not vague.`;

    case 'deep':
      return `This requires deep reasoning. Think through it thoroughly.
Use <think> tags to:
1. Break down the problem into parts
2. Consider multiple approaches or perspectives
3. Evaluate tradeoffs and implications
4. Identify what you're uncertain about
5. Synthesize into a recommendation

Then respond outside the tags with a well-structured answer.
Include your reasoning, alternatives considered, and a clear recommendation.
Be honest about what you don't know.`;
  }
}

// Extract the visible response from a thinking-enabled response
// Strips <think>...</think> blocks from the output
export function extractResponse(rawResponse: string): {
  thinking: string | null;
  response: string;
} {
  const thinkMatch = rawResponse.match(/<think>([\s\S]*?)<\/think>/);
  const thinking = thinkMatch ? thinkMatch[1].trim() : null;
  const response = rawResponse.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  return { thinking, response };
}

// Determine thinking depth from classifier output
export function getThinkingDepth(intent: string, complexity: string, adaptiveDepth: string): ThinkingDepth {
  // Use the classifier's recommendation if available
  if (adaptiveDepth && ['minimal', 'standard', 'detailed', 'deep'].includes(adaptiveDepth)) {
    return adaptiveDepth as ThinkingDepth;
  }

  // Fallback: derive from intent + complexity
  if (intent === 'greeting' || intent === 'approval') return 'minimal';
  if (complexity === 'simple') return 'standard';
  if (complexity === 'complex') return 'detailed';
  if (complexity === 'extreme') return 'deep';
  return 'standard';
}

// Get temperature for thinking depth (deeper thinking = more deterministic)
export function getTemperatureForDepth(depth: ThinkingDepth): number {
  switch (depth) {
    case 'minimal':
      return 0.3;
    case 'standard':
      return 0.3;
    case 'detailed':
      return 0.2;
    case 'deep':
      return 0.1;
  }
}

// Get max tokens for thinking depth
export function getMaxTokensForDepth(depth: ThinkingDepth): number {
  switch (depth) {
    case 'minimal':
      return 128;
    case 'standard':
      return 512;
    case 'detailed':
      return 2048;
    case 'deep':
      return 4096;
  }
}
