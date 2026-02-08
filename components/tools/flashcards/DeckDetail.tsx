'use client';

import { useState } from 'react';
import { Plus, Play, Upload, Pencil, X, Sparkles, Crown, ClipboardList } from 'lucide-react';
import Button from '@/components/ui/Button';
import { FlashcardDeck, Flashcard, DeckStats } from './types';
import { calculateDeckStats } from './utils';
import DeckStatsCard from './DeckStatsCard';
import CardListItem from './CardListItem';
import CreateCardModal from './CreateCardModal';
import CreateDeckModal from './CreateDeckModal';
import AIGenerateModal from './AIGenerateModal';

interface DeckDetailProps {
  deck: FlashcardDeck;
  courses: { id: string; name: string; code: string }[];
  onClose: () => void;
  onStudyDue: () => void;
  onStudySession: () => void;
  onStudyAll: () => void;
  onEditDeck: (data: { name: string; description: string; courseId: string }) => void;
  onCreateCard: (data: { front: string; back: string }) => void;
  onEditCard: (cardId: string, data: { front: string; back: string }) => void;
  onDeleteCard: (cardId: string) => void;
  onBulkImport: (text: string) => void;
  onAIGenerate: (cards: { front: string; back: string }[]) => void;
  onQuiz: () => void;
  quizLoading?: boolean;
  isPremium?: boolean;
  cardsPerSession: number;
  theme?: string;
  isMobile?: boolean;
}

