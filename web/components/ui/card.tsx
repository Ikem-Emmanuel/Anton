// Card — the surface primitive used by approval tray, memory rows, briefing
// activity cards, integration tiles, option cards, etc. SRP: just a container
// with the design-system surface styling. Everything inside is children.

import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends ComponentPropsWithoutRef<'div'> {
  /** Visual variant — surface (default), hover (sunken), raised (modal), flat (page bg). */
  variant?: 'surface' | 'hover' | 'raised' | 'flat';
  /** Accent a side border (e.g. for approval risk levels or activity event type). */
  accent?: string;
  /** Dial up or down the border radius (chip < card < panel). */
  radius?: 'chip' | 'card' | 'panel' | 'none';
  children: ReactNode;
}

const BG: Record<NonNullable<CardProps['variant']>, string> = {
  surface: 'bg-surface',
  hover: 'bg-hover',
  raised: 'bg-raised',
  flat: 'bg-page',
};

const RADIUS: Record<NonNullable<CardProps['radius']>, string> = {
  chip: 'rounded-chip',
  card: 'rounded-card',
  panel: 'rounded-panel',
  none: 'rounded-none',
};

export function Card({ variant = 'surface', radius = 'card', accent, className, style, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(BG[variant], RADIUS[radius], 'border border-border-subtle', className)}
      style={accent ? { borderLeft: `2px solid ${accent}`, ...style } : style}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...rest }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div className={cn('px-4 py-3 border-b border-border-subtle flex items-center gap-2', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardBody({ children, className, ...rest }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div className={cn('p-4', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...rest }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div className={cn('px-4 py-3 border-t border-border-subtle flex items-center gap-2', className)} {...rest}>
      {children}
    </div>
  );
}
