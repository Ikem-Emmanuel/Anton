export type DocFolder = 'all' | 'product' | 'marketing' | 'board' | 'data' | 'eng' | 'fundraise' | 'personal';
export const DOC_FOLDERS: DocFolder[] = ['all', 'product', 'marketing', 'board', 'data', 'eng', 'fundraise', 'personal'];

export type DocKind = 'md' | 'pdf' | 'sheet';
export type DocTagColor = 'work' | 'tertiary' | 'info' | 'accent' | 'ok';

export type Document = {
  id: number;
  name: string;
  author: string;
  kind: DocKind;
  edited: string;
  size: string;
  tag: string;
  tagColor: DocTagColor;
  folder: Exclude<DocFolder, 'all'>;
  /** Anton's one-paragraph summary shown above the body. */
  summary: string;
};

export const DOCUMENTS: Document[] = [
  {
    id: 0,
    name: 'Onboarding v3 — PRD',
    author: 'Marcus',
    kind: 'md',
    edited: '2m',
    size: '4.1KB',
    tag: 'needs review',
    tagColor: 'work',
    folder: 'product',
    summary:
      'Marcus drafted a 6-section PRD. §3 auth flow and §5 error states have open questions flagged for you. No external commitments.',
  },
  {
    id: 1,
    name: 'Creator-tier pricing analysis',
    author: 'Alex',
    kind: 'md',
    edited: '14m',
    size: '8.7KB',
    tag: 'draft',
    tagColor: 'tertiary',
    folder: 'product',
    summary: "Alex proposes three tiers ($9 / $19 / $49) with analysis of comp set. Uses data from Priya's cohort pull.",
  },
  {
    id: 2,
    name: 'Launch email · v3',
    author: 'Sarah',
    kind: 'md',
    edited: '22m',
    size: '1.2KB',
    tag: 'needs review',
    tagColor: 'work',
    folder: 'marketing',
    summary: "Sarah's final v3 copy. Kai signed off on SEO tone. Ready to send to 2,340 subs once you approve.",
  },
  {
    id: 3,
    name: 'Q1 launch retro',
    author: 'Noel',
    kind: 'md',
    edited: '1h',
    size: '2.8KB',
    tag: 'personal',
    tagColor: 'info',
    folder: 'personal',
    summary: 'Summary generated from document content. Key points surfaced above. Full text follows.',
  },
  {
    id: 4,
    name: 'Board deck · April',
    author: 'Anton',
    kind: 'pdf',
    edited: '3h',
    size: '1.8MB',
    tag: 'assembled',
    tagColor: 'accent',
    folder: 'board',
    summary: 'Anton assembled the April board deck from team updates + financials. Ready for your review.',
  },
  {
    id: 5,
    name: 'Retention cohort · week 16',
    author: 'Priya',
    kind: 'sheet',
    edited: '5h',
    size: '42KB',
    tag: 'fresh',
    tagColor: 'ok',
    folder: 'data',
    summary: 'Priya rebuilt the weekly retention cohort; day-1 activation up 18% vs last week.',
  },
  {
    id: 6,
    name: 'Engineering weekly',
    author: 'Marcus',
    kind: 'md',
    edited: '1d',
    size: '3.4KB',
    tag: 'archived',
    tagColor: 'tertiary',
    folder: 'eng',
    summary: "Marcus's weekly eng summary. Archived because the next cycle started.",
  },
  {
    id: 7,
    name: 'Series A deck',
    author: 'Noel',
    kind: 'pdf',
    edited: '2d',
    size: '2.1MB',
    tag: 'shared',
    tagColor: 'info',
    folder: 'fundraise',
    summary: 'Shared with Spark Capital. Anton tracked opens + time-spent-per-slide.',
  },
  {
    id: 8,
    name: 'Brand voice guide',
    author: 'Sarah',
    kind: 'md',
    edited: '1w',
    size: '5.9KB',
    tag: 'canon',
    tagColor: 'accent',
    folder: 'marketing',
    summary: "Canon reference. Sarah's brand voice guide — all agent-drafted copy is auto-checked against it.",
  },
];
