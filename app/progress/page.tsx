'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Flame, Trophy, Zap, Lock, Target, Clock, Award, Star, Rocket, Medal, Crown, Sun, Moon, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import Card from '@/components/ui/Card';
import { GamificationData, Achievement } from '@/types';
import { useBetaAccess } from '@/hooks/useBetaAccess';
import { useIsMobile } from '@/hooks/useMediaQuery';
import useAppStore from '@/lib/store';

export default function ProgressPage() {
  const { status } = useSession();
  const router = useRouter();
  const { hasAccessToFeature } = useBetaAccess();
  const isMobile = useIsMobile();

  // Use store data first for instant display, then fetch fresh data
  const storeGamification = useAppStore((state) => state.gamification);
  const fetchGamification = useAppStore((state) => state.fetchGamification);
  const [gamification, setGamification] = useState<GamificationData | null>(storeGamification);
  const [loading, setLoading] = useState(!storeGamification);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Update local state when store data changes
  useEffect(() => {
    if (storeGamification) {
      setGamification(storeGamification);
      setLoading(false);
    }
  }, [storeGamification]);

  useEffect(() => {
    if (!hasAccessToFeature('1.2.0')) {
      router.push('/');
      return;
    }

    // Fetch fresh data (updates store which updates local state)
    fetchGamification().finally(() => setLoading(false));
  }, [hasAccessToFeature, router, fetchGamification]);

  const getStreakColorValue = (streak: number, vacationMode: boolean) => {
    if (vacationMode) return 'var(--text-muted)';
    if (streak >= 1) return 'var(--warning)';
    return 'var(--text-muted)';
  };

  const getActivityColorValue = (count: number) => {
    return count > 0 ? 'var(--success)' : 'var(--border)';
  };

  const getTierColors = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return { bg: 'var(--accent-2)', border: 'var(--accent)', text: 'var(--accent)' };
      case 'gold':
        return { bg: 'var(--warning-bg)', border: 'var(--warning)', text: 'var(--warning)' };
      case 'silver':
        return { bg: 'var(--border)', border: 'var(--text-muted)', text: 'var(--text-muted)' };
      default:
        return { bg: 'var(--warning-bg)', border: 'var(--warning)', text: 'var(--warning)' };
    }
  };

  const getIconComponent = (icon: string, isUnlocked: boolean, tierColors: { text: string }) => {
    const iconProps = { size: 24, style: { color: isUnlocked ? tierColors.text : 'var(--text-muted)' } };
    switch (icon) {
      case 'flame':
      case 'fire':
        return <Flame {...iconProps} />;
      case 'star':
        return <Star {...iconProps} />;
      case 'trophy':
        return <Trophy {...iconProps} />;
      case 'rocket':
        return <Rocket {...iconProps} />;
      case 'zap':
        return <Zap {...iconProps} />;
      case 'target':
        return <Target {...iconProps} />;
      case 'medal':
        return <Medal {...iconProps} />;
      case 'crown':
        return <Crown {...iconProps} />;
      case 'sun':
        return <Sun {...iconProps} />;
      case 'moon':
        return <Moon {...iconProps} />;
      case 'sparkles':
        return <Sparkles {...iconProps} />;
      default:
        return <Award {...iconProps} />;
    }
  };

  // Format date as YYYY-MM-DD in local timezone (not UTC)
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const generateMonthDays = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: { date: string; activity: number; isCurrentMonth: boolean }[] = [];

    // Get activity map
    const activityMap = new Map(
      gamification?.recentActivity?.map(a => [a.date, a.tasksCompleted]) || []
    );

    // Add padding days from previous month
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      const dateStr = formatLocalDate(date);
      days.push({ date: dateStr, activity: activityMap.get(dateStr) || 0, isCurrentMonth: false });
    }

    // Add days of current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = formatLocalDate(date);
      days.push({ date: dateStr, activity: activityMap.get(dateStr) || 0, isCurrentMonth: true });
    }

    // Add padding days from next month
    const endPadding = 6 - lastDay.getDay();
    for (let i = 1; i <= endPadding; i++) {
      const date = new Date(year, month + 1, i);
      const dateStr = formatLocalDate(date);
      days.push({ date: dateStr, activity: activityMap.get(dateStr) || 0, isCurrentMonth: false });
    }

    return days;
  };

  const changeMonth = (delta: number) => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  if (loading || !gamification) {
    return (
      <>
        {/* Header skeleton */}
        <div className="mx-auto w-full max-w-[1800px]" style={{ padding: isMobile ? '8px 20px 8px' : '12px 24px 12px', position: 'relative', zIndex: 1 }}>
          <div style={{ height: '34px', backgroundColor: 'var(--border)', borderRadius: '8px', width: '200px', marginBottom: '8px' }} />
          <div style={{ height: '15px', backgroundColor: 'var(--border)', borderRadius: '4px', width: '250px' }} />
        </div>
        <div className="mx-auto w-full max-w-[1800px]" style={{ paddingLeft: isMobile ? 'clamp(12px, 4%, 24px)' : '24px', paddingRight: isMobile ? 'clamp(12px, 4%, 24px)' : '24px', paddingBottom: isMobile ? 'clamp(12px, 4%, 24px)' : '24px', paddingTop: '0', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ height: '120px', backgroundColor: 'var(--panel)', borderRadius: '12px', border: '1px solid var(--border)' }} />
            ))}
          </div>
        </div>
      </>
    );
  }

  const { streak, xp, achievements, unlockedAchievements } = gamification;
  const monthDays = generateMonthDays();

  // Group achievements by category
  const achievementsByCategory = achievements.reduce((acc, achievement) => {
    const cat = achievement.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  return (
    <>
      {/* Header */}
      <div className="mx-auto w-full max-w-[1800px]" style={{ padding: isMobile ? '4px 16px 4px' : '12px 24px 12px', position: 'relative', zIndex: 1 }}>
        <div>
          <h1
            style={{
              fontSize: isMobile ? '24px' : '34px',
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
            }}
          >
            Your Progress
          </h1>
          <p style={{ fontSize: isMobile ? '13px' : '15px', color: 'var(--text-muted)', marginTop: '-4px' }}>
            Track your streaks, level, and achievements.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-[1800px]" style={{ paddingLeft: isMobile ? '12px' : '24px', paddingRight: isMobile ? '12px' : '24px', paddingBottom: isMobile ? '12px' : '24px', paddingTop: '0', position: 'relative', zIndex: 1 }}>

        {/* Stats Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fit, minmax(140px, 1fr))', gap: isMobile ? '8px' : '12px', marginBottom: isMobile ? '12px' : '24px' }}>
          {/* Streak */}
          <div style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border)', borderRadius: isMobile ? '8px' : '12px', padding: isMobile ? '10px 8px' : '16px', textAlign: 'center' }}>
            <Flame size={isMobile ? 20 : 28} style={{ color: getStreakColorValue(streak.currentStreak, streak.vacationMode) }} fill={streak.currentStreak >= 1 && !streak.vacationMode ? 'currentColor' : 'none'} />
            <p style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: 700, color: getStreakColorValue(streak.currentStreak, streak.vacationMode), margin: '2px 0 0 0' }}>
              {streak.vacationMode ? '-' : streak.currentStreak}
            </p>
            <p style={{ fontSize: isMobile ? '10px' : '12px', color: 'var(--text-muted)', margin: '1px 0 0 0' }}>
              {streak.vacationMode ? 'Paused' : 'Day Streak'}
            </p>
          </div>

          {/* Level */}
          <div style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border)', borderRadius: isMobile ? '8px' : '12px', padding: isMobile ? '10px 8px' : '16px', textAlign: 'center' }}>
            <Zap size={isMobile ? 20 : 28} style={{ color: 'var(--link)' }} />
            <p style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: 700, color: 'var(--link)', margin: '2px 0 0 0' }}>
              {xp.level}
            </p>
            <p style={{ fontSize: isMobile ? '10px' : '12px', color: 'var(--text-muted)', margin: '1px 0 0 0' }}>Level</p>
          </div>

          {/* Total XP */}
          <div style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border)', borderRadius: isMobile ? '8px' : '12px', padding: isMobile ? '10px 8px' : '16px', textAlign: 'center' }}>
            <Target size={isMobile ? 20 : 28} style={{ color: 'var(--link)' }} />
            <p style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: 700, color: 'var(--link)', margin: '2px 0 0 0' }}>
              {xp.total.toLocaleString()}
            </p>
            <p style={{ fontSize: isMobile ? '10px' : '12px', color: 'var(--text-muted)', margin: '1px 0 0 0' }}>Total XP</p>
          </div>

          {/* Tasks Completed */}
          <div style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border)', borderRadius: isMobile ? '8px' : '12px', padding: isMobile ? '10px 8px' : '16px', textAlign: 'center', gridColumn: isMobile ? 'span 1' : 'auto' }}>
            <Clock size={isMobile ? 20 : 28} style={{ color: 'var(--success)' }} />
            <p style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: 700, color: 'var(--success)', margin: '2px 0 0 0' }}>
              {streak.totalTasksCompleted}
            </p>
            <p style={{ fontSize: isMobile ? '10px' : '12px', color: 'var(--text-muted)', margin: '1px 0 0 0' }}>Tasks Done</p>
          </div>

          {/* Best Streak */}
          <div style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border)', borderRadius: isMobile ? '8px' : '12px', padding: isMobile ? '10px 8px' : '16px', textAlign: 'center', gridColumn: isMobile ? 'span 2' : 'auto' }}>
            <Trophy size={isMobile ? 20 : 28} style={{ color: 'var(--warning)' }} />
            <p style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: 700, color: 'var(--warning)', margin: '2px 0 0 0' }}>
              {streak.longestStreak}
            </p>
            <p style={{ fontSize: isMobile ? '10px' : '12px', color: 'var(--text-muted)', margin: '1px 0 0 0' }}>Best Streak</p>
          </div>
        </div>

        {/* Level Progress and Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: isMobile ? '10px' : '16px', marginBottom: isMobile ? '12px' : '24px' }}>
          {/* Level Progress */}
          <Card title="Level Progress" style={isMobile ? { padding: '12px' } : undefined}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px', marginBottom: isMobile ? '8px' : '12px' }}>
              <Zap size={isMobile ? 16 : 20} style={{ color: 'var(--link)' }} />
              <span style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 700, color: 'var(--link)' }}>
                Level {xp.level}
              </span>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: isMobile ? '11px' : '13px', color: 'var(--text-muted)' }}>
                <span>{xp.currentLevelXp} XP</span>
                <span>{xp.nextLevelXp} XP</span>
              </div>
              <div style={{ height: isMobile ? '6px' : '8px', backgroundColor: 'var(--border)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ width: `${xp.progress}%`, height: '100%', background: 'var(--link)', transition: 'width 0.5s' }} />
              </div>
              <p style={{ fontSize: isMobile ? '11px' : '13px', color: 'var(--text-muted)', marginTop: '3px', marginBottom: 0, textAlign: 'center' }}>
                {xp.nextLevelXp - xp.currentLevelXp} XP to Level {xp.level + 1}
              </p>
            </div>
          </Card>

          {/* Activity Calendar - Compact */}
          <Card
            title="Activity"
            style={isMobile ? { padding: '12px' } : undefined}
            action={
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <button
                  onClick={() => changeMonth(-1)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '3px' : '4px', backgroundColor: 'var(--border)', border: 'none', borderRadius: '4px', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <ChevronLeft size={isMobile ? 14 : 16} />
                </button>
                <span style={{ fontSize: isMobile ? '11px' : '13px', color: 'var(--text)', minWidth: isMobile ? '70px' : '80px', textAlign: 'center' }}>
                  {selectedMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
                <button
                  onClick={() => changeMonth(1)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '3px' : '4px', backgroundColor: 'var(--border)', border: 'none', borderRadius: '4px', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <ChevronRight size={isMobile ? 14 : 16} />
                </button>
              </div>
            }
          >
            {/* Day labels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '3px' }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: isMobile ? '8px' : '9px', color: 'var(--text-muted)' }}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid - compact */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: isMobile ? '2px' : '3px' }}>
              {monthDays.map((day, i) => (
                <div
                  key={i}
                  style={{
                    height: isMobile ? '16px' : '20px',
                    borderRadius: isMobile ? '2px' : '3px',
                    backgroundColor: getActivityColorValue(day.activity),
                    opacity: day.isCurrentMonth ? 1 : 0.3,
                  }}
                  title={`${day.date}: ${day.activity} task${day.activity !== 1 ? 's' : ''}`}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* Achievements */}
        <Card title={`Achievements (${unlockedAchievements.length}/${achievements.length})`} style={isMobile ? { padding: '12px' } : undefined}>
          {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
            <div key={category} style={{ marginBottom: isMobile ? '14px' : '20px' }}>
              <h3 style={{ fontSize: isMobile ? '11px' : '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: isMobile ? '0 0 8px 0' : '0 0 10px 0' }}>
                {category === 'streak' ? 'Streak' : category === 'completion' ? 'Completion' : 'Consistency'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: isMobile ? '8px' : '12px' }}>
                {categoryAchievements.map(achievement => {
                  const isUnlocked = !!achievement.earnedAt;
                  const tierColors = getTierColors(achievement.tier);

                  return (
                    <div
                      key={achievement.id}
                      style={{
                        padding: isMobile ? '10px' : '16px',
                        borderRadius: isMobile ? '6px' : '8px',
                        backgroundColor: isUnlocked ? tierColors.bg : 'var(--panel)',
                        border: `1px solid ${isUnlocked ? tierColors.border : 'var(--border)'}`,
                        opacity: isUnlocked ? 1 : 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '10px' : '12px',
                      }}
                    >
                      <div
                        style={{
                          width: isMobile ? '36px' : '48px',
                          height: isMobile ? '36px' : '48px',
                          borderRadius: '50%',
                          backgroundColor: isUnlocked ? tierColors.bg : 'var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {isUnlocked ? getIconComponent(achievement.icon, isUnlocked, tierColors) : <Lock size={isMobile ? 16 : 20} style={{ color: 'var(--text-muted)' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 600, color: isUnlocked ? tierColors.text : 'var(--text-muted)', margin: 0 }}>
                          {achievement.name}
                        </p>
                        <p style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--text-muted)', margin: '1px 0 0 0' }}>
                          {achievement.description}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px', marginTop: isMobile ? '2px' : '4px' }}>
                          <span style={{ fontSize: isMobile ? '10px' : '11px', color: 'var(--link)' }}>
                            +{achievement.xpReward} XP
                          </span>
                          {isUnlocked && achievement.earnedAt && (
                            <span style={{ fontSize: isMobile ? '10px' : '11px', color: 'var(--text-muted)' }}>
                              Earned {new Date(achievement.earnedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}
