import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Anton — Personal AI Operating System',
  description: "Noel's personal AI OS. JARVIS-style orchestrator for a 15-agent team.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="warm-dark">
      <body>{children}</body>
    </html>
  );
}