export default function DeckDetail({
  deck,
  courses,
  onClose,
  onStudyDue,
  onStudySession,
  onStudyAll,
  onEditDeck,
  onCreateCard,
  onEditCard,
  onDeleteCard,
  onBulkImport,
  onAIGenerate,
  onQuiz,
  quizLoading = false,
  isPremium = false,
  cardsPerSession,
  theme = 'dark',
  isMobile = false,
}: DeckDetailProps) {
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [showEditDeck, setShowEditDeck] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [bulkImportText, setBulkImportText] = useState('');

  const cards = deck.cards || [];
  const stats: DeckStats = cards.length > 0 ? calculateDeckStats(cards) : {
    total: 0,
    due: 0,
    learning: 0,
    reviewing: 0,
    mastered: 0,
    masteryPercentage: 0,
  };

  const handleBulkImport = () => {
    if (!bulkImportText.trim()) return;
    onBulkImport(bulkImportText);
    setBulkImportText('');
    setShowBulkImport(false);
  };

  const handleEditCard = (card: Flashcard) => {
    setEditingCard(card);
    setShowNewCardForm(false);
    setShowBulkImport(false);
  };

  const handleSubmitEditCard = (data: { front: string; back: string }) => {
    if (editingCard) {
      onEditCard(editingCard.id, data);
      setEditingCard(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, color: 'var(--text)' }}>
            {deck.name}
          </div>
          {deck.description && (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {deck.description}
            </div>
          )}
          {deck.course && (
            <div style={{ fontSize: '12px', color: 'var(--link)', marginTop: '4px' }}>
              {deck.course.code}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowEditDeck(true)}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <Pencil size={18} />
          </button>
          <button
            onClick={onClose}
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
      </div>

      {/* Edit deck form */}
      {showEditDeck && (
        <CreateDeckModal
          isOpen={showEditDeck}
          onClose={() => setShowEditDeck(false)}
          onSubmit={(data) => {
            onEditDeck(data);
            setShowEditDeck(false);
          }}
          courses={courses}
          editingDeck={deck}
          isMobile={isMobile}
        />
      )}

      {/* Stats card */}
      {cards.length > 0 && (
        <DeckStatsCard
          stats={stats}
          theme={theme}
          isMobile={isMobile}
        />
      )}

      {/* Study buttons */}
      {cards.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            onClick={onStudyDue}
            size={isMobile ? 'md' : 'lg'}
            disabled={stats.due === 0}
            style={{ opacity: stats.due === 0 ? 0.5 : 1 }}
          >
            <Play size={18} />
            Study All Due ({stats.due})
          </Button>
          <Button
            variant="secondary"
            onClick={onStudySession}
            size={isMobile ? 'md' : 'lg'}
            disabled={stats.due === 0}
            style={{ opacity: stats.due === 0 ? 0.5 : 1 }}
          >
            <Play size={18} />
            Study Session ({Math.min(stats.due, cardsPerSession)})
          </Button>
          <Button
            variant="secondary"
            onClick={onStudyAll}
            size={isMobile ? 'md' : 'lg'}
          >
            <Play size={18} />
            Study All ({stats.total})
          </Button>
          {cards.length >= 4 && (
            <Button
              variant="secondary"
              onClick={onQuiz}
              size={isMobile ? 'md' : 'lg'}
              disabled={quizLoading}
              style={{ opacity: quizLoading ? 0.6 : 1 }}
            >
              {isPremium ? <ClipboardList size={18} /> : <Crown size={18} />}
              {quizLoading ? 'Generating...' : 'Practice Quiz'}
            </Button>
          )}
        </div>
      )}

      {/* Add card buttons */}
      {!showNewCardForm && !showBulkImport && !showAIGenerate && !editingCard && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size={isMobile ? 'sm' : 'md'}
            onClick={() => setShowNewCardForm(true)}
          >
            <Plus size={isMobile ? 14 : 18} />
            Add Card
          </Button>
          <Button
            variant="secondary"
            size={isMobile ? 'sm' : 'md'}
            onClick={() => setShowBulkImport(true)}
          >
            <Upload size={isMobile ? 14 : 18} />
            Bulk Import
          </Button>
          <Button
            variant="secondary"
            size={isMobile ? 'sm' : 'md'}
            onClick={() => setShowAIGenerate(true)}
          >
            <Sparkles size={isMobile ? 14 : 18} />
            AI Generate
          </Button>
        </div>
      )}

      {/* New card form */}
      {showNewCardForm && (
        <CreateCardModal
          isOpen={showNewCardForm}
          onClose={() => setShowNewCardForm(false)}
          onSubmit={(data) => {
            onCreateCard(data);
            setShowNewCardForm(false);
          }}
          isMobile={isMobile}
        />
      )}

      {/* Edit card form */}
      {editingCard && (
        <CreateCardModal
          isOpen={!!editingCard}
          onClose={() => setEditingCard(null)}
          onSubmit={handleSubmitEditCard}
          editingCard={editingCard}
          isMobile={isMobile}
        />
      )}

      {/* Bulk import form */}
      {showBulkImport && (
        <div style={{
          padding: isMobile ? '12px' : '16px',
          backgroundColor: 'var(--panel-2)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Enter one card per line using the format:{' '}
              <code style={{ backgroundColor: 'var(--bg)', padding: '2px 6px', borderRadius: '4px' }}>
                front|back
              </code>
            </div>
            <textarea
              placeholder="What is the capital of France?|Paris&#10;What is 2+2?|4&#10;Term|Definition"
              value={bulkImportText}
              onChange={(e) => setBulkImportText(e.target.value)}
              style={{
                width: '100%',
                minHeight: '150px',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '14px',
                fontFamily: 'monospace',
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowBulkImport(false);
                  setBulkImportText('');
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleBulkImport}>
                Import Cards
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Generate form */}
      {showAIGenerate && (
        <AIGenerateModal
          onSave={(cards) => {
            onAIGenerate(cards);
            setShowAIGenerate(false);
          }}
          onClose={() => setShowAIGenerate(false)}
          isMobile={isMobile}
        />
      )}

      {/* Card list */}
      {cards.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '8px' }}>
            Cards ({cards.length})
          </div>
          {cards.map((card) => (
            <CardListItem
              key={card.id}
              card={card}
              theme={theme}
              isMobile={isMobile}
              onEdit={handleEditCard}
              onDelete={onDeleteCard}
            />
          ))}
        </div>
      ) : !showNewCardForm && !showBulkImport && (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
          No cards yet. Add some cards to start studying!
        </div>
      )}
    </div>
  );
}
