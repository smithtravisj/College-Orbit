'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Flame, Trophy, Zap, Lock, Target, Clock, Award, Star, Rocket, Medal, Crown, Sun, Moon, Sparkles, ChevronLeft, ChevronRight, Users, School, CheckCircle, BookOpen, FileText, Gift, Share2 } from 'lucide-react';
import { ShareStudyModal } from '@/components/gamification';
import Card from '@/components/ui/Card';
import { GamificationData, Achievement, DailyChallengeProgress } from '@/types';
import { useIsMobile } from '@/hooks/useMediaQuery';
import useAppStore from '@/lib/store';
import { formatXp } from '@/lib/utils';
import { useSubscription } from '@/hooks/useSubscription';

export default function ProgressPage() {
  const { status } = useSession();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { isPremium } = useSubscription();
  const visualTheme = useAppStore((state) => state.settings.visualTheme);

  // Use store data first for instant display, then fetch fresh data
  const storeInitialized = useAppStore((state) => state.initialized);
  const storeGamification = useAppStore((state) => state.gamification);
  const fetchGamification = useAppStore((state) => state.fetchGamification);
  const friendsLeaderboard = useAppStore((state) => state.friendsLeaderboard);
  const collegeLeaderboard = useAppStore((state) => state.collegeLeaderboard);
  const fetchFriendsLeaderboard = useAppStore((state) => state.fetchFriendsLeaderboard);
  const fetchCollegeLeaderboard = useAppStore((state) => state.fetchCollegeLeaderboard);
  const [gamification, setGamification] = useState<GamificationData | null>(storeGamification);
  const [loading, setLoading] = useState(!storeGamification);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [leaderboardMonth, setLeaderboardMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);

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
    if (!storeInitialized) return;

    // Fetch fresh data (updates store which updates local state)
    fetchGamification().finally(() => setLoading(false));
    setLeaderboardLoading(true);
    Promise.all([
      fetchFriendsLeaderboard(leaderboardMonth),
      fetchCollegeLeaderboard(leaderboardMonth),
    ]).finally(() => setLeaderboardLoading(false));
  }, [storeInitialized, fetchGamification, fetchFriendsLeaderboard, fetchCollegeLeaderboard, leaderboardMonth]);

  const getStreakColorValue = (streak: number, vacationMode: boolean) => {
    if (vacationMode) return 'var(--text-muted)';
    if (streak >= 1) return 'var(--warning)';
    return 'var(--text-muted)';
  };

  const getActivityColorValue = (count: number) => {
    return count > 0 ? 'var(--success)' : 'var(--border)';
  };

  const getTierColors = (_tier: string) => {
    return { bg: 'color-mix(in srgb, var(--link) 15%, transparent)', border: 'var(--link)', text: 'var(--link)' };
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
      gamification?.recentActivity?.map(a => [a.date, Math.max(a.tasksCompleted, a.xpEarned > 0 ? 1 : 0)]) || []
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

  if (loading || !gamification || !storeInitialized) {
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
      <div className="mx-auto w-full max-w-[1800px]" style={{ padding: isMobile ? '4px 16px 4px' : '12px 24px 12px', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
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
            {isPremium && visualTheme === 'cartoon' ? "Look how far you've come!" : "Track your streaks, level, and achievements."}
          </p>
        </div>
        <button
          onClick={() => setShowShareModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: isMobile ? '6px 12px' : '8px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--panel)',
            color: 'var(--text)',
            cursor: 'pointer',
            fontSize: isMobile ? '13px' : '14px',
            fontWeight: 500,
            marginTop: isMobile ? '4px' : '12px',
            whiteSpace: 'nowrap',
          }}
        >
          <Share2 size={isMobile ? 14 : 16} />
          Share
        </button>
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
              {formatXp(xp.total, 10000)}
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

        {/* Daily Challenges */}
        {gamification.dailyChallenges && gamification.dailyChallenges.length > 0 && (
          <Card title="Daily Challenges" style={isMobile ? { padding: '12px', marginBottom: '12px' } : { marginBottom: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '10px' }}>
              {gamification.dailyChallenges.map((challenge: DailyChallengeProgress) => {
                const progress = challenge.targetCount > 0
                  ? Math.min(100, Math.round((challenge.currentCount / challenge.targetCount) * 100))
                  : 0;

                const getIcon = (icon: string) => {
                  const size = isMobile ? 18 : 22;
                  switch (icon) {
                    case 'check-circle': return <CheckCircle size={size} />;
                    case 'book-open': return <BookOpen size={size} />;
                    case 'file-text': return <FileText size={size} />;
                    case 'award': return <Award size={size} />;
                    case 'zap': return <Zap size={size} />;
                    case 'target': return <Target size={size} />;
                    case 'flame': return <Flame size={size} />;
                    default: return <Target size={size} />;
                  }
                };

                return (
                  <div
                    key={challenge.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? '10px' : '14px',
                      padding: isMobile ? '10px' : '14px',
                      borderRadius: isMobile ? '8px' : '10px',
                      backgroundColor: challenge.claimed
                        ? 'rgba(34, 197, 94, 0.08)'
                        : 'var(--panel-2)',
                      border: challenge.claimed
                        ? '1px solid rgba(34, 197, 94, 0.2)'
                        : '1px solid var(--border)',
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: isMobile ? '36px' : '44px',
                      height: isMobile ? '36px' : '44px',
                      borderRadius: '50%',
                      backgroundColor: challenge.claimed ? 'rgba(34, 197, 94, 0.12)' : 'var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: challenge.claimed ? 'var(--success)' : challenge.completed ? 'var(--link)' : 'var(--text-muted)',
                    }}>
                      {challenge.claimed ? <CheckCircle size={isMobile ? 18 : 22} /> : getIcon(challenge.icon)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{
                          fontSize: isMobile ? '13px' : '14px',
                          fontWeight: 600,
                          color: challenge.claimed ? 'var(--success)' : 'var(--text)',
                        }}>
                          {challenge.title}
                        </span>
                        <span style={{
                          fontSize: isMobile ? '12px' : '13px',
                          fontWeight: 500,
                          color: challenge.claimed ? 'var(--success)' : 'var(--text-muted)',
                          flexShrink: 0,
                          marginLeft: '8px',
                        }}>
                          {challenge.currentCount}/{challenge.targetCount}
                        </span>
                      </div>
                      <p style={{
                        fontSize: isMobile ? '11px' : '12px',
                        color: 'var(--text-muted)',
                        margin: '0 0 6px 0',
                      }}>
                        {challenge.description}
                      </p>
                      <div style={{ height: isMobile ? '4px' : '6px', backgroundColor: 'var(--border)', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${progress}%`,
                          height: '100%',
                          backgroundColor: challenge.claimed ? 'var(--success)' : 'var(--link)',
                          transition: 'width 0.3s ease',
                          borderRadius: '9999px',
                        }} />
                      </div>
                    </div>

                    {/* XP badge */}
                    <div style={{ flexShrink: 0 }}>
                      {challenge.claimed ? (
                        <span style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 600, color: 'var(--success)' }}>
                          +{challenge.xpReward} XP
                        </span>
                      ) : (
                        <span style={{
                          fontSize: isMobile ? '11px' : '12px',
                          fontWeight: 500,
                          color: 'var(--text-muted)',
                          backgroundColor: 'var(--border)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                        }}>
                          {challenge.xpReward} XP
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Sweep bonus */}
              {gamification.dailyChallenges.every((c: DailyChallengeProgress) => c.completed && c.claimed) && (
                <div style={{
                  padding: isMobile ? '8px' : '10px',
                  borderRadius: isMobile ? '8px' : '10px',
                  backgroundColor: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}>
                  <Gift size={isMobile ? 16 : 18} style={{ color: 'var(--success)' }} />
                  <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 600, color: 'var(--success)' }}>
                    Sweep Bonus +25 XP
                  </span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Leaderboards Section */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: isMobile ? '10px' : '16px' }}>
          {/* Friends Leaderboard */}
          <Card
            title="Friends Leaderboard"
            subtitle="Ranked by XP earned this month"
            style={isMobile ? { padding: '12px' } : undefined}
            action={
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <button
                  onClick={() => {
                    const [year, month] = leaderboardMonth.split('-').map(Number);
                    const newMonth = month === 1 ? 12 : month - 1;
                    const newYear = month === 1 ? year - 1 : year;
                    setLeaderboardMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '3px' : '4px', backgroundColor: 'var(--border)', border: 'none', borderRadius: '4px', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <ChevronLeft size={isMobile ? 14 : 16} />
                </button>
                <span style={{ fontSize: isMobile ? '11px' : '13px', color: 'var(--text)', minWidth: isMobile ? '70px' : '80px', textAlign: 'center' }}>
                  {new Date(parseInt(leaderboardMonth.split('-')[0]), parseInt(leaderboardMonth.split('-')[1]) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
                <button
                  onClick={() => {
                    const [year, month] = leaderboardMonth.split('-').map(Number);
                    const newMonth = month === 12 ? 1 : month + 1;
                    const newYear = month === 12 ? year + 1 : year;
                    const nextMonth = `${newYear}-${String(newMonth).padStart(2, '0')}`;
                    const now = new Date();
                    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                    if (nextMonth <= currentMonth) {
                      setLeaderboardMonth(nextMonth);
                    }
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '3px' : '4px', backgroundColor: 'var(--border)', border: 'none', borderRadius: '4px', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <ChevronRight size={isMobile ? 14 : 16} />
                </button>
              </div>
            }
          >
            {leaderboardLoading ? (
              <div style={{ textAlign: 'center', padding: isMobile ? '16px' : '24px' }}>
                <div style={{
                  width: isMobile ? '24px' : '32px',
                  height: isMobile ? '24px' : '32px',
                  border: '3px solid var(--border)',
                  borderTopColor: 'var(--link)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 8px'
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ fontSize: isMobile ? '13px' : '14px', color: 'var(--text-muted)', margin: 0 }}>
                  Loading leaderboard...
                </p>
              </div>
            ) : friendsLeaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', padding: isMobile ? '16px' : '24px' }}>
                <Users size={isMobile ? 32 : 40} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                <p style={{ fontSize: isMobile ? '13px' : '14px', color: 'var(--text-muted)', margin: 0 }}>
                  Add friends to compete on the leaderboard!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '6px' : '8px', maxHeight: isMobile ? '280px' : '320px', overflowY: 'auto' }}>
                {friendsLeaderboard.map((entry) => {
                  const isTop3 = entry.rank <= 3;
                  const getMedalColor = (rank: number) => {
                    if (rank === 1) return '#FFD700';
                    if (rank === 2) return '#C0C0C0';
                    if (rank === 3) return '#CD7F32';
                    return 'var(--text-muted)';
                  };

                  return (
                    <div
                      key={entry.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '8px' : '12px',
                        padding: isMobile ? '8px' : '12px',
                        backgroundColor: entry.isCurrentUser ? 'rgba(59, 130, 246, 0.1)' : 'var(--panel-2)',
                        border: entry.isCurrentUser ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid var(--border)',
                        borderRadius: isMobile ? '6px' : '8px',
                      }}
                    >
                      {/* Rank */}
                      <div style={{ width: isMobile ? '24px' : '28px', textAlign: 'center', flexShrink: 0 }}>
                        {isTop3 ? (
                          <Medal size={isMobile ? 18 : 22} style={{ color: getMedalColor(entry.rank) }} />
                        ) : (
                          <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 600, color: 'var(--text-muted)' }}>
                            #{entry.rank}
                          </span>
                        )}
                      </div>

                      {/* Avatar */}
                      <div
                        style={{
                          width: isMobile ? '32px' : '36px',
                          height: isMobile ? '32px' : '36px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        {entry.profileImage ? (
                          <img src={entry.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: 600, color: 'var(--text-muted)' }}>
                            {entry.name?.charAt(0) || entry.username?.charAt(0) || '?'}
                          </span>
                        )}
                      </div>

                      {/* Name & Stats */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: isMobile ? '13px' : '14px',
                          fontWeight: entry.isCurrentUser ? 600 : 500,
                          color: entry.isCurrentUser ? 'var(--link)' : 'var(--text)',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {entry.name || entry.username || 'Unknown'}
                          {entry.isCurrentUser && ' (You)'}
                        </p>
                        <p style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--text-muted)', margin: 0 }}>
                          {entry.username && `@${entry.username} · `}Level {entry.xp.level}
                        </p>
                      </div>

                      {/* Monthly XP & Streak */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 600, color: 'var(--link)', margin: 0 }}>
                          {formatXp(entry.xp.total)} XP
                        </p>
                        <p style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                          <Flame size={isMobile ? 10 : 12} style={{ color: entry.streak.currentStreak > 0 ? 'var(--warning)' : 'var(--text-muted)' }} />
                          {entry.streak.currentStreak}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* College Leaderboard */}
          <Card
            title="College Leaderboard"
            subtitle="Schools ranked by total XP this month"
            style={isMobile ? { padding: '12px' } : undefined}
            action={
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <button
                  onClick={() => {
                    const [year, month] = leaderboardMonth.split('-').map(Number);
                    const newMonth = month === 1 ? 12 : month - 1;
                    const newYear = month === 1 ? year - 1 : year;
                    setLeaderboardMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '3px' : '4px', backgroundColor: 'var(--border)', border: 'none', borderRadius: '4px', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <ChevronLeft size={isMobile ? 14 : 16} />
                </button>
                <span style={{ fontSize: isMobile ? '11px' : '13px', color: 'var(--text)', minWidth: isMobile ? '70px' : '80px', textAlign: 'center' }}>
                  {new Date(parseInt(leaderboardMonth.split('-')[0]), parseInt(leaderboardMonth.split('-')[1]) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
                <button
                  onClick={() => {
                    const [year, month] = leaderboardMonth.split('-').map(Number);
                    const newMonth = month === 12 ? 1 : month + 1;
                    const newYear = month === 12 ? year + 1 : year;
                    const nextMonth = `${newYear}-${String(newMonth).padStart(2, '0')}`;
                    const now = new Date();
                    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                    if (nextMonth <= currentMonth) {
                      setLeaderboardMonth(nextMonth);
                    }
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '3px' : '4px', backgroundColor: 'var(--border)', border: 'none', borderRadius: '4px', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <ChevronRight size={isMobile ? 14 : 16} />
                </button>
              </div>
            }
          >
            {leaderboardLoading ? (
              <div style={{ textAlign: 'center', padding: isMobile ? '16px' : '24px' }}>
                <div style={{
                  width: isMobile ? '24px' : '32px',
                  height: isMobile ? '24px' : '32px',
                  border: '3px solid var(--border)',
                  borderTopColor: 'var(--link)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 8px'
                }} />
                <p style={{ fontSize: isMobile ? '13px' : '14px', color: 'var(--text-muted)', margin: 0 }}>
                  Loading leaderboard...
                </p>
              </div>
            ) : collegeLeaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', padding: isMobile ? '16px' : '24px' }}>
                <School size={isMobile ? 32 : 40} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                <p style={{ fontSize: isMobile ? '13px' : '14px', color: 'var(--text-muted)', margin: 0 }}>
                  No college data for this month yet.
                </p>
                <p style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Set your college in Account settings to participate!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '6px' : '8px', maxHeight: isMobile ? '280px' : '320px', overflowY: 'auto' }}>
                {collegeLeaderboard.map((entry) => {
                  const isTop3 = entry.rank <= 3;
                  const getMedalColor = (rank: number) => {
                    if (rank === 1) return '#FFD700';
                    if (rank === 2) return '#C0C0C0';
                    if (rank === 3) return '#CD7F32';
                    return 'var(--text-muted)';
                  };

                  return (
                    <div
                      key={entry.collegeId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '8px' : '12px',
                        padding: isMobile ? '8px' : '12px',
                        backgroundColor: entry.isUserCollege ? 'rgba(59, 130, 246, 0.1)' : 'var(--panel-2)',
                        border: entry.isUserCollege ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid var(--border)',
                        borderRadius: isMobile ? '6px' : '8px',
                      }}
                    >
                      {/* Rank */}
                      <div style={{ width: isMobile ? '24px' : '28px', textAlign: 'center', flexShrink: 0 }}>
                        {isTop3 ? (
                          <Medal size={isMobile ? 18 : 22} style={{ color: getMedalColor(entry.rank) }} />
                        ) : (
                          <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 600, color: 'var(--text-muted)' }}>
                            #{entry.rank}
                          </span>
                        )}
                      </div>

                      {/* College Icon */}
                      <div
                        style={{
                          width: isMobile ? '32px' : '36px',
                          height: isMobile ? '32px' : '36px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ fontSize: isMobile ? '10px' : '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                          {entry.acronym}
                        </span>
                      </div>

                      {/* Name & Users */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: isMobile ? '13px' : '14px',
                          fontWeight: entry.isUserCollege ? 600 : 500,
                          color: entry.isUserCollege ? 'var(--link)' : 'var(--text)',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {entry.collegeName}
                          {entry.isUserCollege && ' (Your School)'}
                        </p>
                        <p style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--text-muted)', margin: 0 }}>
                          {entry.userCount} student{entry.userCount !== 1 ? 's' : ''}
                        </p>
                      </div>

                      {/* Total XP */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 600, color: 'var(--link)', margin: 0 }}>
                          {formatXp(entry.totalXp)} XP
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p style={{ fontSize: isMobile ? '10px' : '11px', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'center' }}>
              Aggregated monthly XP by college. Individual data is anonymous.
            </p>
          </Card>
        </div>

        {/* Achievements */}
        <Card title={`Achievements (${unlockedAchievements.length}/${achievements.length})`} style={isMobile ? { padding: '12px', marginTop: '12px' } : { marginTop: '24px' }}>
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
                        opacity: isUnlocked ? 1 : 0.7,
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
                        {isUnlocked ? getIconComponent(achievement.icon, isUnlocked, tierColors) : <Lock size={isMobile ? 16 : 20} style={{ color: 'var(--link)' }} />}
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

      <ShareStudyModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} />
    </>
  );
}
