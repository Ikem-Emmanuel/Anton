'use client';
// Expenses — category breakdown + transaction feed. Anton auto-categorizes
// every charge and flags anomalies; flagged rows tint the background and
// surface a review button. The category sidebar shows a stacked bar by
// percentage and per-category totals with flag pips.

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { EXPENSE_CATS, TRANSACTIONS, type Transaction } from '@/lib/data';

function CategoryBreakdown() {
  const total = EXPENSE_CATS.reduce((acc, c) => acc + c.amt, 0);
  return (
    <aside className="w-[340px] border-r border-border-subtle p-5 overflow-auto">
      <div className="mono small caps text-tertiary mb-3 text-[9px]">BY CATEGORY</div>
      <div className="text-[32px] text-primary font-medium mb-1">${total.toLocaleString()}</div>
      <div className="mono small text-tertiary mb-4">
        <span className="text-error">+12%</span> vs last month
      </div>
      <div className="flex h-1.5 rounded-sm overflow-hidden mb-4">
        {EXPENSE_CATS.map((c) => (
          <div key={c.name} style={{ width: `${c.pct}%`, background: c.color }} />
        ))}
      </div>
      {EXPENSE_CATS.map((c) => (
        <div key={c.name} className="flex items-center py-2 border-b border-border-subtle">
          <span className="w-2.5 h-2.5 mr-2.5 rounded-sm" style={{ background: c.color }} />
          <span className="flex-1 text-xs text-secondary">{c.name}</span>
          {c.flagged && <span className="mono small text-[9px] text-error mr-2">◆ FLAG</span>}
          <span className="mono small text-[11px] text-primary">${c.amt.toLocaleString()}</span>
        </div>
      ))}
    </aside>
  );
}

function TransactionRow({ t }: { t: Transaction }) {
  return (
    <div
      className={cn(
        'px-6 py-3 border-b border-border-subtle flex items-center gap-4',
        t.flag === 'warn' ? 'bg-error/[0.04]' : 'bg-transparent'
      )}
    >
      <span className="mono small text-tertiary w-14 text-[11px]">{t.date}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-primary mb-0.5">{t.vendor}</div>
        <div className={cn('mono small text-[10px] leading-[1.4]', t.flag === 'warn' ? 'text-error' : 'text-tertiary')}>
          {t.flag === 'warn' && '◆ '}
          {t.anton}
        </div>
      </div>
      <span className="mono small text-[10px] text-tertiary w-[60px]">{t.cat}</span>
      <span className="text-sm text-primary mono w-[90px] text-right">${t.amt.toLocaleString()}</span>
      {t.flag === 'warn' && (
        <Button size="sm" variant="primary" className="bg-work border-work">
          review
        </Button>
      )}
    </div>
  );
}

function TransactionFeed() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 py-4 border-b border-border-subtle flex items-center">
        <div className="mono small caps text-tertiary text-[9px] flex-1">RECENT TRANSACTIONS</div>
        <Button size="sm" variant="secondary">
          export csv
        </Button>
      </div>
      {TRANSACTIONS.map((t, i) => (
        <TransactionRow key={`${t.date}-${t.vendor}-${i}`} t={t} />
      ))}
    </div>
  );
}

export default function Expenses() {
  const flagged = EXPENSE_CATS.filter((c) => c.flagged).length + TRANSACTIONS.filter((t) => t.flag === 'warn').length;
  const total = TRANSACTIONS.reduce((acc, t) => acc + t.amt, 0);
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="px-6 py-4 border-b border-border-subtle">
        <div className="text-xl text-primary font-medium mb-0.5">Expenses</div>
        <div className="mono small text-tertiary">
          April · ${total.toLocaleString()} spent · {flagged} flagged for your review
        </div>
      </header>
      <div className="flex-1 flex min-h-0">
        <CategoryBreakdown />
        <TransactionFeed />
      </div>
    </div>
  );
}
