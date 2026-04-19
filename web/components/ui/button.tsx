// Button — open/closed for new variants via the `variant` prop, SRP to
// rendering a consistently-styled interactive control. Matches the
// design tokens exactly.

import { cn } from '@/lib/cn';
import type { ComponentPropsWithoutRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'selected';
type Size = 'sm' | 'md';

const VARIANT: Record<Variant, string> = {
  primary: 'bg-accent text-page border border-accent hover:brightness-110',
  secondary:
    'bg-transparent text-secondary border border-border-default hover:bg-hover hover:text-primary',
  ghost: 'bg-transparent text-tertiary border-0 hover:text-primary',
  danger: 'bg-transparent text-error border border-error hover:bg-error/10',
  selected: 'bg-accent-soft text-accent border border-accent',
};

const SIZE: Record<Size, string> = {
  sm: 'px-2.5 py-1 text-[11px]',
  md: 'px-3 py-1.5 text-xs',
};

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: Variant;
  size?: Size;
  mono?: boolean;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  mono = true,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-chip cursor-pointer transition-colors',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        mono && 'mono',
        VARIANT[variant],
        SIZE[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
