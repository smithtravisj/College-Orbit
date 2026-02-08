'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Crown, Clock } from 'lucide-react';
import { searchItems, groupSearchResults } from '@/lib/searchUtils';
import { SearchableItem } from '@/lib/searchIndex';
import { useSubscription } from '@/hooks/useSubscription';
import { useIsMobile } from '@/hooks/useMediaQuery';
import useAppStore from '@/lib/store';
import styles from './GlobalSearch.module.css';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const { isPremium } = useSubscription();
  const isMobile = useIsMobile();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<SearchableItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Get dynamic items from store
  const courses = useAppStore((state) => state.courses);
  const workItems = useAppStore((state) => state.workItems);
  const exams = useAppStore((state) => state.exams);
  const calendarEvents = useAppStore((state) => state.calendarEvents);
  const notes = useAppStore((state) => state.notes);
  const shoppingItems = useAppStore((state) => state.shoppingItems);
  const folders = useAppStore((state) => state.folders);

  // Flashcard decks fetched when search opens
  const [flashcardDecks, setFlashcardDecks] = useState<{ id: string; name: string; description?: string | null; courseId?: string | null }[]>([]);

  // Fetch flashcard decks when modal opens
  useEffect(() => {
    if (isOpen) {
      fetch('/api/flashcards/decks', { credentials: 'include' })
        .then(res => res.ok ? res.json() : { decks: [] })
        .then(data => setFlashcardDecks(Array.isArray(data?.decks) ? data.decks : []))
        .catch(() => setFlashcardDecks([]));
    }
  }, [isOpen]);

  // Convert dynamic items to SearchableItem format
  const dynamicItems = useMemo(() => {
    const items: SearchableItem[] = [];

    // Add courses
    courses.forEach((course: any) => {
      items.push({
        id: `course-${course.id}`,
        title: course.name,
        description: course.code ? `${course.code}${course.instructor ? ` • ${course.instructor}` : ''}` : course.instructor,
        keywords: [course.name, course.code, course.instructor].filter(Boolean),
        category: 'item',
        categoryLabel: 'Courses',
        href: '/courses',
        action: 'openModal',
        itemType: 'course',
        itemId: course.id,
        itemData: course,
      });
    });

    // Add work items (tasks, assignments, readings, projects)
    workItems.forEach((item: any) => {
      const courseName = courses.find((c: any) => c.id === item.courseId)?.name;
      items.push({
        id: `work-${item.id}`,
        title: item.title,
        description: courseName || item.type,
        keywords: [item.title, item.type, courseName].filter(Boolean),
        category: 'item',
        categoryLabel: item.type === 'task' ? 'Tasks' : item.type === 'reading' ? 'Readings' : item.type === 'project' ? 'Projects' : 'Work',
        href: '/work',
        action: 'openModal',
        itemType: 'work',
        itemId: item.id,
        itemData: item,
      });
    });

    // Add exams
    exams.forEach((exam: any) => {
      const courseName = courses.find((c: any) => c.id === exam.courseId)?.name;
      items.push({
        id: `exam-${exam.id}`,
        title: exam.title,
        description: courseName || 'Exam',
        keywords: [exam.title, courseName, 'exam', 'test'].filter(Boolean),
        category: 'item',
        categoryLabel: 'Exams',
        href: '/exams',
        action: 'openModal',
        itemType: 'exam',
        itemId: exam.id,
        itemData: exam,
      });
    });

    // Add calendar events
    calendarEvents.forEach((event: any) => {
      items.push({
        id: `event-${event.id}`,
        title: event.title,
        description: event.description || 'Calendar Event',
        keywords: [event.title, event.description, event.location].filter(Boolean),
        category: 'item',
        categoryLabel: 'Events',
        href: '/calendar',
        action: 'openModal',
        itemType: 'event',
        itemId: event.id,
        itemData: event,
      });
    });

    // Add notes
    notes.forEach((note: any) => {
      items.push({
        id: `note-${note.id}`,
        title: note.title,
        description: note.folderId ? 'Note' : 'Note',
        keywords: [note.title, note.plainText?.substring(0, 100)].filter(Boolean),
        category: 'item',
        categoryLabel: 'Notes',
        href: '/notes',
        action: 'openModal',
        itemType: 'note',
        itemId: note.id,
        itemData: note,
      });
    });

    // Add shopping items
    shoppingItems.forEach((item: any) => {
      items.push({
        id: `shopping-${item.id}`,
        title: item.name,
        description: `${item.listType}${item.category ? ` • ${item.category}` : ''}`,
        keywords: [item.name, item.listType, item.category, 'shopping', 'grocery', 'list'].filter(Boolean),
        category: 'item',
        categoryLabel: item.listType === 'grocery' ? 'Grocery' : item.listType === 'wishlist' ? 'Wishlist' : item.listType === 'pantry' ? 'Pantry' : 'Shopping',
        href: '/shopping',
        action: 'openModal',
        itemType: 'shopping',
        itemId: item.id,
        itemData: item,
      });
    });

    // Add folders
    folders.forEach((folder: any) => {
      items.push({
        id: `folder-${folder.id}`,
        title: folder.name,
        description: 'Note Folder',
        keywords: [folder.name, 'folder', 'notes', 'organize'].filter(Boolean),
        category: 'item',
        categoryLabel: 'Folders',
        href: '/notes',
        action: 'openModal',
        itemType: 'folder',
        itemId: folder.id,
        itemData: folder,
      });
    });

    // Add flashcard decks
    (Array.isArray(flashcardDecks) ? flashcardDecks : []).forEach((deck: any) => {
      const courseName = courses.find((c: any) => c.id === deck.courseId)?.name;
      items.push({
        id: `deck-${deck.id}`,
        title: deck.name,
        description: courseName || deck.description || 'Flashcard Deck',
        keywords: [deck.name, deck.description, courseName, 'flashcard', 'study'].filter(Boolean),
        category: 'item',
        categoryLabel: 'Flashcards',
        href: '/flashcards',
        action: 'openModal',
        itemType: 'deck',
        itemId: deck.id,
        itemData: deck,
      });
    });

    return items;
  }, [courses, workItems, exams, calendarEvents, notes, shoppingItems, folders, flashcardDecks]);

  const results = useMemo(() => searchItems(query, isPremium, dynamicItems), [query, isPremium, dynamicItems]);
  const groupedResults = useMemo(() => groupSearchResults(results), [results]);
  // Create a flat list in visual order (grouped by category) for keyboard navigation
  const flatResults = useMemo(() => {
    const orderedItems: SearchableItem[] = [];
    Object.values(groupedResults).forEach(items => {
      orderedItems.push(...items);
    });
    return orderedItems;
  }, [groupedResults]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('recentSearches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Save recent search to localStorage
  const saveRecentSearch = useCallback((item: SearchableItem) => {
    setRecentSearches(prev => {
      // Remove duplicate if exists, add to front, limit to 5
      const filtered = prev.filter(s => s.id !== item.id);
      const updated = [item, ...filtered].slice(0, 5);
      try {
        localStorage.setItem('recentSearches', JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
      return updated;
    });
  }, []);

  // Clear all recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('recentSearches');
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Remove a single recent search
  const removeRecentSearch = useCallback((itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter(s => s.id !== itemId);
      try {
        localStorage.setItem('recentSearches', JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
      return updated;
    });
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Focus input after a short delay to ensure modal is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Get the active list (search results or recent searches)
  const activeList = query ? flatResults : recentSearches;

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < activeList.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeList[selectedIndex]) {
          handleSelect(activeList[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeList, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = useCallback((item: SearchableItem) => {
    // Save to recent searches (but strip itemData to keep localStorage small)
    const itemToSave = { ...item };
    delete itemToSave.itemData;
    saveRecentSearch(itemToSave);

    onClose();

    // Handle modal opening for dynamic items - navigate with URL params
    // Using param names that match what each page already expects
    if (item.action === 'openModal' && item.itemId) {
      switch (item.itemType) {
        case 'work':
          router.push(`/work?task=${item.itemId}`);
          return;
        case 'exam':
          router.push(`/exams?exam=${item.itemId}`);
          return;
        case 'event':
          // Calendar events don't have a centralized modal - just navigate to calendar
          router.push('/calendar');
          return;
        case 'course':
          router.push(`/courses?course=${item.itemId}`);
          return;
        case 'note':
          router.push(`/notes?note=${item.itemId}`);
          return;
        case 'deck':
          router.push(`/flashcards?deck=${item.itemId}`);
          return;
        case 'shopping':
          router.push('/shopping');
          return;
        case 'folder':
          router.push(`/notes?folder=${item.itemId}`);
          return;
      }
    }

    // For recent searches without itemId, navigate to the page
    if (item.action === 'openModal' && !item.itemId) {
      router.push(item.href);
      return;
    }

    // Build URL with query params for tab switching and highlighting
    let url = item.href;
    const params = new URLSearchParams();

    if (item.tab) {
      params.set('tab', item.tab);
    }
    if (item.elementId) {
      params.set('highlight', item.elementId);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    router.push(url);
  }, [router, onClose, saveRecentSearch]);

  // Handle escape key at window level
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: isMobile ? '100%' : '560px' }}
      >
        {/* Search input */}
        <div className={styles.inputWrapper}>
          <Search size={20} className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search anything..."
            className={styles.input}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className={styles.clearButton}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Results */}
        <div ref={resultsRef} className={styles.results}>
          {query && flatResults.length === 0 && (
            <div className={styles.noResults}>
              No results found for "{query}"
            </div>
          )}

          {!query && recentSearches.length > 0 && (
            <div className={styles.group}>
              <div className={styles.groupHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} />
                  Recent
                </span>
                <button
                  onClick={clearRecentSearches}
                  className={styles.clearAllButton}
                  aria-label="Clear all recent searches"
                >
                  Clear all
                </button>
              </div>
              {recentSearches.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={item.id}
                    data-index={index}
                    role="button"
                    tabIndex={0}
                    className={`${styles.resultItem} ${isSelected ? styles.selected : ''}`}
                    onClick={() => handleSelect(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(item);
                      }
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className={styles.resultContent}>
                      <div className={styles.resultTitle}>
                        {item.title}
                        {item.isPremium && (
                          <Crown size={14} className={styles.premiumIcon} />
                        )}
                      </div>
                      {item.description && (
                        <div className={styles.resultDescription}>
                          {item.description}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className={styles.resultCategory}>
                        {item.categoryLabel}
                      </div>
                      <button
                        onClick={(e) => removeRecentSearch(item.id, e)}
                        className={styles.removeButton}
                        aria-label="Remove from recent"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!query && recentSearches.length === 0 && (
            <div className={styles.hint}>
              <p>Search pages, settings, courses, work, exams, notes, flashcards, and shopping</p>
              <div className={styles.hintExamples}>
                <span>Try: "theme", "pomodoro", "word counter", or the name of a course or flashcard deck</span>
              </div>
            </div>
          )}

          {Object.entries(groupedResults).map(([category, items]) => (
            <div key={category} className={styles.group}>
              <div className={styles.groupHeader}>{category}</div>
              {items.map((item) => {
                const globalIndex = flatResults.indexOf(item);
                const isSelected = globalIndex === selectedIndex;
                return (
                  <button
                    key={item.id}
                    data-index={globalIndex}
                    className={`${styles.resultItem} ${isSelected ? styles.selected : ''}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                  >
                    <div className={styles.resultContent}>
                      <div className={styles.resultTitle}>
                        {item.title}
                        {item.isPremium && (
                          <Crown size={14} className={styles.premiumIcon} />
                        )}
                      </div>
                      {item.description && (
                        <div className={styles.resultDescription}>
                          {item.description}
                        </div>
                      )}
                    </div>
                    <div className={styles.resultCategory}>
                      {item.categoryLabel}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
