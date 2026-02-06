'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RotateCcw, Trash2, Pencil, X, Check } from 'lucide-react';
import { Flashcard } from '../types';
import StudyProgress from './StudyProgress';
import StudyComplete from './StudyComplete';
import { showDeleteToast } from '@/components/ui/DeleteToast';
import { showSuccessToast } from '@/components/ui/DeleteToast';

interface FlashcardModeProps {
  cards: Flashcard[];
  onRate: (cardId: string, quality: number) => void;
  onDeleteCard?: (cardId: string) => void;
  onRestoreCard?: (card: Flashcard) => void;
  onEditCard?: (cardId: string, data: { front: string; back: string }) => void;
  onExit: () => void;
  onComplete: () => void;
  theme?: string;
  isMobile?: boolean;
  showKeyboardHints?: boolean;
  celebrations?: boolean;
  autoFlipDelay?: number;
}

export default function FlashcardMode({
  cards,
  onRate,
  onDeleteCard,
  onRestoreCard,
  onEditCard,
  onExit,
  onComplete,
  theme = 'dark',
  isMobile = false,
  showKeyboardHints = true,
  celebrations = true,
  autoFlipDelay = 0,
}: FlashcardModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [studyComplete, setStudyComplete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');
  const autoFlipTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentCard = cards[currentIndex];

  // Auto-flip timer
  useEffect(() => {
    if (autoFlipDelay > 0 && !isFlipped && !studyComplete) {
      autoFlipTimerRef.current = setTimeout(() => {
        setIsFlipped(true);
      }, autoFlipDelay * 1000);
    }

    return () => {
      if (autoFlipTimerRef.current) {
        clearTimeout(autoFlipTimerRef.current);
      }
    };
  }, [currentIndex, isFlipped, autoFlipDelay, studyComplete]);

  const handleRate = useCallback((quality: number) => {
    if (!currentCard) return;

    setXpEarned(prev => prev + 1);
    onRate(currentCard.id, quality);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setStudyComplete(true);
    }
  }, [currentCard, currentIndex, cards.length, onRate]);

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleDeleteCard = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card flip
    if (!currentCard || !onDeleteCard) return;

    const cardToDelete = currentCard;

    // Delete the card
    onDeleteCard(cardToDelete.id);

    // Show undo toast
    showDeleteToast('Card deleted', () => {
      if (onRestoreCard) {
        onRestoreCard(cardToDelete);
      }
    });

    // If this was the last card, complete the session
    if (cards.length === 1) {
      setStudyComplete(true);
    } else if (currentIndex >= cards.length - 1) {
      // If we're at the last card, go to previous
      setCurrentIndex(prev => Math.max(0, prev - 1));
    }
    // Otherwise stay at same index (next card will shift into place)
    setIsFlipped(false);
  }, [currentCard, currentIndex, cards.length, onDeleteCard, onRestoreCard]);

  const handleStartEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCard) return;
    setEditFront(currentCard.front);
    setEditBack(currentCard.back);
    setIsEditing(true);
  }, [currentCard]);

  const handleSaveEdit = useCallback(() => {
    if (!currentCard || !onEditCard) return;
    if (!editFront.trim() || !editBack.trim()) return;

    onEditCard(currentCard.id, { front: editFront.trim(), back: editBack.trim() });
    showSuccessToast('Card updated');
    setIsEditing(false);
  }, [currentCard, editFront, editBack, onEditCard]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditFront('');
    setEditBack('');
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (studyComplete || isEditing) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handleFlip();
          break;
        case '1':
          if (isFlipped) handleRate(0);
          break;
        case '2':
          if (isFlipped) handleRate(3);
          break;
        case '3':
          if (isFlipped) handleRate(4);
          break;
        case '4':
          if (isFlipped) handleRate(5);
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'Escape':
          onExit();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleRate, handlePrevious, onExit, isFlipped, studyComplete, isEditing]);

  if (studyComplete) {
    return (
      <StudyComplete
        cardsStudied={cards.length}
        xpEarned={xpEarned}
        onStudyAgain={() => {
          setCurrentIndex(0);
          setIsFlipped(false);
          setStudyComplete(false);
        }}
        onDone={onComplete}
        celebrations={celebrations}
        isMobile={isMobile}
      />
    );
  }

  if (!currentCard) return null;

  const ratingButtons = [
    { quality: 0, label: 'Forgot', key: '1', bgLight: '#fee2e2', bgDark: '#450a0a', colorLight: '#991b1b', colorDark: '#fca5a5' },
    { quality: 3, label: 'Struggled', key: '2', bgLight: '#fef3c7', bgDark: '#451a03', colorLight: '#92400e', colorDark: '#fcd34d' },
    { quality: 4, label: 'Got it', key: '3', bgLight: '#d1fae5', bgDark: '#052e16', colorLight: '#065f46', colorDark: '#6ee7b7' },
    { quality: 5, label: 'Too easy', key: '4', bgLight: '#dbeafe', bgDark: '#172554', colorLight: '#1e40af', colorDark: '#93c5fd' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <StudyProgress
        current={currentIndex}
        total={cards.length}
        xpEarned={xpEarned}
        onExit={onExit}
      />

      {/* Flashcard */}
      <div
        onClick={handleFlip}
        style={{
          minHeight: isMobile ? '200px' : '250px',
          padding: isMobile ? '24px' : '32px',
          backgroundColor: 'var(--panel-2)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          perspective: '1000px',
          transition: 'transform 0.1s ease',
          position: 'relative',
        }}
      >
        <div style={{
          textAlign: 'center',
          fontSize: isMobile ? '18px' : '22px',
          fontWeight: 500,
          color: 'var(--text)',
          lineHeight: 1.5,
        }}>
          {isFlipped ? currentCard.back : currentCard.front}
        </div>
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          opacity: 0.6,
        }}>
          {isFlipped ? 'Answer' : 'Question'}
        </div>
        {/* Action buttons */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          display: 'flex',
          gap: '6px',
        }}>
          {onEditCard && (
            <button
              onClick={handleStartEdit}
              style={{
                padding: '8px',
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--accent)';
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
              title="Edit card"
            >
              <Pencil size={16} />
            </button>
          )}
          {onDeleteCard && (
            <button
              onClick={handleDeleteCard}
              style={{
                padding: '8px',
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--delete-button)';
                e.currentTarget.style.borderColor = 'var(--delete-button)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
              title="Delete card"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Edit form overlay */}
      {isEditing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: 'var(--panel)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            padding: '24px',
            width: '100%',
            maxWidth: '500px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>
                Edit Card
              </h3>
              <button
                onClick={handleCancelEdit}
                style={{
                  padding: '6px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>
                Front (Question)
              </label>
              <textarea
                value={editFront}
                onChange={(e) => setEditFront(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--panel-2)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
                placeholder="Front of card..."
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>
                Back (Answer)
              </label>
              <textarea
                value={editBack}
                onChange={(e) => setEditBack(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--panel-2)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
                placeholder="Back of card..."
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelEdit}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editFront.trim() || !editBack.trim()}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid var(--accent)',
                  backgroundColor: 'var(--accent)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  opacity: (!editFront.trim() || !editBack.trim()) ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Check size={16} />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tap to flip hint and navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: '40px' }}>
          {currentIndex > 0 && (
            <button
              onClick={handlePrevious}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <ArrowLeft size={20} />
            </button>
          )}
        </div>
        {!isFlipped && (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RotateCcw size={14} />
            <span>Tap to reveal</span>
            {showKeyboardHints && !isMobile && (
              <span style={{ opacity: 0.6 }}>(Space)</span>
            )}
          </div>
        )}
        <div style={{ width: '40px' }} />
      </div>

      {/* Rating buttons - only show when flipped */}
      {isFlipped && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          marginTop: '8px',
        }}>
          {ratingButtons.map((btn) => (
            <button
              key={btn.quality}
              onClick={() => handleRate(btn.quality)}
              style={{
                padding: isMobile ? '12px 8px' : '14px 12px',
                backgroundColor: theme === 'light' ? btn.bgLight : btn.bgDark,
                color: theme === 'light' ? btn.colorLight : btn.colorDark,
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <span>{btn.label}</span>
              {showKeyboardHints && !isMobile && (
                <span style={{ fontSize: '10px', opacity: 0.7 }}>{btn.key}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
