// Simulation mode — fixture-based brain.process() replacement.
//
// When ANTON_SIM_MODE=1 is set AND a fixture is loaded, brain.process() consumes
// pre-recorded agent responses step-by-step instead of calling Ollama/Claude.
// This gives deterministic, fast, Ollama-free multi-agent scenario tests — the
// difference between "each scenario takes 60+ seconds and may time out" and
// "all 5 scenarios pass in ~1 second in CI".
//
// A fixture defines an ordered sequence of (expected-agent, matcher, response)
// triples. The sim module walks the sequence as brain.process() is called,
// verifies the expected agent was asked, and returns the pre-recorded response.
//
// Mismatches (wrong agent, input doesn't match, sequence exhausted) are surfaced
// as warnings — the test runner asserts zero warnings for a scenario to pass.

export interface SimResponse {
  text: string;
  model?: string;
  handledLocally?: boolean;
  needsClaude?: boolean;
  handoffs?: Array<{ agent: string; message: string }>;
  classification?: {
    intent: string;
    depth: 'minimal' | 'standard' | 'detailed' | 'deep';
    confidence: number;
    route: string;
    reason: string;
  };
  latencyMs?: number;
  tokensIn?: number;
  tokensOut?: number;
}

export interface SimStep {
  agent: string; // expected agent identity (from brain.process options.agent, defaults 'Anton')
  matchInput?: string; // optional substring that the input must contain
  response: SimResponse;
}

export interface SimFixture {
  scenario: string;
  steps: SimStep[];
}

export interface SimWarning {
  stepIndex: number;
  kind: 'wrong-agent' | 'input-mismatch' | 'sequence-exhausted';
  expected: string;
  actual: string;
}

let activeFixture: SimFixture | null = null;
let stepIndex = 0;
const warnings: SimWarning[] = [];

export function loadFixture(fixture: SimFixture): void {
  activeFixture = fixture;
  stepIndex = 0;
  warnings.length = 0;
}

export function resetSim(): void {
  activeFixture = null;
  stepIndex = 0;
  warnings.length = 0;
}

export function isSimModeActive(): boolean {
  return process.env.ANTON_SIM_MODE === '1' && activeFixture !== null;
}

export function getSimWarnings(): readonly SimWarning[] {
  return warnings.slice();
}

export function getSimProgress(): { done: number; total: number; scenario: string | null } {
  return {
    done: stepIndex,
    total: activeFixture?.steps.length ?? 0,
    scenario: activeFixture?.scenario ?? null,
  };
}

// Called by brain.process() when sim mode is active. Consumes the next step.
export function nextSimResponse(input: string, agent: string): SimResponse | null {
  if (!activeFixture) return null;
  const step = activeFixture.steps[stepIndex];

  if (!step) {
    warnings.push({
      stepIndex,
      kind: 'sequence-exhausted',
      expected: 'no more steps',
      actual: `${agent}: ${input.slice(0, 80)}`,
    });
    return null;
  }

  if (step.agent !== agent) {
    warnings.push({
      stepIndex,
      kind: 'wrong-agent',
      expected: step.agent,
      actual: agent,
    });
  }

  if (step.matchInput && !input.toLowerCase().includes(step.matchInput.toLowerCase())) {
    warnings.push({
      stepIndex,
      kind: 'input-mismatch',
      expected: step.matchInput,
      actual: input.slice(0, 120),
    });
  }

  stepIndex++;
  return step.response;
}
