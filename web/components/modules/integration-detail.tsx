'use client';
// Integration detail — per-service hub with scopes, assigned agents,
// recent activity, and health stats. Reached via /integration/[id] from
// the IntegrationsHub grid.

import { notFound } from 'next/navigation';
import { BackBar } from '@/components/ui/back-bar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { AGENTS, INTEGRATIONS } from '@/lib/data';

const RECENT: Array<[string, string, string]> = [
  ['14:02', 'Sarah', 'posted to #launch'],
  ['13:41', 'Marcus', 'read #eng-standup'],
  ['12:58', 'Anton', 'fetched thread for memory'],
  ['12:02', 'Kai', 'posted to #marketing'],
  ['11:18', 'Sarah', 'drafted reply, held for review'],
];

const HEALTH: Array<[string, string]> = [
  ['Rate limit', '412 / 5000 / hr'],
  ['Last error', '—'],
  ['Avg latency', '180ms'],
  ['Uptime (30d)', '99.7%'],
];

export function IntegrationDetail({ id }: { id: string }) {
  const it = INTEGRATIONS.find((x) => x.id === id);
  if (!it) notFound();

  const isConnected = it.status === 'ok';
  return (
    <div className="h-full flex flex-col">
      <BackBar
        label={it.name}
        crumb="Hands"
        crumbHref="/hands"
        extras={
          <div className="flex gap-1.5">
            <Button size="sm" variant="secondary">
              re-auth
            </Button>
            <Button size="sm" variant="secondary" className="text-error">
              disconnect
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto">
        <div className="px-8 py-6 border-b border-border-subtle flex gap-5 items-center">
          <div className="w-16 h-16 rounded-[12px] bg-surface border border-border-default flex items-center justify-center mono text-2xl text-accent">
            {it.name[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-[22px] m-0 mb-1.5">{it.name}</h1>
            <div className="mono small text-tertiary">
              {it.cat} · connected via OAuth · {it.last ? `since ${it.last}` : 'pending'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'pulse w-2 h-2 rounded-full',
                isConnected ? 'bg-ok' : it.status === 'error' ? 'bg-error' : 'bg-work'
              )}
            />
            <span
              className={cn(
                'mono small caps',
                isConnected ? 'text-ok' : it.status === 'error' ? 'text-error' : 'text-work'
              )}
            >
              {it.status}
            </span>
          </div>
        </div>

        <div className="px-8 py-6 grid grid-cols-2 gap-8 max-w-[1100px]">
          <div>
            <div className="mono caps small text-tertiary mb-2.5">Scopes granted</div>
            {it.scopes.length > 0 ? (
              it.scopes.map((s) => (
                <div key={s} className="py-2.5 border-b border-border-subtle flex items-center gap-2.5">
                  <span className="text-ok">✓</span>
                  <span className="mono small text-primary">{s}</span>
                </div>
              ))
            ) : (
              <div className="mono small text-tertiary py-2.5">No scopes — not connected.</div>
            )}

            <div className="mono caps small text-tertiary mt-6 mb-2.5">Which agents use it</div>
            {AGENTS.slice(0, 5).map((a, i) => (
              <div key={a.n} className="py-2 border-b border-border-subtle flex justify-between items-center">
                <span className="text-[13px]">{a.n}</span>
                <span className="mono small text-tertiary">{10 + i * 7} calls / wk</span>
              </div>
            ))}
          </div>

          <div>
            <div className="mono caps small text-tertiary mb-2.5">Recent activity</div>
            {RECENT.map(([t, agent, ev]) => (
              <div
                key={`${t}-${agent}`}
                className="py-2.5 border-b border-border-subtle grid gap-3 items-baseline"
                style={{ gridTemplateColumns: '60px 90px 1fr' }}
              >
                <span className="mono small text-tertiary">{t}</span>
                <span className="text-[13px]">{agent}</span>
                <span className="mono small text-secondary">{ev}</span>
              </div>
            ))}

            <div className="mono caps small text-tertiary mt-6 mb-2.5">Health</div>
            <div className="p-3.5 bg-surface border border-border-default rounded-card">
              {HEALTH.map(([k, v]) => (
                <div key={k} className="flex py-1.5 justify-between">
                  <span className="mono small text-tertiary">{k}</span>
                  <span className="mono small text-primary">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
