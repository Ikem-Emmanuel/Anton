import type { ReactNode } from 'react';
import { ShellChrome } from '@/components/layout/shell-chrome';

// (app) route group — wraps the main navigable surfaces in ShellChrome.
// Standalone routes (e.g. /onboarding) live outside this group and render
// without the chrome.

export default function AppLayout({ children }: { children: ReactNode }) {
  return <ShellChrome>{children}</ShellChrome>;
}
