import type { Risk } from './primitives';

export type TaskColumn = 'incoming' | 'flight' | 'done' | 'blocked';

export type Task = {
  id: number;
  title: string;
  /** Who owns the next move. Noel, an agent name, or Anton. */
  owner: string;
  /** Who is currently acting on it. Often same as owner; diverges when Anton is doing it on someone's behalf. */
  actor: string;
  col: TaskColumn;
  age: string;
  risk?: Risk;
  why?: string;
  /** Progress % for in-flight tasks. */
  pct?: number;
  /** Current sub-step for in-flight tasks. */
  step?: string;
};

export const TASKS: Task[] = [
  { id: 0, title: 'Review launch email copy', owner: 'Noel', actor: 'Sarah', col: 'incoming', age: '22m', risk: 'M', why: 'Waiting on your approval before send' },
  { id: 1, title: 'Decide: creator-tier pricing', owner: 'Noel', actor: 'Alex', col: 'incoming', age: '2h', risk: 'M', why: "Blocking Marcus's PRD §4" },
  { id: 2, title: 'Sign Q2 engagement letter', owner: 'Noel', actor: 'Diana', col: 'incoming', age: '1d', risk: 'L', why: 'Legal needs your signature' },
  { id: 3, title: 'Draft PRD · onboarding v3', owner: 'Marcus', actor: 'Marcus', col: 'flight', age: '1h', pct: 68, step: 'writing §5 error flows' },
  { id: 4, title: 'Keyword research · creator tier', owner: 'Kai', actor: 'Kai', col: 'flight', age: '8m', pct: 42, step: 'clustered 84 of 200 queries' },
  { id: 5, title: 'Retention cohort rebuild', owner: 'Priya', actor: 'Priya', col: 'flight', age: '46s', pct: 12, step: 'running SQL · 714 rows so far' },
  { id: 6, title: 'Draft reply to Julia Pell', owner: 'Anton', actor: 'Anton', col: 'flight', age: '2m', pct: 100, step: 'ready for your review' },
  { id: 7, title: 'Pushed v1.2 to staging', owner: 'James', actor: 'James', col: 'done', age: '6m' },
  { id: 8, title: 'Filed Stripe invoice $847', owner: 'Anton', actor: 'Anton', col: 'done', age: '14m' },
  { id: 9, title: 'Archived 6 LinkedIn threads', owner: 'Anton', actor: 'Anton', col: 'done', age: '2h' },
  { id: 10, title: 'Reviewed Priya candidate', owner: 'Anna', actor: 'Anna', col: 'done', age: '1h' },
  { id: 11, title: 'Deploy v1.2 to production', owner: 'James', actor: 'James', col: 'blocked', age: '42m', why: 'needs your approval (red tier)' },
  { id: 12, title: 'Send launch email', owner: 'Sarah', actor: 'Sarah', col: 'blocked', age: '22m', why: 'blocked on Noel review of copy' },
];
