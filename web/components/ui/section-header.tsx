// SectionHeader — the "caps label + optional rule" pattern used inside
// modules as a structural divider.

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface SectionHeaderProps {
  label: string;
  sub?: ReactNode;
  trailing?: ReactNode;
  rule?: boolean;
  className?: string;
}

export function SectionHeader({ label, sub, trailing, rule = true, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-baseline gap-3', rule && 'pb-2 border-b border-border-subtle mb-3', className)}>
      <span className="mono caps text-tertiary">{label}</span>
      {sub && <span className="mono small text-tertiary">{sub}</span>}
      {trailing && <span className="ml-auto flex items-center gap-2">{trailing}</span>}
    </div>
  );
}
