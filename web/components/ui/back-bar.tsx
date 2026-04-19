// BackBar — breadcrumb-style header for detail pages. Back button → crumb
// route, then the current item label. Trailing slot (`extras`) for
// per-detail actions (edit / delete / etc.).

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export function BackBar({
  label,
  crumb,
  crumbHref,
  extras,
}: {
  label: string;
  crumb: string;
  crumbHref: string;
  extras?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border-subtle bg-page">
      <Link href={crumbHref}>
        <Button size="sm" variant="secondary" className="flex items-center gap-1.5 text-[11px]">
          ← back
        </Button>
      </Link>
      <span className="mono small text-tertiary">{crumb}</span>
      <span className="mono small text-tertiary">/</span>
      <span className="mono small text-primary">{label}</span>
      <span className="flex-1" />
      {extras}
    </div>
  );
}
