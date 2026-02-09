'use client';

import React from 'react';
import { GamificationData } from '@/types';
import { formatXp } from '@/lib/utils';

type CardFormat = 'story' | 'square';

interface ShareStudyCardProps {
  data: GamificationData;
  university?: string | null;
  format: CardFormat;
}

// Hardcoded dark theme colors (html2canvas can't resolve CSS variables)
const COLORS = {
  bg: '#070b10',
  bgGradientEnd: '#0f1523',
  panel: 'rgba(255, 255, 255, 0.05)',
  panelBorder: 'rgba(255, 255, 255, 0.08)',
  text: '#f0f0f0',
  textMuted: '#8b95a8',
  accent: '#818cf8',
  accentLight: '#a5b4fc',
  streak: '#f59e0b',
  success: '#22c55e',
  successDim: 'rgba(34, 197, 94, 0.15)',
  barBg: 'rgba(255, 255, 255, 0.06)',
  glowAccent: 'rgba(129, 140, 248, 0.12)',
  glowStreak: 'rgba(245, 158, 11, 0.08)',
};

const TAGLINES = [
  'Building momentum, one day at a time.',
  'Consistency beats intensity.',
  'Knowledge compounds daily.',
  'The grind never stops.',
  'Study smart, level up.',
  'On the path to mastery.',
  'Every XP counts.',
];

function getDailyTagline(): string {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return TAGLINES[dayOfYear % TAGLINES.length];
}

// Inline lucide-style icons (html2canvas can't render lucide-react components)
type IconElement = { type: 'path'; d: string } | { type: 'circle'; cx: string; cy: string; r: string };

function LucideIcon({ elements, size, color, fill }: { elements: IconElement[]; size: number; color: string; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill || 'none'} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {elements.map((el, i) =>
        el.type === 'path' ? <path key={i} d={el.d} /> : <circle key={i} cx={el.cx} cy={el.cy} r={el.r} />
      )}
    </svg>
  );
}

