'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, ChevronDown, Target, Flame } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import CollapsibleCard from '@/components/ui/CollapsibleCard';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { showSuccessToast, showErrorToast } from '@/components/ui/DeleteToast';
import useStore from '@/lib/store';

import {
  FlashcardDeck,
  Flashcard,
  Course,
  ViewMode,
  SortOption,
  StatusFilter,
  QuickFilter,
  FlashcardSettings as FlashcardSettingsType,
} from './types';
import { sortDecks, calculateDeckStats } from './utils';

import DeckSidebar from './DeckSidebar';
import DeckList from './DeckList';
import DeckDetail from './DeckDetail';
import CreateDeckModal from './CreateDeckModal';
import StudySession from './study/StudySession';

interface FlashcardsDashboardProps {
  theme?: string;
}

export default function FlashcardsDashboard({ theme = 'dark' }: FlashcardsDashboardProps) {
  const isMobile = useIsMobile();
  const globalSettings = useStore((state) => state.settings);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('decks');
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);

  // Data state
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showNewDeckForm, setShowNewDeckForm] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>(globalSettings.flashcardDefaultSort ?? 'recent');
  const [showCoursesDropdown, setShowCoursesDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Map global settings to flashcard settings
  const settings: FlashcardSettingsType = useMemo(() => ({
    defaultMode: globalSettings.flashcardDefaultMode ?? 'flashcard',
    cardsPerSession: globalSettings.flashcardCardsPerSession ?? 20,
    dailyGoal: globalSettings.flashcardDailyGoal ?? 20,
    shuffleCards: globalSettings.flashcardShuffleOrder ?? true,
    autoFlipDelay: globalSettings.flashcardAutoFlipDelay ?? 0,
    showKeyboardHints: globalSettings.flashcardShowKeyboardHints ?? true,
    soundEffects: globalSettings.flashcardSoundEffects ?? true,
    celebrations: globalSettings.flashcardCelebrations ?? true,
    defaultSort: globalSettings.flashcardDefaultSort ?? 'recent',
  }), [globalSettings]);

  // Study state
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [isStudyAllMode, setIsStudyAllMode] = useState(false);

  // Daily goal state
  const [dailyProgress, setDailyProgress] = useState({
    cardsStudiedToday: 0,
    dailyGoal: settings.dailyGoal,
    progress: 0,
    goalReached: false,
  });

  // Fetch daily progress
  const fetchDailyProgress = useCallback(async () => {
    try {
      const res = await fetch('/api/flashcards/daily-progress');
      if (res.ok) {
        const data = await res.json();
        setDailyProgress(data);
      }
    } catch (error) {
      console.error('Error fetching daily progress:', error);
    }
  }, []);

  // Fetch data on mount
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
    fetchDailyProgress();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter and sort decks
  const filteredDecks = useMemo(() => {
    let filtered = [...decks];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(deck =>
        deck.name.toLowerCase().includes(query) ||
        deck.description?.toLowerCase().includes(query) ||
        deck.course?.code.toLowerCase().includes(query)
      );
    }

    // Course filter
    if (selectedCourses.size > 0) {
      filtered = filtered.filter(deck =>
        deck.courseId && selectedCourses.has(deck.courseId)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(deck => {
        const stats = deck.cards ? calculateDeckStats(deck.cards) : null;
        if (!stats) return false;

        switch (statusFilter) {
          case 'due':
            return deck.dueCount > 0;
          case 'needs-review':
            return stats.masteryPercentage < 50;
          case 'almost-mastered':
            return stats.masteryPercentage > 80;
          default:
            return true;
        }
      });
    }

    // Quick filter
    if (quickFilter !== 'all') {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const endOfWeek = new Date(now);
      endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));

      filtered = filtered.filter(deck => {
        switch (quickFilter) {
          case 'due-today':
            return deck.dueCount > 0;
          case 'this-week':
            return deck.dueCount > 0;
          case 'mastered':
            const stats = deck.cards ? calculateDeckStats(deck.cards) : null;
            return stats && stats.masteryPercentage >= 80;
          default:
            return true;
        }
      });
    }

    return sortDecks(filtered, sortBy);
  }, [decks, searchQuery, selectedCourses, statusFilter, quickFilter, sortBy]);

  // Get courses that have decks
  const coursesWithDecks = useMemo(() => {
    const courseIds = new Set(decks.map(d => d.courseId).filter(Boolean));
    return courses.filter(c => courseIds.has(c.id));
  }, [decks, courses]);

  // CRUD operations
  const createDeck = async (data: { name: string; description: string; courseId: string }) => {
    try {
      const res = await fetch('/api/flashcards/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          courseId: data.courseId || null,
        }),
      });

      if (res.ok) {
        const { deck } = await res.json();
        setDecks(prev => [deck, ...prev]);
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

  const updateDeck = async (data: { name: string; description: string; courseId: string }) => {
    if (!selectedDeck) return;

    try {
      const res = await fetch(`/api/flashcards/decks/${selectedDeck.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          courseId: data.courseId || null,
        }),
      });

      if (res.ok) {
        const { deck } = await res.json();
        setDecks(prev => prev.map(d => d.id === deck.id ? { ...d, ...deck } : d));
        setSelectedDeck(prev => prev ? { ...prev, ...deck } : null);
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error fetching deck:', error);
    }
  };

  // Card CRUD
  const createCard = async (data: { front: string; back: string }) => {
    if (!selectedDeck) return;

    try {
      const res = await fetch('/api/flashcards/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckId: selectedDeck.id,
          front: data.front,
          back: data.back,
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
        showSuccessToast('Card created successfully');
      }
    } catch (error) {
      console.error('Error creating card:', error);
      showErrorToast('Failed to create card');
    }
  };

  const updateCard = async (cardId: string, data: { front: string; back: string }) => {
    try {
      const res = await fetch(`/api/flashcards/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const { card } = await res.json();
        setSelectedDeck(prev => prev ? {
          ...prev,
          cards: prev.cards?.map(c => c.id === card.id ? card : c),
        } : null);
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

  // Delete card during study session (also removes from studyCards)
  const deleteCardDuringStudy = async (cardId: string) => {
    if (!selectedDeck) return;

    try {
      const res = await fetch(`/api/flashcards/cards/${cardId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        const card = selectedDeck.cards?.find(c => c.id === cardId);
        const isDue = card && new Date(card.nextReview) <= new Date();

        // Remove from study cards
        setStudyCards(prev => prev.filter(c => c.id !== cardId));

        // Update deck state
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
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      showErrorToast('Failed to delete card');
    }
  };

  // Restore a deleted card
  const restoreCard = async (card: Flashcard) => {
    if (!selectedDeck) return;

    try {
      const res = await fetch('/api/flashcards/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckId: selectedDeck.id,
          cards: [{ front: card.front, back: card.back }],
        }),
      });

      if (res.ok) {
        // Refresh the deck to get the new card with proper ID
        const deckRes = await fetch(`/api/flashcards/decks/${selectedDeck.id}`);
        if (deckRes.ok) {
          const { deck: fullDeck } = await deckRes.json();
          setSelectedDeck(fullDeck);
          setDecks(prev => prev.map(d => d.id === fullDeck.id ? {
            ...d,
            cardCount: fullDeck.cardCount,
            dueCount: fullDeck.dueCount,
          } : d));
        }
        showSuccessToast('Card restored');
      }
    } catch (error) {
      console.error('Error restoring card:', error);
      showErrorToast('Failed to restore card');
    }
  };

  // Update card during study session (also updates studyCards)
  const updateCardDuringStudy = async (cardId: string, data: { front: string; back: string }) => {
    try {
      const res = await fetch(`/api/flashcards/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const { card } = await res.json();
        // Update study cards
        setStudyCards(prev => prev.map(c => c.id === card.id ? { ...c, ...card } : c));
        // Update deck cards
        setSelectedDeck(prev => prev ? {
          ...prev,
          cards: prev.cards?.map(c => c.id === card.id ? card : c),
        } : null);
      }
    } catch (error) {
      console.error('Error updating card:', error);
      showErrorToast('Failed to update card');
    }
  };

  const bulkImportCards = async (text: string) => {
    if (!selectedDeck) return;

    const lines = text.trim().split('\n');
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
            ...d,
            cardCount: fullDeck.cardCount,
            dueCount: fullDeck.dueCount,
          } : d));
        }
        showSuccessToast(`Imported ${count} cards successfully`);
      }
    } catch (error) {
      console.error('Error importing cards:', error);
      showErrorToast('Failed to import cards');
    }
  };

  // Study functions
  const startStudy = (mode: 'due' | 'all', deckOverride?: FlashcardDeck) => {
    const deck = deckOverride || selectedDeck;
    if (!deck?.cards || deck.cards.length === 0) {
      showErrorToast('No cards to study!');
      return;
    }

    const now = new Date();
    let cardsToStudy: Flashcard[];

    if (mode === 'due') {
      cardsToStudy = deck.cards.filter(card => new Date(card.nextReview) <= now);
      if (cardsToStudy.length === 0) {
        showSuccessToast('No cards due for review!');
        return;
      }
    } else {
      const dueCards = deck.cards.filter(card => new Date(card.nextReview) <= now);
      const notDueCards = deck.cards.filter(card => new Date(card.nextReview) > now);
      cardsToStudy = [...dueCards, ...notDueCards];
    }

    setSelectedDeck(deck);
    setStudyCards(cardsToStudy);
    setIsStudyAllMode(mode === 'all');
    setViewMode('study');
  };

  const rateCard = async (cardId: string, quality: number) => {
    try {
      await fetch('/api/flashcards/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId,
          quality,
          timezoneOffset: new Date().getTimezoneOffset(),
        }),
      });
    } catch (error) {
      console.error('Error rating card:', error);
    }
  };

  const finishStudy = async () => {
    if (selectedDeck) {
      try {
        const res = await fetch(`/api/flashcards/decks/${selectedDeck.id}`);
        if (res.ok) {
          const { deck: fullDeck } = await res.json();
          setSelectedDeck(fullDeck);
          setDecks(prev => prev.map(d => d.id === fullDeck.id ? {
            ...d,
            cardCount: fullDeck.cardCount,
            dueCount: fullDeck.dueCount,
          } : d));
        }
      } catch (error) {
        console.error('Error refreshing deck:', error);
      }
    }
    // Refresh daily progress after study
    fetchDailyProgress();
    setViewMode('deck');
    setStudyCards([]);
  };

  const handleCourseToggle = (courseId: string) => {
    setSelectedCourses(prev => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'recent', label: 'Recently studied' },
    { value: 'due', label: 'Most cards due' },
    { value: 'alphabetical', label: 'Alphabetical' },
    { value: 'course', label: 'By course' },
    { value: 'mastery', label: 'Mastery level' },
    { value: 'created', label: 'Recently created' },
  ];

  // Render study mode
  if (viewMode === 'study' && studyCards.length > 0) {
    return (
      <div style={{
        padding: isMobile ? '16px' : '20px',
        backgroundColor: 'var(--panel)',
        borderRadius: '16px',
        border: '1px solid var(--border)',
      }}>
        <StudySession
          cards={studyCards}
          settings={settings}
          onRate={rateCard}
          onDeleteCard={deleteCardDuringStudy}
          onRestoreCard={restoreCard}
          onEditCard={updateCardDuringStudy}
          onExit={finishStudy}
          onComplete={finishStudy}
          theme={theme}
          isMobile={isMobile}
          ignoreCardLimit={isStudyAllMode}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header with sort dropdown */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button
            variant="secondary"
            size={isMobile ? 'sm' : 'md'}
            onClick={() => setShowNewDeckForm(true)}
          >
            <Plus size={isMobile ? 14 : 18} />
            {isMobile ? 'Deck' : 'New Deck'}
          </Button>
        </div>

        {/* Daily Goal Progress */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 16px',
          backgroundColor: dailyProgress.goalReached ? 'var(--success)15' : 'var(--panel-2)',
          borderRadius: '10px',
          border: `1px solid ${dailyProgress.goalReached ? 'var(--success)' : 'var(--border)'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {dailyProgress.goalReached ? (
              <Flame size={18} style={{ color: 'var(--success)' }} />
            ) : (
              <Target size={18} style={{ color: 'var(--text-muted)' }} />
            )}
            <span style={{
              fontSize: '14px',
              fontWeight: 600,
              color: dailyProgress.goalReached ? 'var(--success)' : 'var(--text)',
            }}>
              {dailyProgress.cardsStudiedToday}/{dailyProgress.dailyGoal}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {isMobile ? '' : 'today'}
            </span>
          </div>
          {/* Progress bar */}
          <div style={{
            width: isMobile ? '60px' : '80px',
            height: '6px',
            backgroundColor: 'var(--panel)',
            borderRadius: '3px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${dailyProgress.progress}%`,
              height: '100%',
              backgroundColor: dailyProgress.goalReached ? 'var(--success)' : 'var(--link)',
              borderRadius: '3px',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {/* Sort dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--panel-2)',
              color: 'var(--text-muted)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Sort: {sortOptions.find(o => o.value === sortBy)?.label}
            <ChevronDown size={14} />
          </button>
          {showSortDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '4px',
              padding: '4px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--panel)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 10,
              minWidth: '160px',
            }}>
              {sortOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSortBy(option.value);
                    setShowSortDropdown(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 12px',
                    textAlign: 'left',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: sortBy === option.value ? 'var(--panel-2)' : 'transparent',
                    color: sortBy === option.value ? 'var(--text)' : 'var(--text-muted)',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filters */}
      {isMobile && (
        <CollapsibleCard
          id="flashcards-filters"
          title="Filters"
          initialOpen={false}
        >
          <DeckSidebar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            courses={coursesWithDecks}
            selectedCourses={selectedCourses}
            onCourseToggle={handleCourseToggle}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            quickFilter={quickFilter}
            onQuickFilterChange={setQuickFilter}
            showCoursesDropdown={showCoursesDropdown}
            setShowCoursesDropdown={setShowCoursesDropdown}
            isMobile={true}
          />
        </CollapsibleCard>
      )}

      {/* Main grid layout */}
      <div className="grid grid-cols-12 gap-[var(--grid-gap)]">
        {/* Sidebar - desktop only */}
        {!isMobile && (
          <div className="col-span-3" style={{ position: 'sticky', top: '24px', alignSelf: 'start' }}>
            <Card noAccent>
              <DeckSidebar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                courses={coursesWithDecks}
                selectedCourses={selectedCourses}
                onCourseToggle={handleCourseToggle}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                quickFilter={quickFilter}
                onQuickFilterChange={setQuickFilter}
                showCoursesDropdown={showCoursesDropdown}
                setShowCoursesDropdown={setShowCoursesDropdown}
              />
            </Card>
          </div>
        )}

        {/* Main content */}
        <div className={isMobile ? 'col-span-12' : 'col-span-9'}>
          {/* New deck form */}
          {showNewDeckForm && (
            <CreateDeckModal
              isOpen={showNewDeckForm}
              onClose={() => setShowNewDeckForm(false)}
              onSubmit={createDeck}
              courses={courses}
              isMobile={isMobile}
            />
          )}

          {/* Deck list view */}
          {viewMode === 'decks' && (
            <Card noAccent>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  Loading decks...
                </div>
              ) : (
                <DeckList
                  decks={filteredDecks}
                  onOpenDeck={openDeck}
                  onDeleteDeck={deleteDeck}
                  onQuickStudy={async (deck) => {
                    try {
                      const res = await fetch(`/api/flashcards/decks/${deck.id}`);
                      if (res.ok) {
                        const { deck: fullDeck } = await res.json();
                        startStudy('due', fullDeck);
                      }
                    } catch (error) {
                      console.error('Error fetching deck for quick study:', error);
                      showErrorToast('Failed to load deck');
                    }
                  }}
                  theme={theme}
                  isMobile={isMobile}
                />
              )}
            </Card>
          )}

          {/* Deck detail view */}
          {viewMode === 'deck' && selectedDeck && (
            <Card noAccent>
              <DeckDetail
                deck={selectedDeck}
                courses={courses}
                onClose={() => {
                  setViewMode('decks');
                  setSelectedDeck(null);
                }}
                onStudyDue={() => startStudy('due')}
                onStudyAll={() => startStudy('all')}
                onEditDeck={updateDeck}
                onCreateCard={createCard}
                onEditCard={updateCard}
                onDeleteCard={deleteCard}
                onBulkImport={bulkImportCards}
                theme={theme}
                isMobile={isMobile}
              />
            </Card>
          )}
        </div>
      </div>

    </div>
  );
}
