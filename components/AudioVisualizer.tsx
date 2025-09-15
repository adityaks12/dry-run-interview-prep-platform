// components/AudioVisualizer.tsx
'use client';

import React, { useEffect, useRef } from 'react';

export default function AudioVisualizer({ active = false }: { active?: boolean }) {
  const bars = 6;
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let raf = 0;
    const el = ref.current;
    const anim = () => {
      if (!el) return;
      const children = Array.from(el.children) as HTMLElement[];
      children.forEach((c, i) => {
        const base = 6 + i * 4;
        const variance = active ? Math.random() * 20 : Math.random() * 4;
        (c as HTMLElement).style.height = `${base + variance}px`;
      });
      raf = requestAnimationFrame(anim);
    };
    raf = requestAnimationFrame(anim);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <div ref={ref} style={{ display: 'flex', gap: 4, alignItems: 'end', height: 28 }}>
      {Array.from({ length: bars }).map((_, i) => (
        <div key={i} style={{ width: 4, borderRadius: 2, background: active ? 'var(--accent)' : '#e6eefb', height: 8 }} />
      ))}
    </div>
  );
}
