export type CalendarEventKind = 'human' | 'anton' | 'hold';

export type CalendarEvent = {
  /** Day index into CALENDAR_DAYS (0-6). */
  d: number;
  /** Start offset in hours from 8am (grid top). Fractional allowed for half-hours. */
  s: number;
  /** Duration in hours. */
  h: number;
  k: CalendarEventKind;
  /** Event title shown in the block. */
  t: string;
  /** "With" line — attendee or context. */
  w?: string;
  /** Optional annotation shown in the detail panel. */
  note?: string;
};

export const CALENDAR_DAYS = ['MON 14', 'TUE 15', 'WED 16', 'THU 17', 'FRI 18', 'SAT 19', 'SUN 20'] as const;
export const CALENDAR_HOURS = ['8', '9', '10', '11', '12', '1', '2', '3', '4', '5', '6'] as const;
/** Index into CALENDAR_DAYS that renders with the "today" accent. */
export const CALENDAR_TODAY_INDEX = 3;
/** Offset (hours from 8am) where the "now" line is drawn on today's column. */
export const CALENDAR_NOW_OFFSET = 6.5;

export const CALENDAR_EVENTS: CalendarEvent[] = [
  { d: 0, s: 1, h: 1, k: 'human', t: 'Standup', w: 'team' },
  { d: 0, s: 3, h: 2, k: 'anton', t: 'Focus · PRD draft', w: 'held by Anton', note: 'Marcus drafting' },
  { d: 0, s: 7, h: 1, k: 'human', t: '1:1 Anna', w: 'Anna Kou' },

  { d: 1, s: 0.5, h: 1, k: 'human', t: 'Investor · Spark Capital', w: 'J. Pell' },
  { d: 1, s: 2, h: 3, k: 'anton', t: 'Deep research block', w: 'held by Anton', note: 'creator-tier pricing' },
  { d: 1, s: 6, h: 1, k: 'human', t: 'Gym', w: 'recurring' },

  { d: 2, s: 1, h: 1, k: 'human', t: 'Design review', w: 'Elena + Ada' },
  { d: 2, s: 3, h: 1.5, k: 'anton', t: 'Reshuffled · walk', w: 'moved from Fri', note: 'rain forecast' },
  { d: 2, s: 5, h: 1, k: 'human', t: 'Board prep', w: 'solo' },

  { d: 3, s: 0, h: 1, k: 'human', t: 'Standup', w: 'team' },
  { d: 3, s: 2, h: 1, k: 'hold', t: 'Focus · no meetings', w: 'protected' },
  { d: 3, s: 4, h: 2, k: 'human', t: 'Launch sync', w: 'Sarah + Riley' },
  { d: 3, s: 7, h: 1, k: 'anton', t: 'Email triage', w: 'held by Anton', note: '45 threads' },

  { d: 4, s: 1, h: 1, k: 'human', t: 'All-hands', w: '26 ppl' },
  { d: 4, s: 3, h: 2, k: 'anton', t: 'Weekly review', w: 'with Anton', note: 'proposed' },

  { d: 6, s: 2, h: 2, k: 'human', t: 'Family lunch', w: 'Mom + Dad' },
];

export type CalendarProposal = {
  t: string;
  r: string;
  conf: 'proposed' | 'suggested';
};

export const CALENDAR_PROPOSALS: CalendarProposal[] = [
  { t: 'Move "Design review" → Thu 2pm', r: 'Elena is OOO Wed', conf: 'suggested' },
  { t: 'Hold 3h block Fri afternoon', r: 'to finish creator-tier writeup', conf: 'proposed' },
  { t: 'Decline "Vendor pitch · Mon"', r: 'duplicate of Tues investor call', conf: 'suggested' },
];
