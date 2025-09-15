// app/layout.tsx
import './globals.css';
import type { ReactNode } from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Dry Run — Interview Practice',
  description: 'Dry Run: realistic, AI-powered interview practice for product managers.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="site-root">
          <header className="site-header">
            <div className="container header-inner">
              <Link href="/" className="brand">Dry Run</Link>
              <nav className="nav">
                <Link href="/pm" className="nav-link">Product Management</Link>
                <a className="nav-link" href="https://example.com/faq" target="_blank" rel="noreferrer">FAQ</a>
              </nav>
            </div>
          </header>

          <main className="container main">{children}</main>

          <footer className="site-footer">
            <div className="container">
              <small>© {new Date().getFullYear()} Dry Run — Practice interviews, improve faster.</small>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
