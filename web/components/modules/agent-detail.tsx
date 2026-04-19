'use client';
// Agent detail — 5-tab view: Activity (timeline of this agent's events),
// Queue (pending work), Trust & tools (tier + history + allowed tools),
// Memory (accessible memories), Config (model/context/scope settings).
// Reached via /agent/[name].

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useState } from 'react';
import { BackBar } from '@/components/ui/back-bar';
import { Button } from '@/components/ui/button';
import { DeptChip, RiskPip, StatusGlow, TrustBadge } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import { ACTIVITY, AGENTS, type Agent, DEPARTMENTS, MEMORIES, type Memory } from '@/lib/data';

type TabId = 'activity' | 'queue' | 'trust' | 'memory' | 'config';

const TYPE_GLYPH: Record<Memory['type'], string> = {
  preference: '◇',
  decision: '◆',
  fact: '■',
  conversation: '▷',
};

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="mono caps small text-tertiary text-[10px] mb-0.5">{label}</div>
      <div className={cn('mono text-[15px]', color ?? 'text-primary')}>{value}</div>
    </div>
  );
}

function nowCopy(status: Agent['s']): string {
  if (status === 'working') return 'Drafting PRD for onboarding v3';
  if (status === 'error') return 'Blocked on mcp.tool timeout';
  if (status === 'complete') return 'Idle · last task complete';
  return 'Idle · available';
}

function ActivityTab({ agentName }: { agentName: string }) {
  const events = ACTIVITY.filter((e) => e.agent === agentName).concat([
    { t: '14:00:00', agent: agentName, type: 'think', text: 'Reading assignment from Anton.', detail: null },
    { t: '13:58:12', agent: agentName, type: 'tool', text: 'mcp.list_tools()', detail: '12 tools' },
  ]);
  return (
    <div>
      {events.map((e) => (
        <div
          key={`${e.t}-${e.text}`}
          className="grid gap-3.5 py-2.5 border-b border-border-subtle items-baseline"
          style={{ gridTemplateColumns: '80px 80px 1fr 120px' }}
        >
          <span className="mono small text-tertiary">{e.t}</span>
          <span className="mono small caps text-secondary text-[10px]">{e.type}</span>
          <span className="text-[13px] text-primary">{e.text}</span>
          <span className="mono small text-tertiary text-right">{e.detail ?? ''}</span>
        </div>
      ))}
    </div>
  );
}

function QueueTab({ agent }: { agent: Agent }) {
  if (!agent.q) {
    return <div className="mono small text-tertiary p-5 text-center">no tasks queued</div>;
  }
  const titles = ['Review PRD draft with Alex', 'Backfill onboarding tests', 'Update deploy runbook'];
  const risks: Array<'L' | 'M' | 'H'> = ['L', 'M', 'L'];
  return (
    <div>
      {Array.from({ length: agent.q }).map((_, i) => (
        <div
          key={i}
          className="p-3.5 bg-surface border border-border-default rounded-card mb-2 flex items-center gap-3.5"
        >
          <span className="mono text-tertiary w-5">{i + 1}</span>
          <div className="flex-1">
            <div className="text-[13px]">{titles[i % titles.length]}</div>
            <div className="mono small text-tertiary mt-0.5">queued 4m ago · from Anton</div>
          </div>
          <RiskPip r={risks[i % risks.length]} />
          <Button size="sm" variant="secondary">
            promote
          </Button>
        </div>
      ))}
    </div>
  );
}

const TRUST_DESC: Record<Agent['t'], { label: string; body: string }> = {
  green: {
    label: 'Autonomous',
    body: 'Acts without approval for low/medium risk. High risk actions still require confirmation.',
  },
  amber: {
    label: 'Ask first',
    body: 'Shows intent before any external write. Reads are autonomous.',
  },
  red: {
    label: 'Approve every action',
    body: 'Every action requires explicit approval.',
  },
};

