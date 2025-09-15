// components/InterviewToolbar.tsx
'use client';

import React from 'react';

export default function InterviewToolbar({ started, onStart, onEnd, interviewId, ended }: {
  started: boolean;
  ended?: boolean;
  onStart: () => void;
  onEnd: () => void;
  interviewId: string;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {!started && !ended && (
        <button onClick={onStart} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 8 }}>
          Start Interview
        </button>
      )}
      <button onClick={onEnd} style={{ background: 'transparent', border: '1px solid var(--card-border)', padding: '8px 10px', borderRadius: 8 }}>
        End Interview
      </button>
    </div>
  );
}