// Icon element data from lucide
const ICONS: Record<string, IconElement[]> = {
  flame: [{ type: 'path', d: 'M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4' }],
  zap: [{ type: 'path', d: 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z' }],
  trophy: [
    { type: 'path', d: 'M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978' },
    { type: 'path', d: 'M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978' },
    { type: 'path', d: 'M18 9h1.5a1 1 0 0 0 0-5H18' },
    { type: 'path', d: 'M4 22h16' },
    { type: 'path', d: 'M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z' },
    { type: 'path', d: 'M6 9H4.5a1 1 0 0 1 0-5H6' },
  ],
  clock: [
    { type: 'circle', cx: '12', cy: '12', r: '10' },
    { type: 'path', d: 'M12 6v6l4 2' },
  ],
  target: [
    { type: 'circle', cx: '12', cy: '12', r: '10' },
    { type: 'circle', cx: '12', cy: '12', r: '6' },
    { type: 'circle', cx: '12', cy: '12', r: '2' },
  ],
  star: [{ type: 'path', d: 'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z' }],
  checkCircle: [
    { type: 'circle', cx: '12', cy: '12', r: '10' },
    { type: 'path', d: 'M9 12l2 2 4-4' },
  ],
};

// Inline SVG logo matching public/favicon.svg (planet + orbit ring)
function LogoSVG({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none">
      <defs>
        <linearGradient id="share-planetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#818cf8', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="share-orbitGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#818cf8', stopOpacity: 0.2 }} />
          <stop offset="50%" style={{ stopColor: '#a78bfa', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#818cf8', stopOpacity: 0.2 }} />
        </linearGradient>
        <linearGradient id="share-moonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#c4b5fd', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#a78bfa', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <ellipse cx="128" cy="128" rx="90" ry="32" stroke="url(#share-orbitGrad)" strokeWidth="4" fill="none" transform="rotate(-15, 128, 128)" />
      <circle cx="128" cy="128" r="42" fill="url(#share-planetGrad)" />
      <ellipse cx="115" cy="115" rx="15" ry="12" fill="white" opacity="0.15" />
      <circle cx="195" cy="85" r="14" fill="url(#share-moonGrad)" />
      <circle cx="191" cy="81" r="4" fill="white" opacity="0.3" />
    </svg>
  );
}

// Decorative background orbit rings
function BackgroundOrbits({ isStory }: { isStory: boolean }) {
  const size = isStory ? 1080 : 1080;
  return (
    <svg
      width={size}
      height={isStory ? 1920 : 1080}
      viewBox={`0 0 ${size} ${isStory ? 1920 : 1080}`}
      fill="none"
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    >
      {/* Large orbit ring top-right */}
      <ellipse
        cx={isStory ? 900 : 850}
        cy={isStory ? 250 : 150}
        rx={isStory ? 400 : 300}
        ry={isStory ? 140 : 100}
        stroke="rgba(129, 140, 248, 0.06)"
        strokeWidth="2"
        fill="none"
        transform={`rotate(-20, ${isStory ? 900 : 850}, ${isStory ? 250 : 150})`}
      />
      {/* Medium orbit ring bottom-left */}
      <ellipse
        cx={isStory ? 180 : 200}
        cy={isStory ? 1500 : 850}
        rx={isStory ? 300 : 250}
        ry={isStory ? 100 : 80}
        stroke="rgba(129, 140, 248, 0.04)"
        strokeWidth="1.5"
        fill="none"
        transform={`rotate(15, ${isStory ? 180 : 200}, ${isStory ? 1500 : 850})`}
      />
      {/* Small accent dots (stars) */}
      {[
        { cx: 120, cy: isStory ? 400 : 200, r: 2, o: 0.15 },
        { cx: 950, cy: isStory ? 600 : 350, r: 1.5, o: 0.1 },
        { cx: 300, cy: isStory ? 1100 : 600, r: 2.5, o: 0.12 },
        { cx: 800, cy: isStory ? 1400 : 750, r: 1.5, o: 0.08 },
        { cx: 500, cy: isStory ? 300 : 120, r: 2, o: 0.1 },
        { cx: 700, cy: isStory ? 900 : 500, r: 1, o: 0.15 },
        { cx: 200, cy: isStory ? 800 : 420, r: 1.5, o: 0.1 },
        { cx: 880, cy: isStory ? 1700 : 950, r: 2, o: 0.08 },
      ].map((star, i) => (
        <circle key={i} cx={star.cx} cy={star.cy} r={star.r} fill="white" opacity={star.o} />
      ))}
    </svg>
  );
}

// Glassmorphism panel wrapper
function GlassPanel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      backgroundColor: COLORS.panel,
      border: `1px solid ${COLORS.panelBorder}`,
      borderRadius: '24px',
      backdropFilter: 'blur(20px)',
      ...style,
    }}>
      {children}
    </div>
  );
}

const ShareStudyCard = React.forwardRef<HTMLDivElement, ShareStudyCardProps>(
  function ShareStudyCard({ data, university, format }, ref) {
    const { streak, xp, unlockedAchievements, recentActivity } = data;

    const isStory = format === 'story';
    const width = 1080;
    const height = isStory ? 1920 : 1080;

    // Format date as YYYY-MM-DD in local timezone
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const getLast7Days = (): { date: string; activity: number }[] => {
      const days: { date: string; activity: number }[] = [];
      const activityMap = new Map(
        recentActivity.map((a) => [a.date, Math.max(a.tasksCompleted, a.xpEarned > 0 ? 1 : 0)])
      );
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = formatLocalDate(date);
        days.push({ date: dateStr, activity: activityMap.get(dateStr) || 0 });
      }
      return days;
    };

    const last7Days = getLast7Days();
    const weeklyXp = last7Days.reduce((sum, day) => {
      const match = recentActivity.find((a) => a.date === day.date);
      return sum + (match?.xpEarned || 0);
    }, 0);
    const activeDays = last7Days.filter((d) => d.activity > 0).length;

    const getDayLabel = (dateStr: string) => {
      const date = new Date(dateStr + 'T12:00:00');
      return date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
    };

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const pad = isStory ? 72 : 56;
    const sectionGap = isStory ? 40 : 28;

    return (
      <div
        ref={ref}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          background: `linear-gradient(165deg, ${COLORS.bg} 0%, ${COLORS.bgGradientEnd} 50%, ${COLORS.bg} 100%)`,
          color: COLORS.text,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          padding: `${pad}px`,
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decorative elements */}
        <BackgroundOrbits isStory={isStory} />

        {/* Ambient glow — top accent */}
        <div style={{
          position: 'absolute',
          top: isStory ? '-200px' : '-150px',
          right: isStory ? '-100px' : '-80px',
          width: isStory ? '600px' : '500px',
          height: isStory ? '600px' : '500px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${COLORS.glowAccent} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        {/* Ambient glow — mid streak color */}
        <div style={{
          position: 'absolute',
          top: isStory ? '600px' : '300px',
          left: isStory ? '-200px' : '-150px',
          width: isStory ? '500px' : '400px',
          height: isStory ? '500px' : '400px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${COLORS.glowStreak} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        {/* Content (above decorations) */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>

          {/* Header: Logo + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: university ? '8px' : `${sectionGap}px` }}>
            <div style={{
              padding: '8px',
              borderRadius: '16px',
              backgroundColor: 'rgba(129, 140, 248, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <LogoSVG size={isStory ? 56 : 44} />
            </div>
            <span style={{ fontSize: isStory ? '38px' : '30px', fontWeight: 700, color: COLORS.text, letterSpacing: '-0.02em' }}>
              College Orbit
            </span>
          </div>

          {/* University name */}
          {university && (
            <p style={{
              fontSize: isStory ? '24px' : '20px',
              color: COLORS.textMuted,
              margin: `0 0 ${sectionGap}px 0`,
              letterSpacing: '0.02em',
            }}>
              {university}
            </p>
          )}

          {isStory ? (
            /* ===== STORY LAYOUT ===== */
            <>
              {/* Hero Streak */}
              <GlassPanel style={{
                padding: '56px 48px',
                textAlign: 'center',
                marginBottom: `${sectionGap}px`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '12px' }}>
                  <LucideIcon elements={ICONS.flame} size={28} color={streak.vacationMode ? COLORS.textMuted : COLORS.streak} fill={!streak.vacationMode && streak.currentStreak >= 1 ? COLORS.streak : 'none'} />
                  <p style={{ fontSize: '22px', color: COLORS.textMuted, margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>
                    {streak.vacationMode ? 'Streak Paused' : 'Current Streak'}
                  </p>
                </div>
                <p style={{
                  fontSize: '140px',
                  fontWeight: 800,
                  color: streak.vacationMode ? COLORS.textMuted : COLORS.streak,
                  margin: 0,
                  lineHeight: 1,
                }}>
                  {streak.vacationMode ? '-' : streak.currentStreak}
                </p>
                <p style={{ fontSize: '26px', color: COLORS.textMuted, margin: '12px 0 0 0', fontWeight: 500 }}>
                  {streak.vacationMode ? 'On Break' : streak.currentStreak === 1 ? 'day' : 'days'}
                </p>
              </GlassPanel>

              {/* Level + XP Bar */}
              <GlassPanel style={{
                padding: '36px 44px',
                marginBottom: `${sectionGap}px`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <LucideIcon elements={ICONS.zap} size={28} color={COLORS.accent} fill={COLORS.accent} />
                  <span style={{ fontSize: '32px', fontWeight: 700, color: COLORS.accent }}>
                    Level {xp.level}
                  </span>
                  <span style={{ fontSize: '20px', color: COLORS.textMuted }}>
                    {xp.currentLevelXp} / {xp.nextLevelXp} XP
                  </span>
                </div>
                <div style={{
                  height: '14px',
                  backgroundColor: COLORS.barBg,
                  borderRadius: '9999px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${xp.progress}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, #6366f1, ${COLORS.accentLight})`,
                    borderRadius: '9999px',
                    boxShadow: `0 0 20px ${COLORS.glowAccent}`,
                  }} />
                </div>
              </GlassPanel>

              {/* 7-Day Heatmap */}
              <GlassPanel style={{
                padding: '32px 44px',
                marginBottom: `${sectionGap}px`,
              }}>
                <p style={{ fontSize: '18px', color: COLORS.textMuted, margin: '0 0 20px 0', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>Last 7 Days</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px' }}>
                  {last7Days.map((day, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{
                        width: '100%',
                        aspectRatio: '1',
                        borderRadius: '14px',
                        backgroundColor: day.activity > 0 ? COLORS.success : COLORS.barBg,
                        boxShadow: day.activity > 0 ? `0 0 16px ${COLORS.successDim}` : 'none',
                        border: day.activity > 0 ? 'none' : `1px solid ${COLORS.panelBorder}`,
                      }} />
                      <span style={{ fontSize: '18px', color: COLORS.textMuted, display: 'block', marginTop: '10px', fontWeight: 500 }}>
                        {getDayLabel(day.date)}
                      </span>
                    </div>
                  ))}
                </div>
              </GlassPanel>

              {/* Stats Grid — 2x3 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '14px',
                marginBottom: `${sectionGap}px`,
              }}>
                {[
                  { label: 'Tasks Done', value: streak.totalTasksCompleted.toString(), color: COLORS.success, icon: <LucideIcon elements={ICONS.clock} size={24} color={COLORS.success} /> },
                  { label: 'Total XP', value: formatXp(xp.total), color: COLORS.accentLight, icon: <LucideIcon elements={ICONS.target} size={24} color={COLORS.accentLight} /> },
                  { label: 'Achievements', value: unlockedAchievements.length.toString(), color: COLORS.streak, icon: <LucideIcon elements={ICONS.star} size={24} color={COLORS.streak} fill={COLORS.streak} /> },
                  { label: 'Best Streak', value: `${streak.longestStreak}d`, color: COLORS.streak, icon: <LucideIcon elements={ICONS.trophy} size={24} color={COLORS.streak} /> },
                  { label: 'This Week', value: formatXp(weeklyXp), color: COLORS.accentLight, icon: <LucideIcon elements={ICONS.zap} size={24} color={COLORS.accentLight} fill={COLORS.accentLight} /> },
                  { label: 'Active Days', value: `${activeDays}/7`, color: COLORS.success, icon: <LucideIcon elements={ICONS.checkCircle} size={24} color={COLORS.success} /> },
                ].map((stat) => (
                  <GlassPanel key={stat.label} style={{
                    padding: '24px 16px',
                    textAlign: 'center',
                  }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '14px', backgroundColor: `${stat.color}15`, marginBottom: '10px' }}>{stat.icon}</div>
                    <p style={{ fontSize: '36px', fontWeight: 700, color: stat.color, margin: 0, lineHeight: 1 }}>
                      {stat.value}
                    </p>
                    <p style={{ fontSize: '15px', color: COLORS.textMuted, margin: '6px 0 0 0', fontWeight: 500 }}>
                      {stat.label}
                    </p>
                  </GlassPanel>
                ))}
              </div>

              {/* Spacer to push footer down */}
              <div style={{ flex: 1 }} />

              {/* Footer */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '18px', color: COLORS.textMuted, margin: '0 0 10px 0', letterSpacing: '0.04em' }}>
                  {dateStr}
                </p>
                <p style={{ fontSize: '20px', color: COLORS.accent, margin: 0, fontStyle: 'italic', fontWeight: 500 }}>
                  {getDailyTagline()}
                </p>
              </div>
            </>
          ) : (
            /* ===== SQUARE LAYOUT ===== */
            <>
              {/* Streak + Level side by side */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: `${sectionGap}px`,
              }}>
                {/* Streak */}
                <GlassPanel style={{
                  padding: '28px',
                  textAlign: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
                    <LucideIcon elements={ICONS.flame} size={18} color={streak.vacationMode ? COLORS.textMuted : COLORS.streak} fill={!streak.vacationMode && streak.currentStreak >= 1 ? COLORS.streak : 'none'} />
                    <p style={{ fontSize: '15px', color: COLORS.textMuted, margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>
                      {streak.vacationMode ? 'Paused' : 'Streak'}
                    </p>
                  </div>
                  <p style={{
                    fontSize: '76px',
                    fontWeight: 800,
                    color: streak.vacationMode ? COLORS.textMuted : COLORS.streak,
                    margin: 0,
                    lineHeight: 1,
                  }}>
                    {streak.vacationMode ? '-' : streak.currentStreak}
                  </p>
                  <p style={{ fontSize: '16px', color: COLORS.textMuted, margin: '6px 0 0 0', fontWeight: 500 }}>
                    {streak.vacationMode ? 'On Break' : streak.currentStreak === 1 ? 'day' : 'days'}
                  </p>
                </GlassPanel>

                {/* Level + XP */}
                <GlassPanel style={{
                  padding: '28px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
                    <LucideIcon elements={ICONS.zap} size={18} color={COLORS.accent} fill={COLORS.accent} />
                    <p style={{ fontSize: '15px', color: COLORS.textMuted, margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>Level</p>
                  </div>
                  <p style={{
                    fontSize: '76px',
                    fontWeight: 800,
                    color: COLORS.accent,
                    margin: 0,
                    lineHeight: 1,
                  }}>
                    {xp.level}
                  </p>
                  <div style={{ marginTop: '14px' }}>
                    <div style={{
                      height: '10px',
                      backgroundColor: COLORS.barBg,
                      borderRadius: '9999px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${xp.progress}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, #6366f1, ${COLORS.accentLight})`,
                        borderRadius: '9999px',
                        boxShadow: `0 0 16px ${COLORS.glowAccent}`,
                      }} />
                    </div>
                    <p style={{ fontSize: '13px', color: COLORS.textMuted, margin: '6px 0 0 0', fontWeight: 500 }}>
                      {xp.currentLevelXp} / {xp.nextLevelXp} XP
                    </p>
                  </div>
                </GlassPanel>
              </div>

              {/* 7-Day Heatmap */}
              <GlassPanel style={{
                padding: '24px 32px',
                marginBottom: `${sectionGap}px`,
              }}>
                <p style={{ fontSize: '15px', color: COLORS.textMuted, margin: '0 0 14px 0', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>Last 7 Days</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                  {last7Days.map((day, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{
                        width: '100%',
                        aspectRatio: '1',
                        borderRadius: '10px',
                        backgroundColor: day.activity > 0 ? COLORS.success : COLORS.barBg,
                        boxShadow: day.activity > 0 ? `0 0 12px ${COLORS.successDim}` : 'none',
                        border: day.activity > 0 ? 'none' : `1px solid ${COLORS.panelBorder}`,
                      }} />
                      <span style={{ fontSize: '14px', color: COLORS.textMuted, display: 'block', marginTop: '6px', fontWeight: 500 }}>
                        {getDayLabel(day.date)}
                      </span>
                    </div>
                  ))}
                </div>
              </GlassPanel>

              {/* Stats Grid — 2x3 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '12px',
                marginBottom: `${sectionGap}px`,
              }}>
                {[
                  { label: 'Tasks Done', value: streak.totalTasksCompleted.toString(), color: COLORS.success, icon: <LucideIcon elements={ICONS.clock} size={20} color={COLORS.success} /> },
                  { label: 'Total XP', value: formatXp(xp.total), color: COLORS.accentLight, icon: <LucideIcon elements={ICONS.target} size={20} color={COLORS.accentLight} /> },
                  { label: 'Achievements', value: unlockedAchievements.length.toString(), color: COLORS.streak, icon: <LucideIcon elements={ICONS.star} size={20} color={COLORS.streak} fill={COLORS.streak} /> },
                  { label: 'Best Streak', value: `${streak.longestStreak}d`, color: COLORS.streak, icon: <LucideIcon elements={ICONS.trophy} size={20} color={COLORS.streak} /> },
                  { label: 'This Week', value: formatXp(weeklyXp), color: COLORS.accentLight, icon: <LucideIcon elements={ICONS.zap} size={20} color={COLORS.accentLight} fill={COLORS.accentLight} /> },
                  { label: 'Active Days', value: `${activeDays}/7`, color: COLORS.success, icon: <LucideIcon elements={ICONS.checkCircle} size={20} color={COLORS.success} /> },
                ].map((stat) => (
                  <GlassPanel key={stat.label} style={{
                    padding: '18px 12px',
                    textAlign: 'center',
                  }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '10px', backgroundColor: `${stat.color}15`, marginBottom: '8px' }}>{stat.icon}</div>
                    <p style={{ fontSize: '28px', fontWeight: 700, color: stat.color, margin: 0, lineHeight: 1 }}>
                      {stat.value}
                    </p>
                    <p style={{ fontSize: '12px', color: COLORS.textMuted, margin: '4px 0 0 0', fontWeight: 500 }}>
                      {stat.label}
                    </p>
                  </GlassPanel>
                ))}
              </div>

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              {/* Footer */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '15px', color: COLORS.textMuted, margin: '0 0 8px 0', letterSpacing: '0.04em' }}>
                  {dateStr}
                </p>
                <p style={{ fontSize: '17px', color: COLORS.accent, margin: 0, fontStyle: 'italic', fontWeight: 500 }}>
                  {getDailyTagline()}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
);

export default ShareStudyCard;
