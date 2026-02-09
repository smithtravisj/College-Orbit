import { Flashcard, CardStatus, DeckStats, FlashcardDeck } from './types';

export const getCardStatus = (card: Flashcard): CardStatus => {
  const now = new Date();
  const nextReview = new Date(card.nextReview);

  if (nextReview <= now) return 'due';
  if (card.repetitions === 0) return 'learning';
  if (card.interval >= 14) return 'mastered';
  return 'reviewing';
};

export const getStatusColor = (status: CardStatus, theme: string): string => {
  const colors = {
    due: theme === 'light' ? '#dc2626' : '#f87171',
    learning: theme === 'light' ? '#d97706' : '#fbbf24',
    reviewing: theme === 'light' ? '#2563eb' : '#60a5fa',
    mastered: theme === 'light' ? '#16a34a' : '#4ade80',
  };
  return colors[status];
};

export const getStatusLabel = (status: CardStatus): string => {
  const labels = {
    due: 'Due now',
    learning: 'Learning',
    reviewing: 'Reviewing',
    mastered: 'Mastered',
  };
  return labels[status];
};

export const formatNextReview = (nextReview: string): string => {
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

export const calculateDeckStats = (cards: Flashcard[]): DeckStats => {
  const counts = { due: 0, learning: 0, reviewing: 0, mastered: 0 };

  cards.forEach(card => {
    counts[getCardStatus(card)]++;
  });

  const total = cards.length;
  const masteryPercentage = total > 0 ? Math.round((counts.mastered / total) * 100) : 0;

  return {
    total,
    ...counts,
    masteryPercentage,
  };
};

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Common words to ignore when comparing answers
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
  'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
  'from', 'as', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'between', 'under', 'again', 'further', 'then',
  'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
  'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
  'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
  'and', 'but', 'if', 'or', 'because', 'until', 'while', 'although',
  'it', 'its', 'this', 'that', 'these', 'those', 'which', 'who', 'whom'
]);

// Remove punctuation and normalize text
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')
    .trim();
};

// Extract keywords (non-stop words)
const extractKeywords = (text: string): string[] => {
  const normalized = normalizeText(text);
  return normalized.split(' ').filter(word => word.length > 1 && !STOP_WORDS.has(word));
};

export const fuzzyMatch = (input: string, target: string): { isCorrect: boolean; similarity: number } => {
  const normalizedInput = normalizeText(input);
  const normalizedTarget = normalizeText(target);

  // Exact match (ignoring case and punctuation)
  if (normalizedInput === normalizedTarget) {
    return { isCorrect: true, similarity: 1 };
  }

  // Extract keywords from both
  const inputKeywords = extractKeywords(input);
  const targetKeywords = extractKeywords(target);

  // If target has no keywords, fall back to simple comparison
  if (targetKeywords.length === 0) {
    const distance = levenshteinDistance(normalizedInput, normalizedTarget);
    const maxLen = Math.max(normalizedInput.length, normalizedTarget.length);
    const similarity = maxLen > 0 ? 1 - distance / maxLen : 1;
    return { isCorrect: similarity >= 0.7, similarity };
  }

  // Check how many target keywords are present in the input
  let matchedKeywords = 0;
  for (const targetWord of targetKeywords) {
    // Check if any input word is similar to this target word
    const found = inputKeywords.some(inputWord => {
      if (inputWord === targetWord) return true;
      // Allow fuzzy matching on individual words (for typos)
      if (inputWord.length >= 3 && targetWord.length >= 3) {
        const wordDistance = levenshteinDistance(inputWord, targetWord);
        const wordSimilarity = 1 - wordDistance / Math.max(inputWord.length, targetWord.length);
        return wordSimilarity >= 0.75;
      }
      return false;
    });
    if (found) matchedKeywords++;
  }

  // Calculate keyword coverage
  const keywordCoverage = matchedKeywords / targetKeywords.length;

  // Also check overall text similarity as a backup
  const distance = levenshteinDistance(normalizedInput, normalizedTarget);
  const maxLen = Math.max(normalizedInput.length, normalizedTarget.length);
  const textSimilarity = maxLen > 0 ? 1 - distance / maxLen : 1;

  // Use the better of keyword coverage or text similarity
  const similarity = Math.max(keywordCoverage, textSimilarity);

  // Correct if either: 80%+ keyword coverage OR 70%+ text similarity
  const isCorrect = keywordCoverage >= 0.8 || textSimilarity >= 0.7;

  return { isCorrect, similarity };
};

const levenshteinDistance = (str1: string, str2: string): number => {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]) + 1;
      }
    }
  }

  return dp[m][n];
};

export const exportDeckToQuizlet = (cards: Flashcard[]): string => {
  return cards.map(card => `${card.front}\t${card.back}`).join('\n');
};

export const downloadTextFile = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const sortDecks = (decks: FlashcardDeck[], sortBy: string): FlashcardDeck[] => {
  return [...decks].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      case 'due':
        return b.dueCount - a.dueCount;
      case 'alphabetical':
        return a.name.localeCompare(b.name);
      case 'course':
        const courseA = a.course?.code || 'ZZZ';
        const courseB = b.course?.code || 'ZZZ';
        return courseA.localeCompare(courseB);
      case 'mastery':
        const statsA = a.cards ? calculateDeckStats(a.cards) : { masteryPercentage: 0 };
        const statsB = b.cards ? calculateDeckStats(b.cards) : { masteryPercentage: 0 };
        return statsA.masteryPercentage - statsB.masteryPercentage;
      case 'created':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      default:
        return 0;
    }
  });
};
