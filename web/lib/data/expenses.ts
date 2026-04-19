export type ExpenseCat = {
  name: string;
  amt: number;
  pct: number;
  color: string;
  flagged: boolean;
};

export const EXPENSE_CATS: ExpenseCat[] = [
  { name: 'infra', amt: 1240, pct: 32, color: '#E4938E', flagged: true },
  { name: 'saas', amt: 847, pct: 22, color: '#FBDA83', flagged: false },
  { name: 'people', amt: 620, pct: 16, color: '#8DBBFF', flagged: false },
  { name: 'marketing', amt: 450, pct: 12, color: '#A6D89C', flagged: false },
  { name: 'travel', amt: 380, pct: 10, color: '#C5A8F0', flagged: false },
  { name: 'other', amt: 302, pct: 8, color: '#F0B780', flagged: false },
];

export type ExpenseFlag = 'ok' | 'warn';

export type Transaction = {
  date: string;
  vendor: string;
  cat: string;
  amt: number;
  anton: string;
  flag: ExpenseFlag;
};

export const TRANSACTIONS: Transaction[] = [
  { date: 'Apr 14', vendor: 'AWS', cat: 'infra', amt: 1240, anton: 'flagged · 30% over forecast', flag: 'warn' },
  { date: 'Apr 14', vendor: 'Stripe (billing)', cat: 'saas', amt: 847, anton: 'auto-filed · recurring', flag: 'ok' },
  { date: 'Apr 13', vendor: 'Anthropic API', cat: 'infra', amt: 124, anton: 'auto-filed', flag: 'ok' },
  { date: 'Apr 12', vendor: 'Delta (SFO→NYC)', cat: 'travel', amt: 380, anton: 'matched to board trip', flag: 'ok' },
  { date: 'Apr 11', vendor: 'Figma', cat: 'saas', amt: 45, anton: 'auto-filed · recurring', flag: 'ok' },
  { date: 'Apr 10', vendor: 'LinkedIn Ads', cat: 'marketing', amt: 240, anton: 'Riley campaign · launch', flag: 'ok' },
  { date: 'Apr 09', vendor: 'Brex card ·4412', cat: 'other', amt: 89, anton: 'flagged · no description', flag: 'warn' },
  { date: 'Apr 08', vendor: 'Notion', cat: 'saas', amt: 40, anton: 'auto-filed · recurring', flag: 'ok' },
  { date: 'Apr 07', vendor: 'Contractor · Ada', cat: 'people', amt: 620, anton: 'auto-filed · monthly', flag: 'ok' },
  { date: 'Apr 06', vendor: 'Datadog', cat: 'infra', amt: 210, anton: 'auto-filed', flag: 'ok' },
];
