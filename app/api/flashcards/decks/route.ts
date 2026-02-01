import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { checkPremiumAccess } from '@/lib/subscription';

// GET all flashcard decks for authenticated user
export const GET = withRateLimit(async function(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const decks = await prisma.flashcardDeck.findMany({
      where: { userId },
      include: {
        course: {
          select: { id: true, name: true, code: true },
        },
        cards: {
          select: { id: true, nextReview: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Transform to include card count and due count
    const now = new Date();
    const decksWithCounts = decks.map(deck => ({
      id: deck.id,
      name: deck.name,
      description: deck.description,
      courseId: deck.courseId,
      course: deck.course,
      cardCount: deck.cards.length,
      dueCount: deck.cards.filter(card => new Date(card.nextReview) <= now).length,
      createdAt: deck.createdAt,
      updatedAt: deck.updatedAt,
    }));

    return NextResponse.json({ decks: decksWithCounts });
  } catch (error) {
    console.error('Error fetching flashcard decks:', error);
    return NextResponse.json(
      { error: 'We couldn\'t load your flashcard decks. Please check your connection and try again.' },
      { status: 500 }
    );
  }
});

// POST create new flashcard deck
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    // Check premium access for flashcards feature
    const accessCheck = await checkPremiumAccess(userId);
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { error: 'premium_required', message: accessCheck.message },
        { status: 403 }
      );
    }

    const data = await req.json();

    if (!data.name || data.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Deck name is required' },
        { status: 400 }
      );
    }

    const deck = await prisma.flashcardDeck.create({
      data: {
        userId,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        courseId: data.courseId || null,
      },
      include: {
        course: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return NextResponse.json({
      deck: {
        ...deck,
        cardCount: 0,
        dueCount: 0,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating flashcard deck:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create flashcard deck', details: errorMessage },
      { status: 500 }
    );
  }
});
