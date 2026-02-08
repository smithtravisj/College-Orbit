'use client';

import { Check, RotateCcw, ArrowLeft, PartyPopper, Trophy } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useEffect, useState } from 'react';

interface QuizCompleteProps {
  score: number;
  total: number;
  xpEarned: number;
  onRetake: () => void;
  onDone: () => void;
  isMobile?: boolean;
}

const getMotivationalMessage = (percentage: number): string => {
  if (percentage === 100) return "Perfect score! You've truly mastered this material!";
  if (percentage >= 80) return "Excellent work! You know this material really well!";
  if (percentage >= 60) return "Good job! A bit more review and you'll nail it!";
  if (percentage >= 40) return "Not bad! Keep studying and you'll improve!";
  return "Keep practicing! Every attempt helps you learn!";
};

export default function QuizComplete({
  score,
  total,
  xpEarned,
  onRetake,
  onDone,
  isMobile = false,
}: QuizCompleteProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const message = getMotivationalMessage(percentage);

  useEffect(() => {
    if (percentage >= 80) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [percentage]);

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

      {/* Icon */}
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: percentage >= 60 ? 'var(--success)20' : 'var(--warning, #f59e0b)20',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
      }}>
        {percentage >= 80 ? (
          <Trophy size={40} style={{ color: 'var(--success)' }} />
        ) : (
          <Check size={40} style={{ color: percentage >= 60 ? 'var(--success)' : 'var(--warning, #f59e0b)' }} />
        )}
      </div>

      {/* Title */}
      <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
        Quiz Complete!
      </div>

      {/* Score */}
      <div style={{
        fontSize: '32px',
        fontWeight: 700,
        color: percentage >= 80 ? 'var(--success)' : percentage >= 60 ? 'var(--link)' : 'var(--text)',
        marginBottom: '4px',
      }}>
        {score}/{total}
      </div>
      <div style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '12px' }}>
        {percentage}% correct
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
        <Button onClick={onRetake} size="lg">
          <RotateCcw size={18} />
          Retake Quiz
        </Button>
        <Button variant="secondary" onClick={onDone} size="lg">
          <ArrowLeft size={18} />
          Back to Deck
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
