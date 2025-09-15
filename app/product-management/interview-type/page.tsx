// app/product-management/interview-type/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CaseTypeCard from '../../../components/CaseTypeCard';
import DurationSelector from '../../../components/DurationSelector';

type CaseOption = { id: string; title: string; desc: string };

const CASE_TYPES: CaseOption[] = [
  { id: 'product_strategy', title: 'Product Strategy / Product Sense', desc: 'Positioning, prioritization, go-to-market and trade-offs.' },
  { id: 'product_design', title: 'Product Design', desc: 'User flows, UX trade-offs, wireframes, and product thinking.' },
  { id: 'rca', title: 'RCA (Root Cause Analysis)', desc: 'Diagnose issues, structure hypotheses, and propose fixes.' },
  { id: 'product_metrics', title: 'Product Metrics', desc: 'Define KPIs, measure impact, and interpret signals.' },
  { id: 'behavioral', title: 'Behavioral', desc: 'STAR-format responses for leadership, collaboration and decision making.' }
];

export default function InterviewTypePage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<string | null>(CASE_TYPES[0].id);
  const [duration, setDuration] = useState<number>(15); // minutes
  const [starting, setStarting] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);

  // ensure a session exists
  useEffect(() => {
    const existing = localStorage.getItem('session_id');
    if (existing) {
      setSessionId(existing);
      return;
    }

    const createSession = async () => {
      setCreatingSession(true);
      try {
        const res = await fetch('/api/session', { method: 'POST' });
        if (!res.ok) throw new Error('session create failed');
        const data = await res.json();
        if (data.session_id) {
          localStorage.setItem('session_id', data.session_id);
          setSessionId(data.session_id);
        }
      } catch (err) {
        console.error('Could not create session', err);
      } finally {
        setCreatingSession(false);
      }
    };

    createSession();
  }, []);

  // when case type is behavioral, restrict durations to small options
  useEffect(() => {
    if (selectedCase === 'behavioral') {
      if (duration > 5) setDuration(2);
    } else {
      // ensure non-behavioral defaults are reasonable
      if (duration < 10) setDuration(15);
    }
  }, [selectedCase]);

  const handleStart = async () => {
    if (!sessionId || !selectedCase) return;
    setStarting(true);
    try {
      const payload = {
        type: selectedCase === 'behavioral' ? 'behavioral' : 'case',
        category: selectedCase,
        max_duration_seconds: duration * 60
      };

      // call Next app API route; if you use external API, replace path with NEXT_PUBLIC_API_BASE
      const res = await fetch(`/api/session/${sessionId}/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text().catch(() => 'failed');
        throw new Error(text || 'start interview failed');
      }
      const data = await res.json();
      const interviewId = data.interview_id;
      if (!interviewId) throw new Error('no interview id returned');

      // navigate to the interview room (dynamic route)
      router.push(`/product-management/interview-type/${interviewId}`);
    } catch (err) {
      console.error('Start interview error', err);
      alert('Could not start interview — please try again.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ color: 'var(--muted)', margin: 0 }}>Choose an interview type and duration.</p>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>
          {creatingSession ? 'Preparing session…' : sessionId ? `Session: ${sessionId}` : 'No session yet'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {CASE_TYPES.map(ct => (
          <CaseTypeCard
            key={ct.id}
            id={ct.id}
            title={ct.title}
            description={ct.desc}
            selected={selectedCase === ct.id}
            onSelect={() => setSelectedCase(ct.id)}
          />
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <DurationSelector value={duration} onChange={(m) => setDuration(m)} />
      </div>

      <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          onClick={handleStart}
          disabled={starting || creatingSession}
          style={{
            background: starting ? '#93c5fd' : 'var(--primary)',
            color: '#fff',
            border: 'none',
            padding: '10px 16px',
            borderRadius: 8,
            cursor: starting ? 'not-allowed' : 'pointer'
          }}
        >
          {starting ? 'Starting…' : 'Start Practice'}
        </button>

        <button
          onClick={() => router.push('/product-management')}
          style={{
            background: 'transparent',
            border: '1px solid var(--card-border)',
            padding: '10px 14px',
            borderRadius: 8,
            cursor: 'pointer'
          }}
        >
          Back
        </button>
      </div>
    </div>
  );
}
