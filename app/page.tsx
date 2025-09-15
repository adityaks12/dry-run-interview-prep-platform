// app/page.tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="hero">
      <div className="hero-inner">
        <h1 className="hero-title">Dry Run</h1>
        <p className="hero-sub">
          Realistic, on-demand interview practice for people who want to level up — starting with Product Management.
        </p>

        <div className="split">
          <div className="copy">
            <h2>What Dry Run does</h2>
            <ul className="features">
              <li><strong>Realistic interview simulations</strong> — AI interviewer that asks follow-ups and mimics real conversations.</li>
              <li><strong>Rubric-based feedback</strong> — objective scores and written guidance after each session.</li>
              <li><strong>Voice-first experience</strong> — practice speaking, get transcripts and review answers.</li>
              <li><strong>Freemium access</strong> — try sessions for free; claim and save transcripts by email.</li>
            </ul>
            <p className="muted">Start with Product Management — PM-first to drive early adoption, then expand to other roles.</p>
          </div>

          <aside className="catalog">
            <h3 className="catalog-title">Interview practice categories</h3>

            <div className="card-grid" role="list">
              <Link role="listitem" href="/product-management" className="card">
                <div className="card-inner">
                  <div className="card-icon" aria-hidden>📦</div>
                  <div className="card-content">
                    <h4 className="card-title">Product Management</h4>
                    <p className="card-desc">Case studies, metrics, product design, growth, and behavioural practice tailored for PM roles.</p>
                  </div>
                </div>
                <div className="card-cta">Start practicing →</div>
              </Link>
            </div>

            <p className="note">Click the category to choose your role and begin a practice session.</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
