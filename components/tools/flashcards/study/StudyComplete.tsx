'use client';

import { Check, RotateCcw, ArrowRight, PartyPopper } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useEffect, useState } from 'react';

interface StudyCompleteProps {
  cardsStudied: number;
  xpEarned: number;
  onStudyAgain: () => void;
  onStudyRemaining?: () => void;
  remainingCount?: number;
  onDone: () => void;
  celebrations?: boolean;
  isMobile?: boolean;
}

const motivationalMessages = [
  "Great job! You're building strong memory foundations!",
  "Excellent work! Every card reviewed strengthens your recall!",
  "Keep it up! Consistency is the key to mastery!",
  "Amazing effort! Your brain thanks you!",
  "Well done! You're one step closer to mastering this material!",
];

export default function StudyComplete({
  cardsStudied,
  xpEarned,
  onStudyAgain,
  onStudyRemaining,
  remainingCount = 0,
  onDone,
  celebrations = true,
  isMobile = false,
}: StudyCompleteProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [message] = useState(() =>
    motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
  );

  useEffect(() => {
    if (celebrations) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [celebrations]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '24px' : '48px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Confetti animation placeholder */}
      {showConfetti && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          paddingTop: '20px',
        }}>
          <PartyPopper
            size={48}
            style={{
              color: '#fbbf24',
              animation: 'bounce 0.5s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {/* Success icon */}
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: 'var(--success)20',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
      }}>
        <Check size={40} style={{ color: 'var(--success)' }} />
      </div>

      {/* Title */}
      <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
        Study Complete!
      </div>

      {/* Stats */}
      <div style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '8px' }}>
        You reviewed {cardsStudied} cards
      </div>

      {/* XP earned */}
      {xpEarned > 0 && (
        <div style={{
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--link)',
          marginBottom: '16px',
        }}>
          +{xpEarned} XP earned!
        </div>
      )}

      {/* Motivational message */}
      <div style={{
        fontSize: '14px',
        color: 'var(--text-muted)',
        fontStyle: 'italic',
        marginBottom: '24px',
        maxWidth: '300px',
      }}>
        {message}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '250px' }}>
        <Button onClick={onStudyAgain} size="lg">
          <RotateCcw size={18} />
          Study Again
        </Button>

        {onStudyRemaining && remainingCount > 0 && (
          <Button
            variant="secondary"
            onClick={onStudyRemaining}
            size="lg"
          >
            <ArrowRight size={18} />
            Study Remaining ({remainingCount})
          </Button>
        )}

        <Button variant="secondary" onClick={onDone} size="lg">
          Done
        </Button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
