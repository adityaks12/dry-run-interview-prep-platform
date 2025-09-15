// components/DurationSelector.tsx
'use client';

import React from 'react';

interface Props {
  value: number; // minutes
  onChange: (minutes: number) => void;
  className?: string;
  label?: string;
}

export default function DurationSelector({ value, onChange, className, label = 'Duration' }: Props) {
  // unified options for all interview types
  const options = [10, 15, 30];

  return (
    <div className={className} aria-label="Duration selector">
      <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{label}</label>

      <div role="radiogroup" aria-label="Duration options" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {options.map((o) => {
          const isSelected = value === o;
          return (
            <div
              key={o}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => onChange(o)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange(o);
                }
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: isSelected ? '2px solid var(--primary)' : '1px solid var(--card-border)',
                background: isSelected ? '#eef2ff' : '#fff',
                cursor: 'pointer',
                minWidth: 72,
                textAlign: 'center',
                userSelect: 'none'
              }}
            >
              <div style={{ fontWeight: 600 }}>{o} min</div>
              {isSelected && <div style={{ fontSize: 12, color: 'var(--muted)' }}>Chosen</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
