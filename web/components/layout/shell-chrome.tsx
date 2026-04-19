'use client';
// ShellChrome — URL-driven app frame. Composes Titlebar + LeftRail + route view +
// ApprovalTray + CommandBar + Cmd+K palette. Active route comes from usePathname,
// so nav is URL-native (back/forward, deep-linkable). Module rendering moved to
// per-route page.tsx; this component only owns the chrome.

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { ApprovalTray } from '@/components/layout/approval-tray';
import { CommandPalette } from '@/components/layout/command-palette';
import { Kbd } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import { isSection, NAV_ITEMS, type Route } from '@/lib/nav';
import { ROUTE_TRAY } from '@/lib/routes';

function Titlebar({ now, onOpenPalette }: { now: string; onOpenPalette: () => void }) {
  return (
    <header className="h-8 flex items-center gap-3.5 px-3.5 border-b border-border-subtle bg-page">
      <span className="mono text-xs text-accent tracking-[0.08em]">◉ ANTON</span>
      <span className="w-px h-3.5 bg-border-default" />
      <span className="mono small text-tertiary">noel · personal OS</span>
      <span className="flex-1" />
      <span className="mono small text-tertiary">{now} · 3d 14h</span>
      <span className="w-px h-3.5 bg-border-default" />
      <button
        type="button"
        onClick={onOpenPalette}
        className="mono small text-secondary bg-transparent border-0 cursor-pointer p-0 hover:text-primary"
      >
        <Kbd>⌘</Kbd> <Kbd>K</Kbd> <span className="ml-1">command</span>
      </button>
    </header>
  );
}

function LeftRail({ active }: { active: Route | null }) {
  return (
    <nav className="w-[220px] border-r border-border-subtle bg-page flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-px">
        {NAV_ITEMS.map((i, idx) => {
          if (isSection(i)) {
            return (
              <div
                key={`sec-${i.sec}`}
                className={cn(
                  'mono small caps text-tertiary tracking-[0.1em] text-[9px] px-2.5',
                  idx === 0 ? 'pt-0.5 pb-1.5' : 'pt-3 pb-1'
                )}
              >
                {i.sec}
              </div>
            );
          }
          const on = active === i.id;
          return (
            <Link
              key={i.id}
              href={`/${i.id}`}
              prefetch={false}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-[5px] rounded-md text-left text-[13px] cursor-pointer transition-colors no-underline',
                on ? 'bg-hover text-primary' : 'bg-transparent text-secondary hover:bg-hover/40'
              )}
            >
              <span className={cn('mono w-4', on ? 'text-accent' : 'text-tertiary')}>{i.glyph}</span>
              <span className="flex-1">{i.label}</span>
              {i.badge ? <span className="mono small text-work">{i.badge}</span> : null}
              <span className="mono small text-tertiary text-[10px]">{i.k}</span>
            </Link>
          );
        })}
      </div>
      <div className="px-3 py-2.5 border-t border-border-subtle flex-shrink-0">
        <div className="mono small text-secondary leading-[1.5] text-[10px]">
          <div>
            qwen3:8b <span className="text-ok">●</span> · mem 1,487
          </div>
          <div className="text-tertiary">claude ● fallback</div>
        </div>
      </div>
    </nav>
  );
}

function CommandBar() {
  return (
    <footer className="h-12 flex items-center px-4 gap-3 border-t border-border-subtle bg-page">
      <span className="mono text-accent">▸</span>
      <input
        placeholder="delegate, ask, or just type…"
        className="mono flex-1 bg-transparent border-0 outline-0 text-primary text-sm"
      />
      <span className="mono small text-tertiary">@local</span>
      <button
        type="button"
        className="mono small bg-transparent border border-border-default text-secondary px-2 py-[3px] rounded-chip cursor-pointer hover:text-primary"
      >
        mic
      </button>
      <Kbd>⌘</Kbd>
      <Kbd>⏎</Kbd>
    </footer>
  );
}

/** Pull the route segment out of a pathname like `/chat` → `chat`. */
function routeFromPath(path: string): Route | null {
  const seg = path.split('/').filter(Boolean)[0];
  return (seg as Route) ?? null;
}

export function ShellChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const active = routeFromPath(pathname);
  const trayMode = active ? ROUTE_TRAY[active] : 'normal';

  const [now, setNow] = useState('');
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const tick = () =>
      setNow(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((x) => !x);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Keep router reference alive for future programmatic nav from palette.
  void router;

  return (
    <div className="h-full flex flex-col bg-page">
      <Titlebar now={now} onOpenPalette={() => setPaletteOpen(true)} />
      <div className="flex-1 flex min-h-0">
        <LeftRail active={active} />
        <main className="flex-1 min-w-0 bg-page flex flex-col">{children}</main>
        {trayMode === 'normal' && (
          <aside className="w-[320px] border-l border-border-subtle bg-page">
            <ApprovalTray />
          </aside>
        )}
      </div>
      <CommandBar />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
