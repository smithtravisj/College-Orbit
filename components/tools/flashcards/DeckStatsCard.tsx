'use client';

import { Flame, Trophy, Target } from 'lucide-react';
import { DeckStats } from './types';
import { getStatusColor } from './utils';

interface DeckStatsCardProps {
  stats: DeckStats;
  streak?: number;
  dailyProgress?: { studied: number; goal: number };
  theme?: string;
  isMobile?: boolean;
}

export default function DeckStatsCard({
  stats,
  streak = 0,
  dailyProgress,
  theme = 'dark',
  isMobile = false,
}: DeckStatsCardProps) {
  const progressSegments = [
    { status: 'mastered' as const, count: stats.mastered, color: getStatusColor('mastered', theme) },
    { status: 'reviewing' as const, count: stats.reviewing, color: getStatusColor('reviewing', theme) },
    { status: 'learning' as const, count: stats.learning, color: getStatusColor('learning', theme) },
    { status: 'due' as const, count: stats.due, color: getStatusColor('due', theme) },
  ];

  const getMasteryBadge = (percentage: number): { label: string; color: string } | null => {
    if (percentage >= 80) return { label: 'Gold', color: '#fbbf24' };
    if (percentage >= 50) return { label: 'Silver', color: '#9ca3af' };
    if (percentage >= 25) return { label: 'Bronze', color: '#d97706' };
    return null;
  };

  const badge = getMasteryBadge(stats.masteryPercentage);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: isMobile ? '12px' : '16px',
      backgroundColor: 'var(--panel-2)',
      borderRadius: '12px',
      border: '1px solid var(--border)',
    }}>
      {/* Top row: Mastery percentage and badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: 'var(--text)' }}>
            {stats.masteryPercentage}%
          </span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>mastered</span>
        </div>
        {badge && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '12px',
            backgroundColor: `${badge.color}20`,
          }}>
            <Trophy size={14} style={{ color: badge.color }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: badge.color }}>{badge.label}</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div style={{
        width: '100%',
        height: '8px',
        backgroundColor: 'var(--border)',
        borderRadius: '4px',
        overflow: 'hidden',
        display: 'flex',
      }}>
        {progressSegments.map((segment) => (
          segment.count > 0 && (
            <div
              key={segment.status}
              style={{
                width: `${(segment.count / stats.total) * 100}%`,
                height: '100%',
                backgroundColor: segment.color,
                transition: 'width 0.3s ease',
              }}
            />
          )
        ))}
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        {progressSegments.map((segment) => (
          <div key={segment.status} style={{ textAlign: 'center' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: segment.color,
              margin: '0 auto 4px',
            }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
              {segment.count}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {segment.status}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom row: Streak and daily progress */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '8px',
        borderTop: '1px solid var(--border)',
      }}>
        {streak > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Flame size={16} style={{ color: '#f97316' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
              {streak} day streak
            </span>
          </div>
        )}
        {dailyProgress && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Target size={16} style={{ color: 'var(--link)' }} />
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {dailyProgress.studied}/{dailyProgress.goal} today
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
