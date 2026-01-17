/**
 * Dashboard card layout utility
 * Calculates dynamic Tailwind col-span classes based on visible cards per row
 */

/**
 * Row definitions for dashboard cards
 * Groups cards that should share space in a row
 */
const DASHBOARD_ROWS = {
  row1: ['nextClass', 'dueSoon', 'overview'],
  row2: ['todayTasks', 'dashboard_quickLinks', 'upcomingWeek'],
} as const;

/**
 * Calculates the Tailwind col-span class for a dashboard card
 * based on how many other cards are visible in its row
 *
 * @param cardId - The ID of the card (e.g., 'nextClass', 'dueSoon')
 * @param visibleCardIds - Array of visible card IDs from settings
 * @returns Tailwind className string with responsive col-span values
 *
 * @example
 * getDashboardCardSpan('nextClass', ['nextClass', 'dueSoon', 'overview'])
 * // Returns: "col-span-12 lg:col-span-4"
 *
 * getDashboardCardSpan('nextClass', ['nextClass', 'dueSoon'])
 * // Returns: "col-span-12 lg:col-span-6"
 *
 * getDashboardCardSpan('nextClass', ['nextClass'])
 * // Returns: "col-span-12"
 */
export function getDashboardCardSpan(
  cardId: string,
  visibleCardIds: string[]
): string {
  // Find which row this card belongs to
  let rowCards: readonly string[] = [];
  for (const [_, cards] of Object.entries(DASHBOARD_ROWS)) {
    if ((cards as unknown as string[]).includes(cardId)) {
      rowCards = cards as unknown as readonly string[];
      break;
    }
  }

  // If card not found in any row, default to full width
  if (rowCards.length === 0) {
    return 'col-span-12';
  }

  // Count how many cards in this row are visible
  const visibleInRow = rowCards.filter(id => visibleCardIds.includes(id)).length;

  // Calculate span based on visible card count
  // Mobile (col-span-12) is always applied for responsiveness
  // lg: prefix applies at Tailwind's lg breakpoint (1024px+)
  switch (visibleInRow) {
    case 0:
      // No cards visible in this row (shouldn't happen due to DOM filtering)
      return 'col-span-12';
    case 1:
      // Single card: expand to full width
      return 'col-span-12';
    case 2:
      // Two cards: split equally (half width each)
      return 'col-span-12 lg:col-span-6';
    case 3:
    default:
      // Three cards: split equally (third width each)
      return 'col-span-12 lg:col-span-4';
  }
}
