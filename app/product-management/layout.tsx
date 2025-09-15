// app/product-management/layout.tsx
import type { ReactNode } from 'react';
import '../globals.css';
import Breadcrumbs from '../../components/Breadcrumbs';

export const metadata = {
  title: 'Dry Run · Product Management',
  description: 'Product Management interview practice — choose interview type and start a mock session.'
};

export default function PMLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      {/* Top area where the breadcrumb always appears (parent provides it for itself and children) */}
      <div className="pm-hero" style={{ marginBottom: 12 }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 16, flexDirection: 'column' }}>
          {/* Breadcrumbs sits at the top for this section and updates automatically */}
          <div style={{ width: '100%', marginBottom: 8 }}>
            <Breadcrumbs />
          </div>

          {/* Short section label or microcopy under the breadcrumb
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Product Management Practice Area</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Start practicing: choose your role</div>
          </div> */}
        </div>
      </div>

      <div className="container">
        {/* <header style={{ marginBottom: 18 }}>
          <h1 style={{ margin: 0, fontSize: 24 }}>Product Management</h1>
          <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>
            Practice PM interviews — case studies, metrics, design, growth, and behavioural rounds.
          </p>
        </header> */}

        <section>{children}</section>
      </div>
    </div>
  );
}
