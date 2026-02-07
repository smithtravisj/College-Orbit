'use client';

import { CheckCircle, BookOpen, FileText, Award, Zap, Target, Gift, Flame } from 'lucide-react';
import { DailyChallengeProgress } from '@/types';

interface DailyChallengesProps {
  challenges: DailyChallengeProgress[];
}

const iconMap: Record<string, React.ReactNode> = {
  'check-circle': <CheckCircle size={14} />,
  'book-open': <BookOpen size={14} />,
  'file-text': <FileText size={14} />,
  'award': <Award size={14} />,
  'zap': <Zap size={14} />,
  'target': <Target size={14} />,
  'flame': <Flame size={14} />,
};

export default function DailyChallenges({ challenges }: DailyChallengesProps) {
  if (!challenges || challenges.length === 0) return null;

  const allCompleted = challenges.every(c => c.completed);
  const allClaimed = challenges.every(c => c.claimed);

  return (
    <div style={{ marginTop: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Daily Challenges
        </p>
        {allCompleted && (
          <span style={{
            fontSize: '9px',
            fontWeight: 600,
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
          }}>
            <Gift size={10} /> All done!
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {challenges.map((challenge) => {
          const progress = challenge.targetCount > 0
            ? Math.min(100, Math.round((challenge.currentCount / challenge.targetCount) * 100))
            : 0;

          return (
            <div
              key={challenge.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 6px',
                borderRadius: '6px',
                backgroundColor: challenge.claimed
                  ? 'rgba(34, 197, 94, 0.08)'
                  : 'var(--bg-secondary, rgba(0,0,0,0.05))',
              }}
            >
              {/* Icon */}
              <div style={{
                color: challenge.claimed ? 'var(--success)' : challenge.completed ? 'var(--link)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}>
                {challenge.claimed ? <CheckCircle size={14} /> : iconMap[challenge.icon] || <Target size={14} />}
              </div>

              {/* Title + Progress bar */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    color: challenge.claimed ? 'var(--success)' : 'var(--text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {challenge.title}
                  </span>
                  <span style={{
                    fontSize: '9px',
                    color: challenge.claimed ? 'var(--success)' : 'var(--text-muted)',
                    flexShrink: 0,
                    marginLeft: '4px',
                  }}>
                    {challenge.currentCount}/{challenge.targetCount}
                  </span>
                </div>
                <div style={{ height: '3px', backgroundColor: 'var(--border)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${progress}%`,
                      height: '100%',
                      backgroundColor: challenge.claimed ? 'var(--success)' : challenge.completed ? 'var(--link)' : 'var(--link)',
                      transition: 'width 0.3s ease',
                      borderRadius: '9999px',
                    }}
                  />
                </div>
              </div>

              {/* XP badge or checkmark */}
              <div style={{ flexShrink: 0 }}>
                {challenge.claimed ? (
                  <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--success)' }}>
                    +{challenge.xpReward}
                  </span>
                ) : (
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                    backgroundColor: 'var(--border)',
                    padding: '1px 4px',
                    borderRadius: '4px',
                  }}>
                    {challenge.xpReward} XP
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sweep bonus indicator */}
      {allCompleted && allClaimed && (
        <div style={{
          marginTop: '4px',
          padding: '3px 6px',
          borderRadius: '6px',
          backgroundColor: 'rgba(34, 197, 94, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
        }}>
          <Zap size={10} style={{ color: 'var(--success)' }} />
          <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--success)' }}>
            Sweep Bonus +25 XP
          </span>
        </div>
      )}
    </div>
  );
}
