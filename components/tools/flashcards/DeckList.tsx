'use client';

import { Trash2, Play } from 'lucide-react';
import { FlashcardDeck } from './types';
import { calculateDeckStats, getStatusColor } from './utils';

interface DeckListProps {
  decks: FlashcardDeck[];
  onOpenDeck: (deck: FlashcardDeck) => void;
  onDeleteDeck: (deckId: string) => void;
  onQuickStudy?: (deck: FlashcardDeck) => void;
  theme?: string;
  isMobile?: boolean;
}

export default function DeckList({
  decks,
  onOpenDeck,
  onDeleteDeck,
  onQuickStudy,
  theme = 'dark',
  isMobile = false,
}: DeckListProps) {
  if (decks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
        No flashcard decks yet. Create one to get started!
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {decks.map(deck => {
        const stats = deck.cards ? calculateDeckStats(deck.cards) : null;
        const masteryBadgeColor = stats
          ? stats.masteryPercentage >= 80 ? '#fbbf24'
            : stats.masteryPercentage >= 50 ? '#9ca3af'
            : stats.masteryPercentage >= 25 ? '#d97706'
            : null
          : null;

        return (
          <div
            key={deck.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: isMobile ? '12px' : '16px',
              backgroundColor: 'var(--panel-2)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              borderLeftWidth: '3px',
              borderLeftColor: 'var(--accent)',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onClick={() => onOpenDeck(deck)}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--panel)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--panel-2)'}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <div style={{
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: 600,
                  color: 'var(--text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {deck.name}
                </div>
                {masteryBadgeColor && (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: masteryBadgeColor,
                    flexShrink: 0,
                  }} />
                )}
              </div>
              {deck.description && (
                <div style={{
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  marginTop: '2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {deck.description}
                </div>
              )}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '6px',
              }}>
                {deck.course && (
                  <div style={{ fontSize: '12px', color: 'var(--link)' }}>
                    {deck.course.code}
                  </div>
                )}
                {stats && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                  }}>
                    <span>{stats.total} cards</span>
                    {stats.masteryPercentage > 0 && (
                      <span style={{ color: getStatusColor('mastered', theme) }}>
                        {stats.masteryPercentage}% mastered
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
              {/* Due count badge */}
              {deck.dueCount > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  backgroundColor: getStatusColor('due', theme) + '20',
                }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: getStatusColor('due', theme),
                  }}>
                    {deck.dueCount} due
                  </span>
                </div>
              )}

              {/* Quick study button */}
              {onQuickStudy && deck.dueCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickStudy(deck);
                  }}
                  style={{
                    padding: '8px',
                    backgroundColor: 'var(--accent)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: 'var(--accent-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Play size={16} />
                </button>
              )}

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteDeck(deck.id);
                }}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
