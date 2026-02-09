'use client';

import { useEffect, useState } from 'react';
import { X, Zap, Flame, Star, Trophy, Rocket, Target, Medal, Crown, Sun, Moon, Sparkles, Award } from 'lucide-react';
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

  const getAccentColor = () => {
    switch (achievement.tier) {
      case 'platinum':
        return 'var(--accent)';
      case 'gold':
        return 'var(--warning)';
      case 'silver':
        return 'var(--text-muted)';
      default:
        return 'var(--warning)';
    }
  };

  const getIcon = () => {
    const color = getAccentColor();
    const props = { size: 20, style: { color } };

    switch (achievement.icon) {
      case 'flame':
      case 'fire':
        return <Flame {...props} />;
      case 'star':
        return <Star {...props} />;
      case 'trophy':
        return <Trophy {...props} />;
      case 'rocket':
        return <Rocket {...props} />;
      case 'zap':
        return <Zap {...props} />;
      case 'target':
        return <Target {...props} />;
      case 'medal':
        return <Medal {...props} />;
      case 'crown':
        return <Crown {...props} />;
      case 'sun':
        return <Sun {...props} />;
      case 'moon':
        return <Moon {...props} />;
      case 'sparkles':
        return <Sparkles {...props} />;
      default:
        return <Award {...props} />;
    }
  };

  const accentColor = getAccentColor();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        maxWidth: '320px',
        width: '100%',
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
          borderLeftColor: accentColor,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            {/* Icon */}
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
              {getIcon()}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: '11px',
                color: accentColor,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                margin: '0 0 2px 0'
              }}>
                Achievement Unlocked
              </p>
              <p style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text)',
                margin: 0,
                lineHeight: 1.3,
              }}>
                {achievement.name}
              </p>
              <p style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                margin: '4px 0 0 0',
                lineHeight: 1.4,
              }}>
                {achievement.description}
              </p>

              {/* XP Reward */}
              {achievement.xpReward > 0 && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '8px',
                  padding: '3px 8px',
                  backgroundColor: 'var(--panel-2)',
                  borderRadius: '4px',
                }}>
                  <Zap size={12} style={{ color: 'var(--link)' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--link)' }}>
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
                borderRadius: '4px',
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
