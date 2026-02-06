import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
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
      newInterval = 5; // First time + too easy: 5 days
    } else if (repetitions === 1) {
      newInterval = 10; // Second time + too easy: 10 days
    } else {
      // Already reviewed multiple times: big jump
      newInterval = Math.round(currentInterval * newEaseFactor * 1.5);
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
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
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

    if (!card || card.deck.userId !== session.user.id) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Calculate new spaced repetition values
    const { interval, easeFactor, repetitions } = calculateNextReview(
      data.quality,
      card.interval,
      card.easeFactor,
      card.repetitions
    );

    // Calculate next review date
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

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
    const timezoneOffset = data.timezoneOffset ?? 0;
    const gamificationResult = await processFlashcardReview(
      session.user.id,
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
