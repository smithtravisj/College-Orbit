'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, Trophy, Zap, ChevronRight } from 'lucide-react';
import Card from '@/components/ui/Card';
import { GamificationData } from '@/types';

interface StreakCardProps {
  data: GamificationData | null;
  loading?: boolean;
}

export default function StreakCard({ data, loading = false }: StreakCardProps) {
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = () => {
    router.push('/progress');
  };

  if (!mounted) {
    return (
      <Card style={{ padding: '16px' }}>
        <div>
          <div style={{ height: '24px', backgroundColor: 'var(--border)', borderRadius: '4px', width: '33%', marginBottom: '16px' }} />
          <div style={{ height: '80px', backgroundColor: 'var(--border)', borderRadius: '4px', marginBottom: '16px' }} />
          <div style={{ height: '16px', backgroundColor: 'var(--border)', borderRadius: '4px', width: '66%' }} />
        </div>
      </Card>
    );
  }

  if (loading || !data) {
    return (
      <Card style={{ padding: '16px' }}>
        <div>
          <div style={{ height: '24px', backgroundColor: 'var(--border)', borderRadius: '4px', width: '33%', marginBottom: '16px' }} />
          <div style={{ height: '80px', backgroundColor: 'var(--border)', borderRadius: '4px', marginBottom: '16px' }} />
          <div style={{ height: '16px', backgroundColor: 'var(--border)', borderRadius: '4px', width: '66%' }} />
        </div>
      </Card>
    );
  }

  const { streak, xp, unlockedAchievements, recentActivity } = data;

  // Format date as YYYY-MM-DD in local timezone (not UTC)
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getLast7Days = (): { date: string; activity: number }[] => {
    const days: { date: string; activity: number }[] = [];
    const activityMap = new Map(recentActivity.map(a => [a.date, a.tasksCompleted]));

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = formatLocalDate(date);
      days.push({
        date: dateStr,
        activity: activityMap.get(dateStr) || 0,
      });
    }

    return days;
  };

  const last7Days = getLast7Days();

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
  };

  const getStreakColorValue = () => {
    if (streak.vacationMode) return 'var(--text-muted)';
    if (streak.currentStreak >= 30) return '#f97316';
    if (streak.currentStreak >= 14) return '#fb923c';
    if (streak.currentStreak >= 7) return '#eab308';
    if (streak.currentStreak >= 1) return '#facc15';
    return 'var(--text-muted)';
  };

  const getActivityColorValue = (count: number) => {
    return count > 0 ? '#22c55e' : 'var(--border)';
  };

  const hasBestStreak = streak.longestStreak > 0 && streak.longestStreak > streak.currentStreak;

  const actionElement = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {streak.vacationMode && (
        <span style={{ fontSize: '12px', backgroundColor: 'var(--border)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '9999px' }}>
          On Break
        </span>
      )}
      <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
    </div>
  );

  return (
    <Card
      title="Your Progress"
      action={actionElement}
      style={{
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        transform: isHovered ? 'scale(1.01)' : 'scale(1)',
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >

      {/* Streak and Level */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 'auto' }}>
        {/* Current Streak */}
        <div style={{ backgroundColor: 'var(--bg-secondary, rgba(0,0,0,0.1))', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <Flame
              size={18}
              style={{ color: getStreakColorValue() }}
              fill={streak.currentStreak >= 1 && !streak.vacationMode ? 'currentColor' : 'none'}
            />
            <span style={{ fontSize: '18px', fontWeight: 700, color: getStreakColorValue() }}>
              {streak.vacationMode ? '-' : streak.currentStreak}
            </span>
          </div>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>
            {streak.vacationMode ? 'Paused' : 'Day Streak'}
          </p>
        </div>

        {/* Level */}
        <div style={{ backgroundColor: 'var(--bg-secondary, rgba(0,0,0,0.1))', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <Zap size={18} style={{ color: 'var(--link)' }} />
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--link)' }}>
              {xp.level}
            </span>
          </div>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>Level</p>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px', color: 'var(--text-muted)' }}>
          <span>{xp.currentLevelXp} XP</span>
          <span>{xp.nextLevelXp} XP</span>
        </div>
        <div style={{ height: '5px', backgroundColor: 'var(--border)', borderRadius: '9999px', overflow: 'hidden' }}>
          <div
            style={{ width: `${xp.progress}%`, height: '100%', background: 'var(--link)', transition: 'all 0.5s' }}
          />
        </div>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: 0, textAlign: 'center' }}>
          {xp.nextLevelXp - xp.currentLevelXp} XP to next level
        </p>
      </div>

      {/* 7-Day Activity Heatmap */}
      <div style={{ marginTop: 'auto' }}>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', marginTop: 0 }}>Last 7 Days</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '3px' }}>
          {last7Days.map((day, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div
                style={{ width: '100%', aspectRatio: '1', borderRadius: '3px', backgroundColor: getActivityColorValue(day.activity) }}
                title={`${day.date}: ${day.activity} task${day.activity !== 1 ? 's' : ''}`}
              />
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>
                {getDayLabel(day.date)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', textAlign: 'center', marginTop: 'auto' }}>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>{streak.totalTasksCompleted}</p>
          <p style={{ fontSize: '9px', color: 'var(--text-muted)', margin: 0 }}>Tasks Done</p>
        </div>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>{xp.total}</p>
          <p style={{ fontSize: '9px', color: 'var(--text-muted)', margin: 0 }}>Total XP</p>
        </div>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>{unlockedAchievements.length}</p>
          <p style={{ fontSize: '9px', color: 'var(--text-muted)', margin: 0 }}>Achievements</p>
        </div>
      </div>

      {/* Best Streak */}
      {hasBestStreak && (
        <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-muted)' }}>
          <Trophy size={12} style={{ color: '#eab308' }} />
          <span>Best: {streak.longestStreak} days</span>
        </div>
      )}
    </Card>
  );
}
