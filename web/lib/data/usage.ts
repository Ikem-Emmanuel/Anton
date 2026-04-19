export type UsageMetric = {
  k: string;
  v: string;
  sub: string;
  trend: string;
};

export const USAGE_METRICS: UsageMetric[] = [
  { k: 'LLM tokens', v: '4.2M', sub: '3.8M local · 430K cloud', trend: '+18%' },
  { k: 'Tool calls', v: '14,328', sub: 'reads 8.1K · writes 2.2K', trend: '+5%' },
  { k: 'Anton wake time', v: '41h', sub: 'of 168h possible', trend: '−3%' },
  { k: 'Cloud cost', v: '$47.20', sub: 'claude · deep research only', trend: '+12%' },
];

export type UsageByAgent = {
  a: string;
  tok: number;
  calls: number;
  cost: number;
  /** 0-100 bar width. */
  bar: number;
};

export const USAGE_BY_AGENT: UsageByAgent[] = [
  { a: 'Marcus', tok: 980, calls: 4200, cost: 12.4, bar: 95 },
  { a: 'Kai', tok: 640, calls: 2100, cost: 8.1, bar: 65 },
  { a: 'Alex', tok: 520, calls: 1900, cost: 11.8, bar: 58 },
  { a: 'Priya', tok: 410, calls: 1400, cost: 4.2, bar: 44 },
  { a: 'Sarah', tok: 380, calls: 1100, cost: 3.8, bar: 40 },
  { a: 'Ada', tok: 320, calls: 980, cost: 2.1, bar: 34 },
  { a: 'James', tok: 240, calls: 620, cost: 1.9, bar: 25 },
  { a: 'others', tok: 720, calls: 2028, cost: 2.9, bar: 52 },
];

export type UsageDay = { d: string; v: number };

export const USAGE_DAYS: UsageDay[] = [
  { d: 'Mon', v: 620 },
  { d: 'Tue', v: 840 },
  { d: 'Wed', v: 710 },
  { d: 'Thu', v: 980 },
  { d: 'Fri', v: 540 },
  { d: 'Sat', v: 240 },
  { d: 'Sun', v: 270 },
];
