// app/product-management/interview/layout.tsx
import type { ReactNode } from 'react';
import '../../../globals.css';

export const metadata = {
  title: 'Dry Run · Interview',
  description: 'Interview area'
};

export default function InterviewLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="container" style={{ marginTop: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>Interview</div>
        </div>
      </div>

      <main className="container">
        {children}
      </main>
    </div>
  );
}
