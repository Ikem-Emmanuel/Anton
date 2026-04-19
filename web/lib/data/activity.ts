export type ActivityType = 'tool' | 'think' | 'write' | 'search' | 'handoff' | 'complete' | 'approval' | 'system';

export type ActivityEvent = {
  t: string;
  agent: string;
  type: ActivityType;
  text: string;
  detail: string | null;
};

export const ACTIVITY: ActivityEvent[] = [
  { t: '14:02:17', agent: 'Marcus', type: 'tool', text: "read_file('specs/onboarding.md')", detail: '1,204 bytes · 12ms' },
  { t: '14:02:18', agent: 'Marcus', type: 'think', text: 'Planning PRD outline: 6 sections, 2 open questions.', detail: null },
  { t: '14:01:54', agent: 'Ada', type: 'write', text: 'Edited components/Sidebar.tsx', detail: '+48 -12' },
  { t: '14:01:30', agent: 'Kai', type: 'search', text: 'query: "laptop-class local llm"', detail: '43 results' },
  { t: '14:00:12', agent: 'Priya', type: 'tool', text: 'run_sql("SELECT cohort...")', detail: '0.82s · 714 rows' },
  { t: '13:58:44', agent: 'Sarah', type: 'handoff', text: '→ Kai: review launch copy for SEO tone', detail: null },
  { t: '13:57:02', agent: 'Felix', type: 'complete', text: 'Completed: "Add rate-limit middleware"', detail: '3 commits' },
  { t: '13:55:19', agent: 'James', type: 'approval', text: 'Requested approval: deploy v1.2', detail: 'pending' },
  { t: '13:54:00', agent: 'Anton', type: 'system', text: 'Daily briefing generated', detail: '8 items' },
];
