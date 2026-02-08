'use client';

import { useState, useCallback } from 'react';
import { ArrowRight, X, Check, XIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import { QuizQuestion } from '../types';
import QuizComplete from './QuizComplete';

interface QuizSessionProps {
  questions: QuizQuestion[];
  deckName: string;
  onComplete: (score: number, total: number) => Promise<{ xpEarned: number }>;
  onExit: () => void;
  isMobile?: boolean;
  theme?: string;
}

export default function QuizSession({
  questions,
  deckName,
  onComplete,
  onExit,
  isMobile = false,
}: QuizSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [shortAnswer, setShortAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [evaluating, setEvaluating] = useState(false);

  const question = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleMCAnswer = useCallback((option: string) => {
    if (answered) return;
    setSelectedOption(option);
    const correct = option === question.correctAnswer;
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);
    setAnswered(true);
  }, [answered, question]);

  const handleShortAnswer = useCallback(async () => {
    if (answered || evaluating || !shortAnswer.trim()) return;
    setEvaluating(true);
    try {
      const res = await fetch('/api/flashcards/quiz/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          correctAnswer: question.correctAnswer,
          userAnswer: shortAnswer.trim(),
        }),
      });
      const data = await res.json();
      const correct = !!data.correct;
      setIsCorrect(correct);
      if (correct) setScore(s => s + 1);
    } catch {
      // Fallback: exact match (case-insensitive)
      const correct = shortAnswer.trim().toLowerCase() === question.correctAnswer.toLowerCase();
      setIsCorrect(correct);
      if (correct) setScore(s => s + 1);
    }
    setEvaluating(false);
    setAnswered(true);
  }, [answered, evaluating, shortAnswer, question]);

  const handleNext = useCallback(async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setAnswered(false);
      setSelectedOption(null);
      setShortAnswer('');
      setIsCorrect(false);
    } else {
      // Quiz complete
      const finalScore = score;
      try {
        const result = await onComplete(finalScore, questions.length);
        setXpEarned(result.xpEarned);
      } catch {
        setXpEarned(0);
      }
      setShowComplete(true);
    }
  }, [currentIndex, questions.length, score, onComplete]);

  const handleRetake = useCallback(() => {
    setCurrentIndex(0);
    setScore(0);
    setAnswered(false);
    setSelectedOption(null);
    setShortAnswer('');
    setIsCorrect(false);
    setShowComplete(false);
    setXpEarned(0);
  }, []);

  if (showComplete) {
    return (
      <QuizComplete
        score={score}
        total={questions.length}
        xpEarned={xpEarned}
        onRetake={handleRetake}
        onDone={onExit}
        isMobile={isMobile}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: 600, color: 'var(--text)' }}>
            {deckName}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Question {currentIndex + 1} of {questions.length}
          </div>
        </div>
        <button
          onClick={onExit}
          style={{
            padding: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Progress bar */}
      <div style={{
        width: '100%',
        height: '6px',
        backgroundColor: 'var(--panel-2)',
        borderRadius: '3px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          backgroundColor: 'var(--link)',
          borderRadius: '3px',
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Question */}
      <div style={{
        fontSize: isMobile ? '16px' : '18px',
        fontWeight: 600,
        color: 'var(--text)',
        lineHeight: 1.5,
        padding: '8px 0',
      }}>
        {question.question}
      </div>

      {/* Answer area */}
      {question.type === 'mc' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {question.options?.map((option, i) => {
            const isSelected = selectedOption === option;
            const isCorrectOption = option === question.correctAnswer;
            let borderColor = 'var(--border)';
            let bgColor = 'var(--panel-2)';
            let textColor = 'var(--text)';

            if (answered) {
              if (isCorrectOption) {
                borderColor = 'var(--success)';
                bgColor = 'var(--success)15';
                textColor = 'var(--success)';
              } else if (isSelected && !isCorrectOption) {
                borderColor = 'var(--error, #ef4444)';
                bgColor = 'var(--error, #ef4444)15';
                textColor = 'var(--error, #ef4444)';
              }
            } else if (isSelected) {
              borderColor = 'var(--link)';
              bgColor = 'var(--link)15';
            }

            return (
              <button
                key={i}
                onClick={() => handleMCAnswer(option)}
                disabled={answered}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: `1.5px solid ${borderColor}`,
                  backgroundColor: bgColor,
                  color: textColor,
                  fontSize: '15px',
                  textAlign: 'left',
                  cursor: answered ? 'default' : 'pointer',
                  transition: 'all 0.15s ease',
                  width: '100%',
                }}
              >
                <span style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: answered && isCorrectOption ? 'var(--success)' :
                                   answered && isSelected && !isCorrectOption ? 'var(--error, #ef4444)' :
                                   'var(--panel)',
                  color: answered && (isCorrectOption || (isSelected && !isCorrectOption)) ? 'white' : 'var(--text-muted)',
                  flexShrink: 0,
                }}>
                  {answered && isCorrectOption ? <Check size={14} /> :
                   answered && isSelected && !isCorrectOption ? <XIcon size={14} /> :
                   String.fromCharCode(65 + i)}
                </span>
                <span style={{ flex: 1 }}>{option}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={shortAnswer}
              onChange={(e) => setShortAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !answered && !evaluating) handleShortAnswer();
              }}
              placeholder="Type your answer..."
              disabled={answered}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '10px',
                border: `1.5px solid ${answered ? (isCorrect ? 'var(--success)' : 'var(--error, #ef4444)') : 'var(--border)'}`,
                backgroundColor: answered ? (isCorrect ? 'var(--success)15' : 'var(--error, #ef4444)15') : 'var(--bg)',
                color: 'var(--text)',
                fontSize: '15px',
                outline: 'none',
              }}
            />
            {!answered && (
              <Button
                onClick={handleShortAnswer}
                disabled={!shortAnswer.trim() || evaluating}
                size="md"
              >
                {evaluating ? 'Checking...' : 'Submit'}
              </Button>
            )}
          </div>
          {answered && !isCorrect && (
            <div style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              padding: '8px 12px',
              backgroundColor: 'var(--panel-2)',
              borderRadius: '8px',
            }}>
              Correct answer: <strong style={{ color: 'var(--success)' }}>{question.correctAnswer}</strong>
            </div>
          )}
        </div>
      )}

      {/* Feedback + Next */}
      {answered && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
          <div style={{
            fontSize: '15px',
            fontWeight: 600,
            color: isCorrect ? 'var(--success)' : 'var(--error, #ef4444)',
          }}>
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </div>
          <Button onClick={handleNext} size="md">
            {currentIndex < questions.length - 1 ? (
              <>
                Next <ArrowRight size={16} />
              </>
            ) : (
              'See Results'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
