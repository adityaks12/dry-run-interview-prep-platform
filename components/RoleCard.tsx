// components/RoleCard.tsx
'use client';

import React from 'react';

export type RoleId = 'aspirant' | 'earlymid' | 'practice';

interface Props {
  id: RoleId | string;
  title: string;
  description?: string;
  selected?: boolean;
  onSelect?: (id: string) => void;
  // optional small icon or emoji to show on the card
  icon?: React.ReactNode;
}

export default function RoleCard({ id, title, description, selected = false, onSelect, icon }: Props) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(id);
    }
  };

  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={() => onSelect?.(id)}
      onKeyDown={handleKeyDown}
      aria-label={title}
      style={{
        padding: 18,
        borderRadius: 10,
        border: selected ? '2px solid var(--primary)' : '1px solid var(--card-border)',
        background: selected ? '#f0f7ff' : '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        minHeight: 96,
        outline: 'none'
      }}
      // simple focus styling for keyboard users
      onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 4px var(--focus, rgba(96,165,250,0.18))`)}
      onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div style={{ width: 44, height: 44, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: selected ? 'var(--accent)' : '#f8fafc', flexShrink: 0 }}>
        <span style={{ fontSize: 20 }}>{icon ?? (id === 'practice' ? '🎙️' : id === 'aspirant' ? '🌱' : '🚀')}</span>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text)' }}>{title}</h3>
          {selected && <span style={{ fontSize: 12, color: 'var(--primary)', marginLeft: 8 }}>Selected</span>}
        </div>
        {description && <p style={{ marginTop: 8, marginBottom: 0, color: 'var(--muted)', fontSize: 13 }}>{description}</p>}
      </div>
    </div>
  );
}
