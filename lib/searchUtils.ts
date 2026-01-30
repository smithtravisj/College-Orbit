import { SearchableItem, SEARCH_INDEX } from './searchIndex';

interface ScoredItem extends SearchableItem {
  score: number;
}

export function searchItems(
  query: string,
  isPremium: boolean = false,
  dynamicItems: SearchableItem[] = []
): SearchableItem[] {
  if (!query.trim()) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  const queryWords = normalizedQuery.split(/\s+/);

  // Combine static index with dynamic items
  const allItems = [...SEARCH_INDEX, ...dynamicItems];

  const scoredItems: ScoredItem[] = allItems
    .filter(item => {
      // Filter out premium items for non-premium users
      if (item.isPremium && !isPremium) {
        return false;
      }
      return true;
    })
    .map(item => {
      const score = calculateScore(item, normalizedQuery, queryWords);
      return { ...item, score };
    })
    .filter(item => item.score > 0);

  // Sort by score descending
  scoredItems.sort((a, b) => b.score - a.score);

  // Return top 20 results
  return scoredItems.slice(0, 20);
}

function calculateScore(item: SearchableItem, query: string, queryWords: string[]): number {
  let score = 0;
  const title = item.title.toLowerCase();
  const description = (item.description || '').toLowerCase();
  const keywords = item.keywords.map(k => k.toLowerCase());

  // Exact title match (100 pts)
  if (title === query) {
    score += 100;
  }
  // Title starts with query (80 pts)
  else if (title.startsWith(query)) {
    score += 80;
  }
  // Title contains query (60 pts)
  else if (title.includes(query)) {
    score += 60;
  }
  // Title contains all query words (50 pts)
  else if (queryWords.every(word => title.includes(word))) {
    score += 50;
  }

  // Description contains query (30 pts)
  if (description.includes(query)) {
    score += 30;
  }
  // Description contains all query words (20 pts)
  else if (queryWords.every(word => description.includes(word))) {
    score += 20;
  }

  // Keyword matching (20-40 pts based on match quality)
  for (const keyword of keywords) {
    if (keyword === query) {
      score += 40;
      break;
    } else if (keyword.startsWith(query)) {
      score += 35;
      break;
    } else if (keyword.includes(query)) {
      score += 30;
      break;
    } else if (queryWords.some(word => keyword.includes(word))) {
      score += 20;
    }
  }

  // Bonus for category match
  const categoryLabel = item.categoryLabel.toLowerCase();
  if (categoryLabel.includes(query)) {
    score += 10;
  }

  return score;
}

export function groupSearchResults(items: SearchableItem[]): Record<string, SearchableItem[]> {
  const groups: Record<string, SearchableItem[]> = {};

  for (const item of items) {
    // For dynamic items, group by their categoryLabel
    const groupName = item.category === 'item' ? item.categoryLabel :
      item.category === 'page' ? 'Pages' :
      item.category === 'tool' ? 'Tools' :
      item.category === 'setting' ? 'Settings' :
      item.category === 'dashboard' ? 'Dashboard' : 'Other';

    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(item);
  }

  // Define preferred order for groups
  const groupOrder = ['Pages', 'Courses', 'Tasks', 'Work', 'Readings', 'Projects', 'Exams', 'Events', 'Notes', 'Tools', 'Settings', 'Dashboard', 'Calendar'];

  // Sort groups by preferred order
  const sortedGroups: Record<string, SearchableItem[]> = {};
  for (const groupName of groupOrder) {
    if (groups[groupName] && groups[groupName].length > 0) {
      sortedGroups[groupName] = groups[groupName];
    }
  }
  // Add any remaining groups not in the order list
  for (const [groupName, groupItems] of Object.entries(groups)) {
    if (!sortedGroups[groupName] && groupItems.length > 0) {
      sortedGroups[groupName] = groupItems;
    }
  }

  return sortedGroups;
}
