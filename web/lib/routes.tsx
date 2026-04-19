// Route registry — maps Route IDs to their view + tray mode. Shell reads
// this to render; modules register here. Dependency-inverted: shell knows
// nothing about individual module internals.

import type { ReactNode } from 'react';
import ActivityTimeline from '@/components/modules/activity-timeline';
import Briefing from '@/components/modules/briefing';
import MemoryBrowser from '@/components/modules/memory-browser';
import MissionControl from '@/components/modules/mission-control';
import {
  ApprovalsHub,
  Calendar,
  Chat,
  Documents,
  Expenses,
  Inbox,
  IntegrationsHub,
  People,
  Research,
  Tasks,
  Travel,
  Usage,
} from '@/components/modules/placeholders';
import Settings from '@/components/modules/settings';
import DeptChart from '@/components/modules/team';
import type { Route } from './nav';

export type TrayMode = 'normal' | 'hidden';

export interface RouteView {
  render: ReactNode;
  tray: TrayMode;
}

export const ROUTE_VIEWS: Record<Route, RouteView> = {
  mc: { render: <MissionControl />, tray: 'normal' },
  brief: { render: <Briefing />, tray: 'normal' },
  pending: { render: <ApprovalsHub />, tray: 'hidden' },
  tasks: { render: <Tasks />, tray: 'hidden' },
  inbox: { render: <Inbox />, tray: 'hidden' },
  calendar: { render: <Calendar />, tray: 'hidden' },
  docs: { render: <Documents />, tray: 'hidden' },
  chat: { render: <Chat />, tray: 'hidden' },
  research: { render: <Research />, tray: 'hidden' },
  people: { render: <People />, tray: 'hidden' },
  memory: { render: <MemoryBrowser />, tray: 'normal' },
  expenses: { render: <Expenses />, tray: 'hidden' },
  travel: { render: <Travel />, tray: 'hidden' },
  usage: { render: <Usage />, tray: 'hidden' },
  team: { render: <DeptChart />, tray: 'normal' },
  log: { render: <ActivityTimeline />, tray: 'normal' },
  hands: { render: <IntegrationsHub />, tray: 'hidden' },
  settings: { render: <Settings />, tray: 'hidden' },
};
