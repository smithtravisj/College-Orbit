'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Check, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Flashcard } from '../types';
import { fuzzyMatch } from '../utils';
import StudyProgress from './StudyProgress';
import StudyComplete from './StudyComplete';

interface TypeAnswerModeProps {
  cards: Flashcard[];
  onRate: (cardId: string, quality: number) => void;
  onExit: () => void;
  onComplete: () => void;
  theme?: string;
  isMobile?: boolean;
  showKeyboardHints?: boolean;
  celebrations?: boolean;
}

type AnswerState = 'waiting' | 'correct' | 'incorrect';

export default function TypeAnswerMode({
  cards,
  onRate,
  onExit,
  onComplete,
  theme = 'dark',
  isMobile = false,
  showKeyboardHints = true,
  celebrations = true,
}: TypeAnswerModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [answerState, setAnswerState] = useState<AnswerState>('waiting');
  const [xpEarned, setXpEarned] = useState(0);
  const [studyComplete, setStudyComplete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentCard = cards[currentIndex];

  const checkAnswer = useCallback(() => {
    if (!currentCard || !userAnswer.trim()) return;

    const { isCorrect, similarity } = fuzzyMatch(userAnswer, currentCard.back);
    setAnswerState(isCorrect ? 'correct' : 'incorrect');

    // Auto-rate based on correctness
    const quality = isCorrect ? (similarity >= 0.95 ? 5 : 4) : 0;

    setXpEarned(prev => prev + 1);
    onRate(currentCard.id, quality);
  }, [currentCard, userAnswer, onRate]);

  const nextCard = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserAnswer('');
      setAnswerState('waiting');
      // Focus input after state update
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setStudyComplete(true);
    }
  }, [currentIndex, cards.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (studyComplete) return;

      if (e.key === 'Enter' && answerState === 'waiting' && userAnswer.trim()) {
        e.preventDefault();
        checkAnswer();
      } else if (e.key === 'Enter' && answerState !== 'waiting') {
        e.preventDefault();
        nextCard();
      } else if (e.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [checkAnswer, nextCard, onExit, answerState, userAnswer, studyComplete]);

  // Focus input on mount and when card changes
  useEffect(() => {
    if (answerState === 'waiting') {
      inputRef.current?.focus();
    }
  }, [currentIndex, answerState]);

  if (studyComplete) {
    return (
      <StudyComplete
        cardsStudied={cards.length}
        xpEarned={xpEarned}
        onStudyAgain={() => {
          setCurrentIndex(0);
          setUserAnswer('');
          setAnswerState('waiting');
          setStudyComplete(false);
        }}
        onDone={onComplete}
        celebrations={celebrations}
        isMobile={isMobile}
      />
    );
  }

  if (!currentCard) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <StudyProgress
        current={currentIndex}
        total={cards.length}
        xpEarned={xpEarned}
        onExit={onExit}
      />

      {/* Question card */}
      <div style={{
        minHeight: isMobile ? '150px' : '180px',
        padding: isMobile ? '24px' : '32px',
        backgroundColor: 'var(--panel-2)',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          textAlign: 'center',
          fontSize: isMobile ? '18px' : '22px',
          fontWeight: 500,
          color: 'var(--text)',
          lineHeight: 1.5,
        }}>
          {currentCard.front}
        </div>
      </div>

      {/* Answer input area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {answerState === 'waiting' ? (
          <>
            <Input
              ref={inputRef}
              placeholder="Type your answer..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              style={{
                fontSize: '16px',
                padding: '14px 16px',
              }}
            />
            <Button
              onClick={checkAnswer}
              disabled={!userAnswer.trim()}
              size={isMobile ? 'md' : 'lg'}
            >
              Check Answer
              {showKeyboardHints && !isMobile && (
                <span style={{ opacity: 0.7, marginLeft: '8px' }}>(Enter)</span>
              )}
            </Button>
          </>
        ) : (
          <>
            {/* Result display */}
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: answerState === 'correct'
                ? (theme === 'light' ? '#d1fae5' : '#052e16')
                : (theme === 'light' ? '#fee2e2' : '#450a0a'),
              border: `1px solid ${answerState === 'correct' ? 'var(--success)' : 'var(--danger)'}`,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}>
                {answerState === 'correct' ? (
                  <>
                    <Check size={20} style={{ color: 'var(--success)' }} />
                    <span style={{ fontWeight: 600, color: 'var(--success)' }}>Correct!</span>
                  </>
                ) : (
                  <>
                    <X size={20} style={{ color: 'var(--danger)' }} />
                    <span style={{ fontWeight: 600, color: 'var(--danger)' }}>Not quite</span>
                  </>
                )}
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Your answer:
              </div>
              <div style={{
                fontSize: '15px',
                color: 'var(--text)',
                padding: '8px 12px',
                backgroundColor: 'var(--panel)',
                borderRadius: '6px',
                marginBottom: '8px',
              }}>
                {userAnswer}
              </div>

              {answerState === 'incorrect' && (
                <>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Correct answer:
                  </div>
                  <div style={{
                    fontSize: '15px',
                    color: 'var(--text)',
                    fontWeight: 500,
                    padding: '8px 12px',
                    backgroundColor: 'var(--panel)',
                    borderRadius: '6px',
                  }}>
                    {currentCard.back}
                  </div>
                </>
              )}
            </div>

            <Button onClick={nextCard} size={isMobile ? 'md' : 'lg'}>
              {currentIndex < cards.length - 1 ? 'Next Card' : 'Finish'}
              {showKeyboardHints && !isMobile && (
                <span style={{ opacity: 0.7, marginLeft: '8px' }}>(Enter)</span>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
