export interface Course {
  id: string;
  name: string;
  code: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  interval: number;
  easeFactor: number;
  repetitions: number;
  nextReview: string;
}

export interface FlashcardDeck {
  id: string;
  name: string;
  description: string | null;
  courseId: string | null;
  course: Course | null;
  cardCount: number;
  dueCount: number;
  cards?: Flashcard[];
  createdAt?: string;
  updatedAt?: string;
  lastStudied?: string | null;
}

export type StudyMode = 'flashcard' | 'type' | 'match';
export type ViewMode = 'decks' | 'deck' | 'study';
export type CardStatus = 'due' | 'learning' | 'reviewing' | 'mastered';

export type SortOption = 'recent' | 'due' | 'alphabetical' | 'course' | 'mastery' | 'created';
export type StatusFilter = 'all' | 'due' | 'needs-review' | 'almost-mastered';
export type QuickFilter = 'all' | 'due-today' | 'this-week' | 'mastered';

export interface FlashcardSettings {
  defaultMode: StudyMode;
  cardsPerSession: number;
  dailyGoal: number;
  shuffleCards: boolean;
  autoFlipDelay: number; // 0 = off, otherwise seconds
  showKeyboardHints: boolean;
  soundEffects: boolean;
  celebrations: boolean;
  defaultSort: SortOption;
}

export const DEFAULT_FLASHCARD_SETTINGS: FlashcardSettings = {
  defaultMode: 'flashcard',
  cardsPerSession: 20,
  dailyGoal: 20,
  shuffleCards: true,
  autoFlipDelay: 0,
  showKeyboardHints: true,
  soundEffects: true,
  celebrations: true,
  defaultSort: 'recent',
};

export interface DeckStats {
  total: number;
  due: number;
  learning: number;
  reviewing: number;
  mastered: number;
  masteryPercentage: number;
}
