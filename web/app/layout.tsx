import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Anton — Personal AI Operating System',
  description: "Noel's personal AI OS. JARVIS-style orchestrator for a 15-agent team.",
};

// Root layout — HTML shell + theme only. The in-app chrome (titlebar,
// nav rail, command bar) lives on the (app) route group's layout so
// standalone routes like /onboarding can opt out of it.

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="warm-dark">
      <body>{children}</body>
    </html>
  );
}
