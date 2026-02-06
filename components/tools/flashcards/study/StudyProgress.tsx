'use client';

import { X } from 'lucide-react';

interface StudyProgressProps {
  current: number;
  total: number;
  xpEarned: number;
  onExit: () => void;
}

export default function StudyProgress({
  current,
  total,
  xpEarned,
  onExit,
}: StudyProgressProps) {
  const progressPercent = total > 0 ? (current / total) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={onExit}
          style={{
            padding: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
        >
          <X size={20} />
        </button>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          {current + 1} / {total}
        </div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--link)' }}>
          +{xpEarned} XP
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        width: '100%',
        height: '4px',
        backgroundColor: 'var(--border)',
        borderRadius: '2px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${progressPercent}%`,
          backgroundColor: 'var(--link)',
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
}
