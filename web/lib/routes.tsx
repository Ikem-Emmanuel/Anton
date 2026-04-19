// Route registry — maps Route IDs to their view + tray mode. The dynamic
// [route]/page.tsx reads ROUTE_VIEWS to render the module; the layout chrome
// reads ROUTE_TRAY to decide whether the right-side ApprovalTray is shown.
// Splitting them lets the chrome stay module-free (lighter client bundle at
// the layout level). Modules register here; the shell knows nothing about
// individual module internals — dependency-inverted.

import type { ReactNode } from 'react';
import ActivityTimeline from '@/components/modules/activity-timeline';
import Briefing from '@/components/modules/briefing';
import Calendar from '@/components/modules/calendar';
import Chat from '@/components/modules/chat';
import Documents from '@/components/modules/documents';
import Expenses from '@/components/modules/expenses';
import Inbox from '@/components/modules/inbox';
import MemoryBrowser from '@/components/modules/memory-browser';
import MissionControl from '@/components/modules/mission-control';
import People from '@/components/modules/people';
import { ApprovalsHub, IntegrationsHub, Travel, Usage } from '@/components/modules/placeholders';
import Research from '@/components/modules/research';
import Settings from '@/components/modules/settings';
import Tasks from '@/components/modules/tasks';
import DeptChart from '@/components/modules/team';
import type { Route } from './nav';

export type TrayMode = 'normal' | 'hidden';

export const ROUTE_TRAY: Record<Route, TrayMode> = {
  mc: 'normal',
  brief: 'normal',
  pending: 'hidden',
  tasks: 'hidden',
  inbox: 'hidden',
  calendar: 'hidden',
  docs: 'hidden',
  chat: 'hidden',
  research: 'hidden',
  people: 'hidden',
  memory: 'normal',
  expenses: 'hidden',
  travel: 'hidden',
  usage: 'hidden',
  team: 'normal',
  log: 'normal',
  hands: 'hidden',
  settings: 'hidden',
};

export const ROUTE_VIEWS: Record<Route, ReactNode> = {
  mc: <MissionControl />,
  brief: <Briefing />,
  pending: <ApprovalsHub />,
  tasks: <Tasks />,
  inbox: <Inbox />,
  calendar: <Calendar />,
  docs: <Documents />,
  chat: <Chat />,
  research: <Research />,
  people: <People />,
  memory: <MemoryBrowser />,
  expenses: <Expenses />,
  travel: <Travel />,
  usage: <Usage />,
  team: <DeptChart />,
  log: <ActivityTimeline />,
  hands: <IntegrationsHub />,
  settings: <Settings />,
};
