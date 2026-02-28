'use client';

import { useEffect, useState } from 'react';
import { X, Zap } from 'lucide-react';

interface LevelUpToastProps {
  level: number;
  onDismiss: () => void;
}

export default function LevelUpToast({ level, onDismiss }: LevelUpToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setIsVisible(true), 50);
    const hideTimer = setTimeout(() => {
      handleDismiss();
    }, 5000);

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
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 9999,
        transform: isVisible && !isLeaving ? 'translateY(0)' : 'translateY(20px)',
        opacity: isVisible && !isLeaving ? 1 : 0,
        transition: 'all 0.3s ease-out',
        pointerEvents: isVisible && !isLeaving ? 'auto' : 'none',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--panel-solid, var(--panel))',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          border: '1px solid var(--border)',
          borderLeftWidth: '3px',
          borderLeftColor: 'var(--link)',
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
          <Zap size={20} style={{ color: 'var(--link)' }} />
        </div>
        <div>
          <p style={{
            fontSize: '11px',
            color: 'var(--link)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            margin: '0 0 2px 0'
          }}>
            Level Up
          </p>
          <p style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--text)',
            margin: 0,
            lineHeight: 1.2,
          }}>
            Level {level}
          </p>
        </div>
        <button
          className="icon-btn"
          onClick={handleDismiss}
          style={{
            color: 'var(--text-muted)',
            padding: '4px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px',
            marginLeft: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--panel-2)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
