export type InboxKind = 'drafted' | 'filed' | 'approval' | 'review' | 'read' | 'archived' | 'flagged';

export type InboxThread = {
  id: number;
  from: string;
  subj: string;
  summary: string;
  t: string;
  k: InboxKind;
  unread: boolean;
  tags: string[];
  /** Optional original-message body (rendered in the detail pane). */
  body?: string;
  /** Optional Anton-drafted reply (rendered in the detail pane for k=drafted). */
  draft?: string;
};

export const INBOX: InboxThread[] = [
  {
    id: 0,
    from: 'Julia Pell · Spark',
    subj: 'Re: Series A deck',
    summary: 'Wants to move Tues call to Wed. Anton drafted a reply proposing Wed 2pm.',
    t: '2m',
    k: 'drafted',
    unread: true,
    tags: ['investor', 'fundraise'],
    body: 'Hey Noel,\n\nSomething came up Tuesday — can we push to Wednesday same time? Happy to work around your schedule. Also wanted to confirm the deck is in good shape for my partners.\n\n– Julia',
    draft:
      "Hi Julia — works for me. Wed 2pm? I'll have Anton send an updated calendar invite. Deck is ready; will ping you tomorrow with the final version.\n— Noel",
  },
  {
    id: 1,
    from: 'Stripe',
    subj: 'Invoice #4412',
    summary: 'Monthly subscription receipt, $847. Anton auto-filed to Finance.',
    t: '14m',
    k: 'filed',
    unread: false,
    tags: ['finance'],
    body: 'Your subscription invoice is attached. Amount charged: $847.00 USD to card ending 4412. Next billing date: May 14, 2025.',
  },
  {
    id: 2,
    from: 'Sarah (agent)',
    subj: 'Launch email copy · v3',
    summary: 'Asking you to review final copy before Anton sends to 2,340 subs.',
    t: '22m',
    k: 'approval',
    unread: true,
    tags: ['approval'],
    body: 'Final launch copy attached below. Waiting on your review before I (Sarah) ask Anton to queue the send. Kai signed off on SEO tone.',
  },
  {
    id: 3,
    from: 'Marcus (agent)',
    subj: 'PRD draft ready',
    summary: 'Onboarding v3 draft in memory. Open questions flagged for you.',
    t: '41m',
    k: 'review',
    unread: true,
    tags: ['product'],
    body: 'PRD draft is complete and saved to memory. Two open questions flagged in §3.2 around auth flow. Marcus.',
  },
  { id: 4, from: 'Anna Kou', subj: 'Hiring loop feedback', summary: 'Positive signal on Priya candidate. Anton extracted key quotes.', t: '1h', k: 'read', unread: false, tags: ['hiring'] },
  { id: 5, from: 'LinkedIn', subj: '6 new connection requests', summary: 'Anton auto-archived. 1 flagged (ex-Stripe PM) for your review.', t: '2h', k: 'archived', unread: false, tags: ['noise'] },
  { id: 6, from: 'Elena (agent)', subj: 'Social calendar Thu–Sun', summary: '4 posts scheduled. Threadwise copy attached, needs your OK.', t: '3h', k: 'approval', unread: true, tags: ['approval', 'marketing'] },
  {
    id: 7,
    from: 'Cal (friend)',
    subj: 'Dinner Friday?',
    summary: 'Anton held Fri 7–9pm tentatively. Reply drafted: yes.',
    t: '4h',
    k: 'drafted',
    unread: false,
    tags: ['personal'],
    draft: 'Yes — 7pm works. Where are you thinking?\n— N',
  },
  { id: 8, from: 'AWS Billing', subj: 'Usage alert — $1,240', summary: '30% over forecast. Anton flagged to Diana, who is investigating.', t: '6h', k: 'flagged', unread: false, tags: ['finance'] },
  { id: 9, from: 'Producthunt', subj: 'Weekly digest', summary: 'Anton archived. Nothing matched your watched keywords.', t: '9h', k: 'archived', unread: false, tags: ['noise'] },
];
