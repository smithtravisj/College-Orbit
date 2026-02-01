'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, ArrowLeft, Play, Pencil, X, Upload, RotateCcw, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { showSuccessToast, showErrorToast } from '@/components/ui/DeleteToast';

interface Course {
  id: string;
  name: string;
  code: string;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  interval: number;
  easeFactor: number;
  repetitions: number;
  nextReview: string;
}

interface FlashcardDeck {
  id: string;
  name: string;
  description: string | null;
  courseId: string | null;
  course: Course | null;
  cardCount: number;
  dueCount: number;
  cards?: Flashcard[];
}

interface Props {
  theme?: string;
}

type ViewMode = 'decks' | 'deck' | 'study';

export default function Flashcards({ theme = 'dark' }: Props) {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<ViewMode>('decks');
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);
  const [loading, setLoading] = useState(true);
  const deckViewRef = useRef<HTMLDivElement>(null);

  // Deck form state
  const [showNewDeckForm, setShowNewDeckForm] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDescription, setNewDeckDescription] = useState('');
  const [newDeckCourseId, setNewDeckCourseId] = useState('');
  const [editingDeck, setEditingDeck] = useState<FlashcardDeck | null>(null);

  // Card form state
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');

  // Study mode state
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyComplete, setStudyComplete] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  // Fetch decks and courses on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [decksRes, coursesRes] = await Promise.all([
          fetch('/api/flashcards/decks'),
          fetch('/api/courses'),
        ]);

        if (decksRes.ok) {
          const { decks: fetchedDecks } = await decksRes.json();
          setDecks(fetchedDecks);
        }

        if (coursesRes.ok) {
          const { courses: fetchedCourses } = await coursesRes.json();
          setCourses(fetchedCourses);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Deck CRUD operations
  const createDeck = async () => {
    if (!newDeckName.trim()) return;

    try {
      const res = await fetch('/api/flashcards/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDeckName.trim(),
          description: newDeckDescription.trim() || null,
          courseId: newDeckCourseId || null,
        }),
      });

      if (res.ok) {
        const { deck } = await res.json();
        setDecks(prev => [deck, ...prev]);
        setNewDeckName('');
        setNewDeckDescription('');
        setNewDeckCourseId('');
        setShowNewDeckForm(false);
        showSuccessToast('Deck created successfully');
      } else {
        const data = await res.json();
        showErrorToast(data.error || 'Failed to create deck');
      }
    } catch (error) {
      console.error('Error creating deck:', error);
      showErrorToast('Failed to create deck');
    }
  };

  const updateDeck = async () => {
    if (!editingDeck || !newDeckName.trim()) return;

    try {
      const res = await fetch(`/api/flashcards/decks/${editingDeck.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDeckName.trim(),
          description: newDeckDescription.trim() || null,
          courseId: newDeckCourseId || null,
        }),
      });

      if (res.ok) {
        const { deck } = await res.json();
        setDecks(prev => prev.map(d => d.id === deck.id ? deck : d));
        if (selectedDeck?.id === deck.id) {
          setSelectedDeck({ ...selectedDeck, ...deck });
        }
        setEditingDeck(null);
        setNewDeckName('');
        setNewDeckDescription('');
        setNewDeckCourseId('');
        showSuccessToast('Deck updated successfully');
      }
    } catch (error) {
      console.error('Error updating deck:', error);
      showErrorToast('Failed to update deck');
    }
  };

  const deleteDeck = async (deckId: string) => {
    try {
      const res = await fetch(`/api/flashcards/decks/${deckId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDecks(prev => prev.filter(d => d.id !== deckId));
        if (selectedDeck?.id === deckId) {
          setSelectedDeck(null);
          setViewMode('decks');
        }
        showSuccessToast('Deck deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting deck:', error);
      showErrorToast('Failed to delete deck');
    }
  };

  const openDeck = async (deck: FlashcardDeck) => {
    try {
      const res = await fetch(`/api/flashcards/decks/${deck.id}`);
      if (res.ok) {
        const { deck: fullDeck } = await res.json();
        setSelectedDeck(fullDeck);
        setViewMode('deck');
        // Scroll to deck view after render
        setTimeout(() => {
          deckViewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch (error) {
      console.error('Error fetching deck:', error);
    }
  };

  // Card CRUD operations
  const createCard = async () => {
    if (!selectedDeck || !newCardFront.trim() || !newCardBack.trim()) return;

    try {
      const res = await fetch('/api/flashcards/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckId: selectedDeck.id,
          front: newCardFront.trim(),
          back: newCardBack.trim(),
        }),
      });

      if (res.ok) {
        const { card } = await res.json();
        setSelectedDeck(prev => prev ? {
          ...prev,
          cards: [...(prev.cards || []), card],
          cardCount: prev.cardCount + 1,
          dueCount: prev.dueCount + 1,
        } : null);
        setDecks(prev => prev.map(d => d.id === selectedDeck.id ? {
          ...d,
          cardCount: d.cardCount + 1,
          dueCount: d.dueCount + 1,
        } : d));
        setNewCardFront('');
        setNewCardBack('');
        setShowNewCardForm(false);
        showSuccessToast('Card created successfully');
      }
    } catch (error) {
      console.error('Error creating card:', error);
      showErrorToast('Failed to create card');
    }
  };

  const updateCard = async () => {
    if (!editingCard || !newCardFront.trim() || !newCardBack.trim()) return;

    try {
      const res = await fetch(`/api/flashcards/cards/${editingCard.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          front: newCardFront.trim(),
          back: newCardBack.trim(),
        }),
      });

      if (res.ok) {
        const { card } = await res.json();
        setSelectedDeck(prev => prev ? {
          ...prev,
          cards: prev.cards?.map(c => c.id === card.id ? card : c),
        } : null);
        setEditingCard(null);
        setNewCardFront('');
        setNewCardBack('');
        showSuccessToast('Card updated successfully');
      }
    } catch (error) {
      console.error('Error updating card:', error);
      showErrorToast('Failed to update card');
    }
  };

  const deleteCard = async (cardId: string) => {
    if (!selectedDeck) return;

    try {
      const res = await fetch(`/api/flashcards/cards/${cardId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        const card = selectedDeck.cards?.find(c => c.id === cardId);
        const isDue = card && new Date(card.nextReview) <= new Date();

        setSelectedDeck(prev => prev ? {
          ...prev,
          cards: prev.cards?.filter(c => c.id !== cardId),
          cardCount: prev.cardCount - 1,
          dueCount: isDue ? prev.dueCount - 1 : prev.dueCount,
        } : null);
        setDecks(prev => prev.map(d => d.id === selectedDeck.id ? {
          ...d,
          cardCount: d.cardCount - 1,
          dueCount: isDue ? d.dueCount - 1 : d.dueCount,
        } : d));
        showSuccessToast('Card deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      showErrorToast('Failed to delete card');
    }
  };

  const bulkImportCards = async () => {
    if (!selectedDeck || !bulkImportText.trim()) return;

    // Parse the bulk import text (format: front|back per line)
    const lines = bulkImportText.trim().split('\n');
    const cards = lines
      .map(line => {
        const parts = line.split('|');
        if (parts.length >= 2) {
          return { front: parts[0].trim(), back: parts.slice(1).join('|').trim() };
        }
        return null;
      })
      .filter(Boolean) as { front: string; back: string }[];

    if (cards.length === 0) {
      showErrorToast('No valid cards found. Use format: front|back');
      return;
    }

    try {
      const res = await fetch('/api/flashcards/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckId: selectedDeck.id,
          cards,
        }),
      });

      if (res.ok) {
        const { count } = await res.json();
        // Refresh the deck
        const deckRes = await fetch(`/api/flashcards/decks/${selectedDeck.id}`);
        if (deckRes.ok) {
          const { deck: fullDeck } = await deckRes.json();
          setSelectedDeck(fullDeck);
          setDecks(prev => prev.map(d => d.id === fullDeck.id ? {
            id: fullDeck.id,
            name: fullDeck.name,
            description: fullDeck.description,
            courseId: fullDeck.courseId,
            course: fullDeck.course,
            cardCount: fullDeck.cardCount,
            dueCount: fullDeck.dueCount,
          } : d));
        }
        setBulkImportText('');
        setShowBulkImport(false);
        showSuccessToast(`Imported ${count} cards successfully`);
      }
    } catch (error) {
      console.error('Error importing cards:', error);
      showErrorToast('Failed to import cards');
    }
  };

  // Study mode
  const startStudy = (mode: 'due' | 'all' = 'due') => {
    if (!selectedDeck?.cards || selectedDeck.cards.length === 0) {
      showErrorToast('No cards to study!');
      return;
    }

    const now = new Date();
    let cardsToStudy: Flashcard[];

    if (mode === 'due') {
      cardsToStudy = selectedDeck.cards.filter(card => new Date(card.nextReview) <= now);
      if (cardsToStudy.length === 0) {
        showSuccessToast('No cards due for review!');
        return;
      }
    } else {
      // Study all cards, but prioritize due cards first
      const dueCards = selectedDeck.cards.filter(card => new Date(card.nextReview) <= now);
      const notDueCards = selectedDeck.cards.filter(card => new Date(card.nextReview) > now);
      cardsToStudy = [...dueCards, ...notDueCards];
    }

    setStudyCards(cardsToStudy);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setStudyComplete(false);
    setXpEarned(0);
    setViewMode('study');
  };

  // Helper to get card status
  const getCardStatus = (card: Flashcard): 'due' | 'learning' | 'reviewing' | 'mastered' => {
    const now = new Date();
    const nextReview = new Date(card.nextReview);

    if (nextReview <= now) return 'due';
    if (card.repetitions === 0) return 'learning';
    if (card.interval >= 14) return 'mastered'; // Reached max interval (2 weeks)
    return 'reviewing';
  };

  const getStatusColor = (status: 'due' | 'learning' | 'reviewing' | 'mastered') => {
    switch (status) {
      case 'due': return theme === 'light' ? '#dc2626' : '#f87171';
      case 'learning': return theme === 'light' ? '#d97706' : '#fbbf24';
      case 'reviewing': return theme === 'light' ? '#2563eb' : '#60a5fa';
      case 'mastered': return theme === 'light' ? '#16a34a' : '#4ade80';
    }
  };

  const getStatusLabel = (status: 'due' | 'learning' | 'reviewing' | 'mastered') => {
    switch (status) {
      case 'due': return 'Due now';
      case 'learning': return 'Learning';
      case 'reviewing': return 'Reviewing';
      case 'mastered': return 'Mastered';
    }
  };

  const formatNextReview = (nextReview: string) => {
    const now = new Date();
    const next = new Date(nextReview);
    const diffMs = next.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Now';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks`;
    return `${Math.ceil(diffDays / 30)} months`;
  };

  const rateCard = (quality: number) => {
    const card = studyCards[currentCardIndex];
    if (!card) return;

    // Optimistically update XP and move to next card immediately
    setXpEarned(prev => prev + 1);

    if (currentCardIndex < studyCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setStudyComplete(true);
    }

    // Send review to API in background
    fetch('/api/flashcards/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId: card.id,
        quality,
        timezoneOffset: new Date().getTimezoneOffset(),
      }),
    }).catch(error => {
      console.error('Error rating card:', error);
    });
  };

  const finishStudy = async () => {
    // Refresh the deck to get updated due counts
    if (selectedDeck) {
      try {
        const res = await fetch(`/api/flashcards/decks/${selectedDeck.id}`);
        if (res.ok) {
          const { deck: fullDeck } = await res.json();
          setSelectedDeck(fullDeck);
          setDecks(prev => prev.map(d => d.id === fullDeck.id ? {
            id: fullDeck.id,
            name: fullDeck.name,
            description: fullDeck.description,
            courseId: fullDeck.courseId,
            course: fullDeck.course,
            cardCount: fullDeck.cardCount,
            dueCount: fullDeck.dueCount,
          } : d));
        }
      } catch (error) {
        console.error('Error refreshing deck:', error);
      }
    }
    setViewMode('deck');
    setStudyCards([]);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setStudyComplete(false);
  };

  // Render deck list
  const renderDeckList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Create deck button */}
      {!showNewDeckForm ? (
        <Button
          variant="secondary"
          size={isMobile ? 'sm' : 'md'}
          onClick={() => setShowNewDeckForm(true)}
          style={{ alignSelf: 'flex-start' }}
        >
          <Plus size={isMobile ? 14 : 18} />
          Create Deck
        </Button>
      ) : (
        <div style={{
          padding: isMobile ? '12px' : '16px',
          backgroundColor: 'var(--panel-2)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Input
              placeholder="Deck name"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
            />
            <Input
              placeholder="Description (optional)"
              value={newDeckDescription}
              onChange={(e) => setNewDeckDescription(e.target.value)}
            />
            <Select
              value={newDeckCourseId}
              onChange={(e) => setNewDeckCourseId(e.target.value)}
              options={[
                { value: '', label: 'No course (optional)' },
                ...courses.map(c => ({ value: c.id, label: `${c.code} - ${c.name}` })),
              ]}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowNewDeckForm(false);
                  setNewDeckName('');
                  setNewDeckDescription('');
                  setNewDeckCourseId('');
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={createDeck}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Deck list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
          Loading decks...
        </div>
      ) : decks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
          No flashcard decks yet. Create one to get started!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {decks.map(deck => (
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
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onClick={() => openDeck(deck)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--panel)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--panel-2)'}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: 600, color: 'var(--text)' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                    {deck.cardCount} cards
                  </div>
                  {deck.dueCount > 0 && (
                    <div style={{ fontSize: '12px', color: 'var(--accent)' }}>
                      {deck.dueCount} due
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteDeck(deck.id);
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
          ))}
        </div>
      )}
    </div>
  );

  // Render single deck view
  const renderDeckView = () => {
    if (!selectedDeck) return null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header with close button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, color: 'var(--text)' }}>
              {selectedDeck.name}
            </div>
            {selectedDeck.description && (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {selectedDeck.description}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                setEditingDeck(selectedDeck);
                setNewDeckName(selectedDeck.name);
                setNewDeckDescription(selectedDeck.description || '');
                setNewDeckCourseId(selectedDeck.courseId || '');
              }}
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
              onClick={() => {
                setViewMode('decks');
                setSelectedDeck(null);
              }}
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
        {editingDeck && (
          <div style={{
            padding: isMobile ? '12px' : '16px',
            backgroundColor: 'var(--panel-2)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Input
                placeholder="Deck name"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
              />
              <Input
                placeholder="Description (optional)"
                value={newDeckDescription}
                onChange={(e) => setNewDeckDescription(e.target.value)}
              />
              <Select
                value={newDeckCourseId}
                onChange={(e) => setNewDeckCourseId(e.target.value)}
                options={[
                  { value: '', label: 'No course (optional)' },
                  ...courses.map(c => ({ value: c.id, label: `${c.code} - ${c.name}` })),
                ]}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditingDeck(null);
                    setNewDeckName('');
                    setNewDeckDescription('');
                    setNewDeckCourseId('');
                  }}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={updateDeck}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Card status summary */}
        {selectedDeck.cards && selectedDeck.cards.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '12px 16px',
            backgroundColor: 'var(--panel-2)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
          }}>
            {(() => {
              const counts = { due: 0, learning: 0, reviewing: 0, mastered: 0 };
              selectedDeck.cards?.forEach(card => {
                counts[getCardStatus(card)]++;
              });
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getStatusColor('due') }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Due</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text)', marginLeft: 'auto' }}>{counts.due}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getStatusColor('learning') }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Learning</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text)', marginLeft: 'auto' }}>{counts.learning}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getStatusColor('reviewing') }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Reviewing</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text)', marginLeft: 'auto' }}>{counts.reviewing}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getStatusColor('mastered') }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Mastered</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text)', marginLeft: 'auto' }}>{counts.mastered}</strong>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Study buttons */}
        {selectedDeck.cards && selectedDeck.cards.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              onClick={() => startStudy('due')}
              size={isMobile ? 'md' : 'lg'}
              disabled={selectedDeck.dueCount === 0}
              style={{ opacity: selectedDeck.dueCount === 0 ? 0.5 : 1 }}
            >
              <Play size={18} />
              Study Due ({selectedDeck.dueCount})
            </Button>
            <Button
              variant="secondary"
              onClick={() => startStudy('all')}
              size={isMobile ? 'md' : 'lg'}
            >
              <Play size={18} />
              Study All ({selectedDeck.cardCount})
            </Button>
          </div>
        )}

        {/* Add card buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {!showNewCardForm && !showBulkImport && (
            <>
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
            </>
          )}
        </div>

        {/* New card form */}
        {showNewCardForm && (
          <div style={{
            padding: isMobile ? '12px' : '16px',
            backgroundColor: 'var(--panel-2)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Front (Question/Term)
                </label>
                <Input
                  placeholder="Enter the question or term"
                  value={newCardFront}
                  onChange={(e) => setNewCardFront(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Back (Answer/Definition)
                </label>
                <Input
                  placeholder="Enter the answer or definition"
                  value={newCardBack}
                  onChange={(e) => setNewCardBack(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowNewCardForm(false);
                    setNewCardFront('');
                    setNewCardBack('');
                  }}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={createCard}>
                  Add Card
                </Button>
              </div>
            </div>
          </div>
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
                Enter one card per line using the format: <code style={{ backgroundColor: 'var(--bg)', padding: '2px 6px', borderRadius: '4px' }}>front|back</code>
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
                <Button size="sm" onClick={bulkImportCards}>
                  Import Cards
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit card form */}
        {editingCard && (
          <div style={{
            padding: isMobile ? '12px' : '16px',
            backgroundColor: 'var(--panel-2)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Front (Question/Term)
                </label>
                <Input
                  placeholder="Enter the question or term"
                  value={newCardFront}
                  onChange={(e) => setNewCardFront(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Back (Answer/Definition)
                </label>
                <Input
                  placeholder="Enter the answer or definition"
                  value={newCardBack}
                  onChange={(e) => setNewCardBack(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditingCard(null);
                    setNewCardFront('');
                    setNewCardBack('');
                  }}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={updateCard}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Card list */}
        {selectedDeck.cards && selectedDeck.cards.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '8px' }}>
              Cards ({selectedDeck.cards.length})
            </div>
            {selectedDeck.cards.map((card) => {
              const status = getCardStatus(card);
              const statusColor = getStatusColor(status);
              return (
              <div
                key={card.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
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
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {card.front}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
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
                      onClick={() => {
                        setEditingCard(card);
                        setNewCardFront(card.front);
                        setNewCardBack(card.back);
                      }}
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
                      onClick={() => deleteCard(card.id)}
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
            })}
          </div>
        ) : !showNewCardForm && !showBulkImport && (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
            No cards yet. Add some cards to start studying!
          </div>
        )}
      </div>
    );
  };

  // Render study mode
  const renderStudyMode = () => {
    if (studyComplete) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '24px' : '48px',
          textAlign: 'center',
        }}>
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
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
            Study Complete!
          </div>
          <div style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            You reviewed {studyCards.length} cards
          </div>
          {xpEarned > 0 && (
            <div style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--link)',
              marginBottom: '24px',
            }}>
              +{xpEarned} XP earned!
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '250px' }}>
            <Button onClick={() => {
              // Restart studying the same cards
              setCurrentCardIndex(0);
              setIsFlipped(false);
              setStudyComplete(false);
            }} size="lg">
              Study Again
            </Button>
            {selectedDeck && selectedDeck.cards && selectedDeck.cards.length > studyCards.length && (
              <Button
                variant="secondary"
                onClick={() => {
                  // Study all remaining cards
                  const studiedIds = new Set(studyCards.map(c => c.id));
                  const remainingCards = selectedDeck.cards?.filter(c => !studiedIds.has(c.id)) || [];
                  if (remainingCards.length > 0) {
                    setStudyCards(remainingCards);
                    setCurrentCardIndex(0);
                    setIsFlipped(false);
                    setStudyComplete(false);
                  }
                }}
                size="lg"
              >
                Study Remaining ({selectedDeck.cards.length - studyCards.length})
              </Button>
            )}
            <Button variant="secondary" onClick={finishStudy} size="lg">
              Done
            </Button>
          </div>
        </div>
      );
    }

    const currentCard = studyCards[currentCardIndex];
    if (!currentCard) return null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={finishStudy}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <X size={20} />
          </button>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {currentCardIndex + 1} / {studyCards.length}
          </div>
          {xpEarned > 0 && (
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--link)' }}>
              +{xpEarned} XP
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%',
          height: '4px',
          backgroundColor: 'var(--border)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${((currentCardIndex) / studyCards.length) * 100}%`,
            backgroundColor: 'var(--link)',
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Flashcard */}
        <div
          onClick={() => setIsFlipped(!isFlipped)}
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
        </div>

        {/* Tap to flip hint and navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ width: '40px' }}>
            {currentCardIndex > 0 && (
              <button
                onClick={() => {
                  setCurrentCardIndex(prev => prev - 1);
                  setIsFlipped(false);
                }}
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
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              <RotateCcw size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Tap to reveal
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
            <button
              onClick={() => rateCard(0)}
              style={{
                padding: isMobile ? '12px 8px' : '14px 12px',
                backgroundColor: theme === 'light' ? '#fee2e2' : '#450a0a',
                color: theme === 'light' ? '#991b1b' : '#fca5a5',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              Forgot
            </button>
            <button
              onClick={() => rateCard(3)}
              style={{
                padding: isMobile ? '12px 8px' : '14px 12px',
                backgroundColor: theme === 'light' ? '#fef3c7' : '#451a03',
                color: theme === 'light' ? '#92400e' : '#fcd34d',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              Struggled
            </button>
            <button
              onClick={() => rateCard(4)}
              style={{
                padding: isMobile ? '12px 8px' : '14px 12px',
                backgroundColor: theme === 'light' ? '#d1fae5' : '#052e16',
                color: theme === 'light' ? '#065f46' : '#6ee7b7',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              Got it
            </button>
            <button
              onClick={() => rateCard(5)}
              style={{
                padding: isMobile ? '12px 8px' : '14px 12px',
                backgroundColor: theme === 'light' ? '#dbeafe' : '#172554',
                color: theme === 'light' ? '#1e40af' : '#93c5fd',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              Too easy
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Deck list card - always visible unless in study mode */}
      {viewMode !== 'study' && (
        <div style={{
          padding: isMobile ? '16px' : '20px',
          backgroundColor: 'var(--panel)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
        }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              Your Decks
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Create and manage your flashcard decks
            </p>
          </div>
          {renderDeckList()}
        </div>
      )}

      {/* Deck view card - appears when a deck is selected */}
      {viewMode === 'deck' && selectedDeck && (
        <div
          ref={deckViewRef}
          style={{
            padding: isMobile ? '16px' : '20px',
            backgroundColor: 'var(--panel)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
          }}
        >
          {renderDeckView()}
        </div>
      )}

      {/* Study mode - full screen experience */}
      {viewMode === 'study' && (
        <div style={{
          padding: isMobile ? '16px' : '20px',
          backgroundColor: 'var(--panel)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
        }}>
          {renderStudyMode()}
        </div>
      )}
    </div>
  );
}
