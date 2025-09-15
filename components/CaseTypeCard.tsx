// components/CaseTypeCard.tsx
'use client';

import React from 'react';

interface Props {
  id: string;
  title: string;
  description?: string;
  selected?: boolean;
  onSelect?: (id: string) => void;
  icon?: React.ReactNode;
  className?: string;
}

export default function CaseTypeCard({ id, title, description, selected = false, onSelect, icon, className }: Props) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(id);
    }
  };

  return (
    <div
      role="button"
      aria-pressed={selected}
      tabIndex={0}
      onClick={() => onSelect?.(id)}
      onKeyDown={handleKeyDown}
      className={className}
      style={{
        padding: 16,
        borderRadius: 10,
        border: selected ? '2px solid var(--accent)' : '1px solid var(--card-border)',
        background: selected ? '#ecfeff' : '#fff',
        cursor: 'pointer',
        minHeight: 96,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'box-shadow .12s, transform .06s'
      }}
      onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 4px var(--focus, rgba(96,165,250,0.18))`)}
      onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
      aria-label={title}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 8, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: selected ? 'var(--accent)' : '#f8fafc', flexShrink: 0
        }}>
          <span style={{ fontSize: 20 }}>{icon ?? '🧭'}</span>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{title}</div>
          {description && <div style={{ marginTop: 8, color: 'var(--muted)', fontSize: 13 }}>{description}</div>}
        </div>
      </div>

      <div style={{ marginTop: 12, alignSelf: 'flex-end', color: selected ? 'var(--accent)' : 'var(--muted)', fontSize: 13 }}>
        {selected ? 'Selected' : 'Click to select'}
      </div>
    </div>
  );
}
