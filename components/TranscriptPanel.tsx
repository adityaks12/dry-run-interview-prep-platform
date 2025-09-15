// components/TranscriptPanel.tsx
'use client';

import React, { useRef, useEffect } from 'react';

type Message = { id: string; speaker: 'ai' | 'user' | 'system'; text: string; ts: string };

export default function TranscriptPanel({ messages }: { messages: Message[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // auto-scroll to bottom on new messages
    const c = containerRef.current;
    if (c) c.scrollTop = c.scrollHeight;
  }, [messages]);

  return (
    <div style={{ border: '1px solid var(--card-border)', borderRadius: 8, padding: 12, minHeight: 240 }}>
      <div ref={containerRef} style={{ maxHeight: 420, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map(m => (
          <div key={m.id} style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 56, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
              {m.speaker === 'ai' ? 'AI' : m.speaker === 'user' ? 'You' : 'Info'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{m.text}</div>
              <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 12 }}>{new Date(m.ts).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
