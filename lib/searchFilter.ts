/**
 * Shared search filter utility supporting negative terms.
 * Prefix a term with `-` to exclude items containing that term.
 *
 * Examples:
 *   "canvas"            → show items matching "canvas"
 *   "-reading"           → hide items containing "reading"
 *   "canvas -homework"   → show items with "canvas" but not "homework"
 */

export interface SearchTerms {
  positive: string[];
  negative: string[];
}

export function parseSearchQuery(query: string): SearchTerms {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const positive: string[] = [];
  const negative: string[] = [];

  for (const term of terms) {
    if (term.startsWith('-') && term.length > 1) {
      negative.push(term.slice(1));
    } else {
      positive.push(term);
    }
  }

  return { positive, negative };
}

/**
 * Check if an item matches the parsed search terms.
 * All positive terms must appear in at least one searchable string.
 * No negative term may appear in any searchable string.
 */
export function matchesSearchTerms(
  searchableStrings: string[],
  terms: SearchTerms
): boolean {
  const lowered = searchableStrings.map((s) => s.toLowerCase());
  const joined = lowered.join(' ');

  // Every positive term must appear somewhere
  for (const term of terms.positive) {
    if (!joined.includes(term)) return false;
  }

  // No negative term may appear anywhere
  for (const term of terms.negative) {
    if (joined.includes(term)) return false;
  }

  return true;
}
