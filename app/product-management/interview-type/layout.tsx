// app/product-management/interview-type/layout.tsx
import type { ReactNode } from 'react';
import '../../globals.css';

export const metadata = {
  title: 'Dry Run · Interview Type',
  description: 'Choose your Product Management interview type to practice.'
};

export default function InterviewTypeLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      {/* NOTE: Breadcrumb is intentionally NOT rendered here — parent renders it once at the top */}
      <div className="container" style={{ marginTop: 8 }}>
        <header style={{ marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Choose Interview Type</h2>
          <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>
            Select a practice interview area and duration to begin your mock session.
          </p>
        </header>

        <section>{children}</section>
      </div>
    </div>
  );
}
