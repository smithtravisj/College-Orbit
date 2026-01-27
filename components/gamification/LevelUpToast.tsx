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
        bottom: '80px',
        right: '16px',
        zIndex: 50,
        transform: isVisible && !isLeaving ? 'translateX(0)' : 'translateX(100%)',
        opacity: isVisible && !isLeaving ? 1 : 0,
        transition: 'all 0.3s ease-out',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--panel)',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          border: '1px solid var(--link)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--link)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Zap size={20} style={{ color: 'white' }} fill="white" />
        </div>
        <div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            Level Up!
          </p>
          <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
            Level {level}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          style={{
            color: 'var(--text-muted)',
            padding: '4px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            marginLeft: '8px',
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