function TrustTab({ agent }: { agent: Agent }) {
  const desc = TRUST_DESC[agent.t];
  return (
    <div className="grid grid-cols-2 gap-5">
      <div>
        <div className="mono caps small text-tertiary mb-2.5">Current tier</div>
        <div className="p-4 bg-surface border border-border-default rounded-card mb-4">
          <div className="flex items-center gap-2 mb-1.5">
            <TrustBadge tier={agent.t} />
            <span className="text-sm">{desc.label}</span>
          </div>
          <div className="mono small text-secondary">{desc.body}</div>
        </div>
        <div className="mono caps small text-tertiary mb-2.5">Allowed tools</div>
        <div className="flex flex-wrap gap-1.5">
          {['read_file', 'write_file', 'run_sql', 'search', 'mcp.slack', 'mcp.github', 'mcp.linear'].map((t) => (
            <span
              key={t}
              className="mono small px-2.5 py-1 bg-surface border border-border-default rounded-chip text-[11px] text-secondary"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <div>
        <div className="mono caps small text-tertiary mb-2.5">Trust history</div>
        <div className="border-l border-border-default pl-4">
          {[
            { d: 'Apr 14', ev: `Promoted to ${agent.t}`, by: 'Noel' },
            { d: 'Mar 28', ev: 'Completed 30 tasks w/o intervention', by: 'System' },
            { d: 'Mar 12', ev: 'Scoped to MCP tools only', by: 'Noel' },
            { d: 'Mar 01', ev: 'Onboarded', by: 'System' },
          ].map((h) => (
            <div key={h.d} className="mb-3.5 relative">
              <div className="absolute -left-5 top-1.5 w-[7px] h-[7px] rounded-[4px] bg-accent" />
              <div className="text-[13px]">{h.ev}</div>
              <div className="mono small text-tertiary">
                {h.d} · by {h.by}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MemoryTab({ agentName }: { agentName: string }) {
  return (
    <div>
      <div className="mono small text-tertiary mb-3">Memories {agentName} has access to</div>
      {MEMORIES.slice(0, 4).map((m, i) => (
        <Link
          key={m.title}
          href={`/memory/${i}`}
          className="flex gap-3 items-start p-3 border-b border-border-subtle cursor-pointer hover:bg-hover"
        >
          <span className="mono text-tertiary w-5">{TYPE_GLYPH[m.type]}</span>
          <div className="flex-1">
            <div className="text-[13px]">{m.title}</div>
            <div className="mono small text-tertiary mt-0.5">{m.src}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ConfigTab({ agent }: { agent: Agent }) {
  const rows: Array<[string, string]> = [
    ['Model', agent.t === 'red' ? 'claude-opus (forced review)' : 'qwen3:8b (local)'],
    ['Context window', '128k tokens'],
    ['Max parallel', '3 tool calls'],
    ['Retry policy', '2x on timeout, escalate on 3rd'],
    ['Handoff partners', 'Anton, Alex, Ada'],
    ['Scope', agent.d === 'eng' ? 'repo:*, fs:project/*, shell:allowlist' : 'fs:project/*, mcp:*'],
  ];
  return (
    <div className="max-w-[560px]">
      {rows.map(([k, v]) => (
        <div key={k} className="flex py-2.5 border-b border-border-subtle">
          <span className="mono small caps text-tertiary w-[140px]">{k}</span>
          <span className="mono small text-primary flex-1">{v}</span>
          <button type="button" className="bg-none border-0 text-accent cursor-pointer text-[11px]">
            edit
          </button>
        </div>
      ))}
    </div>
  );
}

function AgentHero({ agent }: { agent: Agent }) {
  const dept = DEPARTMENTS.find((x) => x.id === agent.d);
  return (
    <div className="px-6 py-5 border-b border-border-subtle flex gap-6 items-start">
      <div
        className="w-[72px] h-[72px] rounded-card flex items-center justify-center bg-surface mono text-[22px] tracking-[0.05em]"
        style={{ borderWidth: 1, borderStyle: 'solid', borderColor: dept?.color, color: dept?.color }}
      >
        {agent.k}
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2.5 mb-1">
          <h1 className="text-[22px] m-0 text-primary">{agent.n}</h1>
          <StatusGlow s={agent.s} />
          <TrustBadge tier={agent.t} />
          <DeptChip id={agent.d} />
        </div>
        <div className="text-secondary text-[13px] mb-2.5">{agent.r} · reports to Anton</div>
        <div className="flex gap-6">
          <Stat label="Uptime" value="3d 14h" />
          <Stat label="Tasks today" value="18" />
          <Stat label="Success" value="94%" color="text-ok" />
          <Stat label="Avg latency" value="340ms" />
          <Stat label="Tokens" value="24.1k" />
          <Stat label="Model" value="qwen3:8b" />
        </div>
      </div>
      <div className="w-[280px] p-3.5 bg-surface border border-border-default rounded-card">
        <div className="mono small caps text-tertiary mb-2">Now</div>
        <div className="text-[13px] text-primary mb-1.5">{nowCopy(agent.s)}</div>
        <div className="mono small text-tertiary">
          {agent.q ? `${agent.q} queued task${agent.q > 1 ? 's' : ''} · est 22m` : 'nothing queued'}
        </div>
        {agent.s === 'error' && (
          <Button variant="primary" size="sm" className="mt-2.5 w-full">
            resolve →
          </Button>
        )}
      </div>
    </div>
  );
}

export function AgentDetail({ name }: { name: string }) {
  const agent = AGENTS.find((x) => x.n === name);
  if (!agent) notFound();
  const [tab, setTab] = useState<TabId>('activity');
  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'activity', label: 'Activity' },
    { id: 'queue', label: `Queue (${agent.q ?? 0})` },
    { id: 'trust', label: 'Trust & tools' },
    { id: 'memory', label: 'Memory' },
    { id: 'config', label: 'Config' },
  ];
  return (
    <div className="h-full flex flex-col">
      <BackBar
        label={`${agent.n} · ${agent.r}`}
        crumb="Team"
        crumbHref="/team"
        extras={
          <div className="flex gap-1.5">
            <Button size="sm" variant="secondary">
              delegate
            </Button>
            <Button size="sm" variant="secondary">
              pause
            </Button>
            <Button size="sm" variant="primary">
              chat →
            </Button>
          </div>
        }
      />
      <AgentHero agent={agent} />
      <div className="flex gap-0 px-5 border-b border-border-subtle">
        {tabs.map((t) => (
          <button
            type="button"
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'mono small px-3.5 py-2.5 text-xs cursor-pointer border-b-2 -mb-px bg-transparent',
              tab === t.id ? 'border-b-accent text-accent' : 'border-b-transparent text-secondary hover:text-primary'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto px-6 py-4">
        {tab === 'activity' && <ActivityTab agentName={agent.n} />}
        {tab === 'queue' && <QueueTab agent={agent} />}
        {tab === 'trust' && <TrustTab agent={agent} />}
        {tab === 'memory' && <MemoryTab agentName={agent.n} />}
        {tab === 'config' && <ConfigTab agent={agent} />}
      </div>
    </div>
  );
}
