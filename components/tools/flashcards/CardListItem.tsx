'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { Flashcard } from './types';
import { getCardStatus, getStatusColor, getStatusLabel, formatNextReview } from './utils';

interface CardListItemProps {
  card: Flashcard;
  theme?: string;
  isMobile?: boolean;
  onEdit: (card: Flashcard) => void;
  onDelete: (cardId: string) => void;
}

export default function CardListItem({
  card,
  theme = 'dark',
  isMobile = false,
  onEdit,
  onDelete,
}: CardListItemProps) {
  const status = getCardStatus(card);
  const statusColor = getStatusColor(status, theme);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        padding: isMobile ? '10px 12px' : '12px 16px',
        backgroundColor: 'var(--bg)',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${statusColor}`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--text)',
          wordBreak: 'break-word',
        }}>
          {card.front}
        </div>
        <div style={{
          fontSize: '13px',
          color: 'var(--text-muted)',
          wordBreak: 'break-word',
          marginTop: '2px',
        }}>
          {card.back}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px' }}>
        <div style={{ textAlign: 'right', minWidth: isMobile ? '50px' : '70px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: statusColor }}>
            {getStatusLabel(status)}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            {status === 'due' ? 'Review now' : `Next: ${formatNextReview(card.nextReview)}`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => onEdit(card)}
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => onDelete(card.id)}
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
