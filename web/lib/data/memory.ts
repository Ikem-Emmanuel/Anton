export type Memory = {
  type: 'preference' | 'decision' | 'fact' | 'conversation';
  title: string;
  src: string;
  hl: 'yellow' | 'coral' | 'blue';
  conf: number;
};

export const MEMORIES: Memory[] = [
  {
    type: 'preference',
    title: 'Noel prefers bullet summaries over prose in briefings.',
    src: 'Slack · Mar 3',
    hl: 'yellow',
    conf: 3,
  },
  {
    type: 'decision',
    title: 'Use Qwen3 8B for local; Claude only for deep research.',
    src: 'Settings · Feb 19',
    hl: 'coral',
    conf: 3,
  },
  {
    type: 'fact',
    title: 'Stripe subscription renews on the 14th of each month.',
    src: 'Diana · Mar 14',
    hl: 'blue',
    conf: 3,
  },
  {
    type: 'decision',
    title: 'Deploys after 6pm require explicit approval.',
    src: 'James · Mar 28',
    hl: 'coral',
    conf: 2,
  },
  {
    type: 'preference',
    title: 'Do not use emoji in customer-facing copy.',
    src: 'Sarah · Feb 2',
    hl: 'yellow',
    conf: 3,
  },
  {
    type: 'conversation',
    title: 'Debrief on Q1 launch — pivot to creator tier.',
    src: 'Voice · Apr 3',
    hl: 'blue',
    conf: 2,
  },
  { type: 'fact', title: 'Mac Studio arriving Apr 22.', src: 'Calendar · Apr 1', hl: 'yellow', conf: 3 },
];
