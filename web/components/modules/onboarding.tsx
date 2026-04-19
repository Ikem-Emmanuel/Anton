'use client';
// Onboarding — first-run flow. Standalone surface: renders outside
// ShellChrome (lives at app/onboarding, not inside the (app) route group).
// For now this ports a single step (model selection). Steps 1, 3–5 can be
// added as additional components in this file or hoisted to their own
// files as the flow grows.

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/primitives';

type ModelCardProps = {
  label: string;
  name: string;
  sub: string;
  action: string;
};

function ModelCard({ label, name, sub, action }: ModelCardProps) {
  return (
    <div className="bg-surface border border-border-default rounded-card p-[18px] mb-3.5">
      <div className="mono small caps text-tertiary mb-2.5">{label}</div>
      <div className="flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-ok" />
        <div className="flex-1">
          <div className="mono text-sm">{name}</div>
          <div className="mono small text-tertiary">{sub}</div>
        </div>
        <Kbd>{action}</Kbd>
      </div>
    </div>
  );
}

export default function Onboarding() {
  return (
    <div className="h-screen w-screen flex items-center justify-center p-8 bg-page">
      <div className="w-[560px]">
        <div className="mono caps text-tertiary mb-1">STEP 2 / 5</div>
        <h1 className="text-[34px] font-medium tracking-[-0.02em] mb-2">Anton coming online.</h1>
        <p className="text-secondary text-[15px] mt-0 mb-7 leading-[1.6]">
          Point the system at your local model. Qwen3 8B via Ollama is recommended for now. Claude stays as a fallback
          for deep research.
        </p>

        <ModelCard label="Local model" name="qwen3:8b" sub="ollama · localhost:11434 · 4.3GB loaded" action="change" />
        <ModelCard
          label="Fallback"
          name="claude · sonnet-4.5"
          sub="used only for deep research + code generation"
          action="edit"
        />

        <div className="flex items-center gap-2.5 mt-6">
          <Button variant="secondary" className="px-4 py-2.5">
            Back
          </Button>
          <span className="flex-1" />
          <span className="mono small text-tertiary">takes ~30s</span>
          <Link href="/mc">
            <Button variant="primary" className="px-4 py-2.5 font-medium">
              Check the team →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
