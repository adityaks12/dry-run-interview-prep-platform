// components/Breadcrumbs.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Map route segments to friendly labels.
 * Extend this map as you add more routes.
 */
const SEGMENT_LABELS: Record<string, string> = {
  'product-management': 'Product Management',
  'interview-type': 'Interview Type'
};

export default function Breadcrumbs() {
  const pathname = usePathname() ?? '/';
  // split into segments, ignore empty
  const segments = pathname.split('/').filter(Boolean);

  // always show Home even for root so UI stays consistent
  const crumbs = [{ href: '/', label: 'Home', isLast: segments.length === 0 }].concat(
    segments.map((seg, idx) => {
      const href = '/' + segments.slice(0, idx + 1).join('/');
      const label = SEGMENT_LABELS[seg] ?? seg.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return { href, label, isLast: idx === segments.length - 1 };
    })
  );

  // Render compact horizontal breadcrumb; last item is non-link
  return (
    <nav aria-label="breadcrumb" style={{ fontSize: 13, color: 'var(--muted)', width: '100%' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {crumbs.map((c, i) => (
          <span key={c.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {!c.isLast ? (
              <>
                <Link href={c.href} className="muted-link" style={{ textDecoration: 'none' }}>{c.label}</Link>
                <span aria-hidden style={{ color: 'var(--muted)' }}>›</span>
              </>
            ) : (
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{c.label}</span>
            )}
          </span>
        ))}
      </div>
    </nav>
  );
}
