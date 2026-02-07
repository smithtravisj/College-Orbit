'use client';

import { useEffect, useState } from 'react';
import { X, Trophy, Zap } from 'lucide-react';

interface ChallengeToastProps {
  message: string;
  xp: number;
  isSweep?: boolean;
  onDismiss: () => void;
}

export default function ChallengeToast({ message, xp, isSweep, onDismiss }: ChallengeToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setIsVisible(true), 50);
    const hideTimer = setTimeout(() => {
      handleDismiss();
    }, 4000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  return (
    <div
      style={{
        transform: isVisible && !isLeaving ? 'translateY(0)' : 'translateY(20px)',
        opacity: isVisible && !isLeaving ? 1 : 0,
        transition: 'all 0.3s ease-out',
        pointerEvents: isVisible && !isLeaving ? 'auto' : 'none',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--panel)',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          border: '1px solid var(--border)',
          borderLeftWidth: '3px',
          borderLeftColor: isSweep ? 'var(--warning)' : 'var(--success)',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: 'var(--panel-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isSweep ? (
            <Trophy size={20} style={{ color: 'var(--warning)' }} />
          ) : (
            <Zap size={20} style={{ color: 'var(--success)' }} />
          )}
        </div>
        <div>
          <p style={{
            fontSize: '11px',
            color: isSweep ? 'var(--warning)' : 'var(--success)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            margin: '0 0 2px 0'
          }}>
            {isSweep ? 'Sweep Bonus' : 'Challenge Complete'}
          </p>
          <p style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text)',
            margin: 0,
            lineHeight: 1.3,
          }}>
            {message}
          </p>
        </div>
        <span style={{
          fontSize: '13px',
          fontWeight: 700,
          color: isSweep ? 'var(--warning)' : 'var(--success)',
          flexShrink: 0,
          marginLeft: '4px',
        }}>
          +{xp} XP
        </span>
        <button
          onClick={handleDismiss}
          style={{
            color: 'var(--text-muted)',
            padding: '4px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

interface ChallengeToastItem {
  id: string;
  message: string;
  xp: number;
  isSweep?: boolean;
}

interface ChallengeToastContainerProps {
  toasts: ChallengeToastItem[];
  onDismiss: (id: string) => void;
}

export function ChallengeToastContainer({ toasts, onDismiss }: ChallengeToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {toasts.map((toast) => (
        <ChallengeToast
          key={toast.id}
          message={toast.message}
          xp={toast.xp}
          isSweep={toast.isSweep}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  );
}
