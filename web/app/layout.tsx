import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ShellChrome } from '@/components/layout/shell-chrome';
import './globals.css';

export const metadata: Metadata = {
  title: 'Anton — Personal AI Operating System',
  description: "Noel's personal AI OS. JARVIS-style orchestrator for a 15-agent team.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="warm-dark">
      <body>
        <ShellChrome>{children}</ShellChrome>
      </body>
    </html>
  );
}
