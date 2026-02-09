'use client';

import { useState } from 'react';
import { Flashcard, StudyMode, FlashcardSettings } from '../types';
import StudyModeSelector from './StudyModeSelector';
import FlashcardMode from './FlashcardMode';
import TypeAnswerMode from './TypeAnswerMode';
import MatchMode from './MatchMode';

interface StudySessionProps {
  cards: Flashcard[];
  settings: FlashcardSettings;
  onRate: (cardId: string, quality: number) => void;
  onDeleteCard?: (cardId: string) => void;
  onRestoreCard?: (card: Flashcard) => void;
  onEditCard?: (cardId: string, data: { front: string; back: string }) => void;
  onExit: () => void;
  onComplete: () => void;
  theme?: string;
  isMobile?: boolean;
}

export default function StudySession({
  cards,
  settings,
  onRate,
  onDeleteCard,
  onRestoreCard,
  onEditCard,
  onExit,
  onComplete,
  theme = 'dark',
  isMobile = false,
}: StudySessionProps) {
  const [studyMode, setStudyMode] = useState<StudyMode>(settings.defaultMode);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Cards are already shuffled and limited by the parent (FlashcardsDashboard)

  if (!sessionStarted) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        padding: isMobile ? '16px' : '24px',
      }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
            Choose Study Mode
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {cards.length} cards ready to study
          </div>
        </div>

        <StudyModeSelector
          activeMode={studyMode}
          onChange={setStudyMode}
          isMobile={isMobile}
        />

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '16px',
          backgroundColor: 'var(--panel-2)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text)' }}>
            {studyMode === 'flashcard' && 'Flashcard Mode'}
            {studyMode === 'type' && 'Type Answer Mode'}
            {studyMode === 'match' && 'Match Mode'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {studyMode === 'flashcard' && 'Classic flip-to-reveal flashcards. Rate your recall after seeing the answer.'}
            {studyMode === 'type' && 'Type your answer to test your recall. Great for spelling and exact definitions.'}
            {studyMode === 'match' && 'Match terms with definitions in a fun, game-like format. Perfect for quick review.'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onExit}
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              backgroundColor: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--panel-2)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Cancel
          </button>
          <button
            onClick={() => setSessionStarted(true)}
            style={{
              flex: 2,
              padding: '14px 20px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 80%, black) 100%)',
              boxShadow: '0 0 12px color-mix(in srgb, var(--accent) 50%, transparent)',
              color: 'var(--accent-text)',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Start Studying
          </button>
        </div>
      </div>
    );
  }

  const commonProps = {
    cards: cards,
    onRate,
    onDeleteCard,
    onRestoreCard,
    onEditCard,
    onExit,
    onComplete,
    theme,
    isMobile,
    showKeyboardHints: settings.showKeyboardHints,
    celebrations: settings.celebrations,
    autoFlipDelay: settings.autoFlipDelay,
  };

  return (
    <>
      {studyMode === 'flashcard' && <FlashcardMode {...commonProps} />}
      {studyMode === 'type' && <TypeAnswerMode {...commonProps} />}
      {studyMode === 'match' && <MatchMode {...commonProps} />}
    </>
  );
}
