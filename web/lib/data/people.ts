export type Warmth = 'hot' | 'warm' | 'cold';
export type PersonTag = 'investor' | 'candidate' | 'peer' | 'press' | 'personal';

export type Person = {
  id: number;
  name: string;
  org: string;
  role: string;
  tag: PersonTag;
  warmth: Warmth;
  last: string;
  /** Anton's one-line note about the latest thread. */
  notes: string;
  /** Recent interaction history — each entry is [relative-time, short-description]. */
  history: Array<[string, string]>;
};

export const PEOPLE: Person[] = [
  {
    id: 0,
    name: 'Julia Pell',
    org: 'Spark Capital',
    role: 'Partner',
    tag: 'investor',
    warmth: 'hot',
    last: '2m',
    notes: 'Series A lead. Moving Tues call → Wed.',
    history: [
      ['2m', 'wants to move call to Wed'],
      ['2d', 'sent updated deck'],
      ['1w', 'intro call booked'],
      ['3w', 'warm intro from Cal'],
      ['4mo', 'first meet at SF dinner'],
    ],
  },
  {
    id: 1,
    name: 'Anna Kou',
    org: 'Vapor',
    role: 'VP Eng',
    tag: 'candidate',
    warmth: 'warm',
    last: '1h',
    notes: 'Open to conversation. Local-first ML fan.',
    history: [
      ['1h', 'positive hiring loop feedback'],
      ['1w', 'second conversation booked'],
      ['3w', 'initial intro call'],
    ],
  },
  {
    id: 2,
    name: 'Cal Werner',
    org: 'Folk',
    role: 'Friend',
    tag: 'personal',
    warmth: 'warm',
    last: '4h',
    notes: 'Dinner Fri. Ask about his Series B.',
    history: [
      ['4h', 'dinner Friday confirmed'],
      ['2w', 'last caught up at SF meetup'],
    ],
  },
  {
    id: 3,
    name: 'Sam Lau',
    org: 'Linear',
    role: 'Designer',
    tag: 'peer',
    warmth: 'warm',
    last: '2d',
    notes: 'Shared Anton onboarding flow for feedback.',
    history: [
      ['2d', 'sent Figma for review'],
      ['1mo', 'Q1 design sync'],
    ],
  },
  {
    id: 4,
    name: 'Tom Pritchett',
    org: 'a16z',
    role: 'Partner',
    tag: 'investor',
    warmth: 'cold',
    last: '3w',
    notes: 'Passed on seed. Re-engage at A.',
    history: [
      ['3w', 'passed on seed'],
      ['2mo', 'first pitch meeting'],
    ],
  },
  {
    id: 5,
    name: 'Mira Hayes',
    org: 'Stripe',
    role: 'Product lead',
    tag: 'peer',
    warmth: 'warm',
    last: '1w',
    notes: 'Intro for Priya next month.',
    history: [
      ['1w', 'offered Priya intro'],
      ['2mo', 'shared analytics template'],
    ],
  },
  {
    id: 6,
    name: 'Devon Reeves',
    org: 'solo',
    role: 'Writer',
    tag: 'press',
    warmth: 'warm',
    last: '5d',
    notes: 'Drafting piece on local-first AI tools.',
    history: [
      ['5d', 'requested interview'],
      ['2w', 'published similar piece'],
    ],
  },
  {
    id: 7,
    name: 'Leah Okafor',
    org: 'Figma',
    role: 'Eng',
    tag: 'candidate',
    warmth: 'cold',
    last: '2mo',
    notes: 'Paused search last quarter.',
    history: [['2mo', 'said search is paused']],
  },
];
