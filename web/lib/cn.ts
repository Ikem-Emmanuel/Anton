import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * `cn()` — merge conditional class lists + resolve Tailwind conflicts.
 * Standard Next.js/shadcn idiom used throughout the component library.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
