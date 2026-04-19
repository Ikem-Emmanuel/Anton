'use client';
// Settings — tabbed container. Each tab owns its own file under ./;
// this module just renders the tab bar and the selected tab's content.

import { useState } from 'react';
import { cn } from '@/lib/cn';
import ArchitectureSettings from './architecture';
import MemorySettings from './memory';
import NotificationsSettings from './notifications';
import SafetySettings from './safety';
import TrustSettings from './trust';
import VoiceSettings from './voice';

type Tab = 'trust' | 'architecture' | 'memory' | 'notifications' | 'voice' | 'safety';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'trust', label: 'Trust tiers' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'memory', label: 'Memory' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'voice', label: 'Voice' },
  { id: 'safety', label: 'Safety' },
];

export default function Settings() {
  const [tab, setTab] = useState<Tab>('trust');
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="px-8 pt-6 pb-0">
        <div className="mono caps text-tertiary">SETTINGS</div>
        <h1 className="text-[26px] font-medium mt-1 mb-4">System</h1>
        <div className="flex gap-1 border-b border-border-subtle -mx-8 px-8">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                type="button"
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'mono small px-3 py-2 text-xs cursor-pointer border-b-2 -mb-px transition-colors',
                  active ? 'border-b-accent text-accent' : 'border-b-transparent text-secondary hover:text-primary'
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </header>
      <div className="flex-1 overflow-auto px-8 py-6">
        {tab === 'trust' && <TrustSettings />}
        {tab === 'architecture' && <ArchitectureSettings />}
        {tab === 'memory' && <MemorySettings />}
        {tab === 'notifications' && <NotificationsSettings />}
        {tab === 'voice' && <VoiceSettings />}
        {tab === 'safety' && <SafetySettings />}
      </div>
    </div>
  );
}
