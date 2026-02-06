'use client';

import { Layers, Keyboard, Grid3X3 } from 'lucide-react';
import { StudyMode } from '../types';

interface StudyModeSelectorProps {
  activeMode: StudyMode;
  onChange: (mode: StudyMode) => void;
  isMobile?: boolean;
}

export default function StudyModeSelector({
  activeMode,
  onChange,
  isMobile = false,
}: StudyModeSelectorProps) {
  const modes: { value: StudyMode; label: string; icon: React.ReactNode; description: string }[] = [
    {
      value: 'flashcard',
      label: 'Flashcards',
      icon: <Layers size={18} />,
      description: 'Classic flip-to-reveal',
    },
    {
      value: 'type',
      label: 'Type Answer',
      icon: <Keyboard size={18} />,
      description: 'Type your answer',
    },
    {
      value: 'match',
      label: 'Match',
      icon: <Grid3X3 size={18} />,
      description: 'Match pairs',
    },
  ];

  return (
    <div style={{
      display: 'flex',
      gap: isMobile ? '8px' : '12px',
      flexWrap: 'wrap',
    }}>
      {modes.map((mode) => {
        const isActive = activeMode === mode.value;
        return (
          <button
            key={mode.value}
            onClick={() => onChange(mode.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: isMobile ? '10px 14px' : '12px 16px',
              borderRadius: '10px',
              border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)',
              cursor: 'pointer',
              backgroundColor: isActive ? 'var(--accent)' : 'var(--panel-2)',
              backgroundImage: isActive
                ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)'
                : 'none',
              color: isActive ? 'white' : 'var(--text-muted)',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            {mode.icon}
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
