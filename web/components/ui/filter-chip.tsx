// FilterChip — the "active/inactive pill" pattern used across memory
// filters, activity verbosity, approval risk, settings tiers, MC
// toolbar. One component, reused everywhere.

import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

interface FilterChipProps extends ComponentPropsWithoutRef<'button'> {
  active?: boolean;
  count?: number | string;
}

export function FilterChip({ active, count, className, children, ...rest }: FilterChipProps) {
  return (
    <button
      className={cn(
        'mono small px-2.5 py-1 rounded-chip cursor-pointer transition-colors',
        'flex items-center gap-1.5',
        active
          ? 'bg-accent-soft text-accent border border-accent'
          : 'bg-transparent text-secondary border border-border-default hover:bg-hover',
        className
      )}
      {...rest}
    >
      {children}
      {count !== undefined && (
        <span className={cn('text-[10px]', active ? 'text-accent' : 'text-tertiary')}>{count}</span>
      )}
    </button>
  );
}
