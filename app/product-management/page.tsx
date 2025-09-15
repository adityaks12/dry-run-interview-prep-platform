// app/product-management/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RoleCard from '../../components/RoleCard';

const ROLE_OPTIONS = [
  { id: 'aspirant', title: 'Product Aspirant', desc: 'Learning PM fundamentals and preparing for first PM interviews.' },
  { id: 'earlymid', title: 'Early / Mid PM', desc: 'Working PM preparing to switch roles or level up.' },
  { id: 'practice', title: 'Practice Directly', desc: 'Jump straight into mock interviews — no signup required.' }
];

export default function ProductManagementLanding() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);

  useEffect(() => {
    const existing = localStorage.getItem('session_id');
    if (existing) {
      setSessionId(existing);
      return;
    }

    const createSession = async () => {
      setLoadingSession(true);
      try {
        const res = await fetch('/api/session', { method: 'POST' });
        if (!res.ok) throw new Error('session create failed');
        const data = await res.json();
        if (data?.session_id) {
          localStorage.setItem('session_id', data.session_id);
          setSessionId(data.session_id);
        }
      } catch (err) {
        console.error('Could not create session', err);
      } finally {
        setLoadingSession(false);
      }
    };

    createSession();
  }, []);

  const handleContinue = () => {
    if (!selected) return; // disabled guard
    if (selected === 'practice') {
      // go directly to interview-type (new route name)
      router.push('/product-management/interview-type');
      return;
    }

    // aspirant / earlymid placeholder flows — guide user to practice for now
    // you can later route to dedicated flows
    // we still let them continue to interview-type if they want to practice now
    const proceed = confirm(
      'Aspirant/Early-Mid tailored flows are coming soon. Would you like to jump into a practice session now?'
    );
    if (proceed) {
      router.push('/product-management/interview-type');
    }
  };

  const handleSkipPractice = () => {
    router.push('/product-management/interview-type');
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <p style={{ color: 'var(--muted)', margin: 0 }}>Who are you? This helps us tailor case difficulty and feedback.</p>
      </div>

      <div
        role="radiogroup"
        aria-label="Select PM role"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 18 }}
      >
        {ROLE_OPTIONS.map((r) => (
          <RoleCard
            key={r.id}
            id={r.id}
            title={r.title}
            description={r.desc}
            selected={selected === r.id}
            onSelect={() => setSelected(r.id)}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          onClick={handleContinue}
          disabled={!selected || loadingSession}
          style={{
            background: selected ? 'var(--primary)' : '#c7d2fe',
            color: '#fff',
            border: 'none',
            padding: '10px 16px',
            borderRadius: 8,
            cursor: selected ? 'pointer' : 'not-allowed'
          }}
        >
          Continue
        </button>

        <button
          onClick={handleSkipPractice}
          style={{
            background: 'transparent',
            border: '1px solid var(--card-border)',
            padding: '10px 14px',
            borderRadius: 8,
            cursor: 'pointer'
          }}
        >
          Skip — practice anonymously
        </button>

        <div style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 13 }}>
          {loadingSession ? 'Preparing session…' : sessionId ? `Session: ${sessionId}` : 'Session not ready'}
        </div>
      </div>

      <p style={{ marginTop: 16, color: 'var(--muted)' }}>
        Or go back to <Link href="/">Home</Link>.
      </p>
    </div>
  );
}
