'use client';

import { useEffect, useState } from 'react';
import { X, Zap } from 'lucide-react';
import { Achievement } from '@/types';

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
  autoHideDuration?: number;
}

export default function AchievementToast({
  achievement,
  onDismiss,
  autoHideDuration = 5000,
}: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setIsVisible(true), 50);
    const hideTimer = setTimeout(() => {
      handleDismiss();
    }, autoHideDuration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [autoHideDuration]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const getTierColors = () => {
    switch (achievement.tier) {
      case 'platinum':
        return { from: '#22d3ee', to: '#0891b2', border: 'rgba(6, 182, 212, 0.5)' };
      case 'gold':
        return { from: '#facc15', to: '#ca8a04', border: 'rgba(234, 179, 8, 0.5)' };
      case 'silver':
        return { from: '#d1d5db', to: '#6b7280', border: 'rgba(156, 163, 175, 0.5)' };
      default:
        return { from: '#fb923c', to: '#ea580c', border: 'rgba(249, 115, 22, 0.5)' };
    }
  };

  const tierColors = getTierColors();

  const getIcon = () => {
    const iconMap: Record<string, string> = {
      'flame': '🔥',
      'star': '⭐',
      'trophy': '🏆',
      'rocket': '🚀',
      'zap': '⚡',
      'target': '🎯',
      'medal': '🏅',
      'crown': '👑',
      'fire': '🔥',
      'sun': '☀️',
      'moon': '🌙',
      'sparkles': '✨',
    };
    return iconMap[achievement.icon] || '🎖️';
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 50,
        maxWidth: '384px',
        transform: isVisible && !isLeaving ? 'translateX(0)' : 'translateX(100%)',
        opacity: isVisible && !isLeaving ? 1 : 0,
        transition: 'all 0.3s ease-out',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--panel)',
          borderRadius: '8px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: `1px solid ${tierColors.border}`,
          overflow: 'hidden',
        }}
      >
        {/* Gradient header */}
        <div
          style={{
            height: '4px',
            background: `linear-gradient(to right, ${tierColors.from}, ${tierColors.to})`,
          }}
        />

        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            {/* Icon */}
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: `linear-gradient(to bottom right, ${tierColors.from}, ${tierColors.to})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                flexShrink: 0,
              }}
            >
              {getIcon()}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                Achievement Unlocked!
              </p>
              <h4 style={{ color: 'var(--text)', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {achievement.name}
              </h4>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '4px 0 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {achievement.description}
              </p>

              {/* XP Reward */}
              {achievement.xpReward > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', color: 'var(--link)' }}>
                  <Zap size={14} />
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>
                    +{achievement.xpReward} XP
                  </span>
                </div>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={handleDismiss}
              style={{
                color: 'var(--text-muted)',
                padding: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 0.2s',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Container component to manage multiple toasts
interface AchievementToastContainerProps {
  achievements: Achievement[];
  onDismiss: (id: string) => void;
}

export function AchievementToastContainer({
  achievements,
  onDismiss,
}: AchievementToastContainerProps) {
  if (achievements.length === 0) return null;

  const currentAchievement = achievements[0];

  return (
    <AchievementToast
      key={currentAchievement.id}
      achievement={currentAchievement}
      onDismiss={() => onDismiss(currentAchievement.id)}
    />
  );
}
