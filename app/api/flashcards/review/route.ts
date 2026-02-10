import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { processFlashcardReview } from '@/lib/flashcardGamification';

// Modified SM-2 Spaced Repetition Algorithm
// Adjusted for college studying context (shorter max intervals)
function calculateNextReview(
  quality: number,
  currentInterval: number,
  currentEaseFactor: number,
  repetitions: number
): { interval: number; easeFactor: number; repetitions: number } {
  let newInterval: number;
  let newEaseFactor = currentEaseFactor;
  let newRepetitions = repetitions;

  // Maximum interval cap (14 days for college studying context)
  const MAX_INTERVAL = 14;

  // Quality ratings: 0 = Forgot, 3 = Struggled, 4 = Got it, 5 = Too easy
  if (quality < 3) {
    // Forgot - reset to beginning, review tomorrow
    newInterval = 1;
    newRepetitions = 0;
    newEaseFactor = Math.max(1.3, currentEaseFactor - 0.2);
  } else if (quality === 3) {
    // Struggled - always review in 2 days
    newInterval = 2;
    newRepetitions = Math.max(0, repetitions - 1);
    newEaseFactor = Math.max(1.3, currentEaseFactor - 0.15);
  } else if (quality === 4) {
    // Got it - normal progression
    newRepetitions = repetitions + 1;

    if (newRepetitions === 1) {
      newInterval = 3; // First time: 3 days
    } else if (newRepetitions === 2) {
      newInterval = 7; // Second time: 1 week
    } else {
      newInterval = Math.round(currentInterval * newEaseFactor);
    }
  } else {
    // Too easy (5) - aggressive progression, skip ahead
    newRepetitions = repetitions + 2; // Skip a level
    newEaseFactor = currentEaseFactor + 0.15;

    if (repetitions === 0) {
      newInterval = 7; // First time + too easy: 1 week
    } else {
      newInterval = 14; // Second time+: straight to mastered
    }
  }

  // Cap interval at maximum
  newInterval = Math.min(newInterval, MAX_INTERVAL);

  return {
    interval: Math.max(1, newInterval),
    easeFactor: Math.round(newEaseFactor * 100) / 100,
    repetitions: newRepetitions,
  };
}

// POST process a card review
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    if (!data.cardId) {
      return NextResponse.json(
        { error: 'Card ID is required' },
        { status: 400 }
      );
    }

    if (typeof data.quality !== 'number' || data.quality < 0 || data.quality > 5) {
      return NextResponse.json(
        { error: 'Quality must be a number between 0 and 5' },
        { status: 400 }
      );
    }

    // Verify ownership through deck
    const card = await prisma.flashcard.findFirst({
      where: { id: data.cardId },
      include: {
        deck: {
          select: { userId: true },
        },
      },
    });

    if (!card || card.deck.userId !== userId) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Calculate new spaced repetition values
    const { interval, easeFactor, repetitions } = calculateNextReview(
      data.quality,
      card.interval,
      card.easeFactor,
      card.repetitions
    );

    // Calculate next review date in user's local timezone
    // timezoneOffset is in minutes (negative for ahead of UTC, e.g., UTC-5 = 300)
    const timezoneOffset = data.timezoneOffset ?? 0;
    const now = new Date();

    // Get the user's local midnight for the target day
    // First, get current time adjusted to user's timezone
    const userLocalTime = new Date(now.getTime() - timezoneOffset * 60 * 1000);
    // Set to start of day in user's timezone, then add interval days
    userLocalTime.setUTCHours(0, 0, 0, 0);
    userLocalTime.setUTCDate(userLocalTime.getUTCDate() + interval);
    // Convert back to UTC for storage
    const nextReview = new Date(userLocalTime.getTime() + timezoneOffset * 60 * 1000);

    // Update card with new spaced repetition values
    const updatedCard = await prisma.flashcard.update({
      where: { id: data.cardId },
      data: {
        interval,
        easeFactor,
        repetitions,
        nextReview,
      },
    });

    // Award XP for the review (1 XP per card)
    const gamificationResult = await processFlashcardReview(
      userId,
      timezoneOffset,
      data.cardId
    );

    return NextResponse.json({
      card: updatedCard,
      gamification: gamificationResult,
    });
  } catch (error) {
    console.error('Error processing flashcard review:', error);
    return NextResponse.json(
      { error: 'Failed to process review' },
      { status: 500 }
    );
  }
}
