import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';

// POST create new card(s) in a deck
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    if (!data.deckId) {
      return NextResponse.json(
        { error: 'Deck ID is required' },
        { status: 400 }
      );
    }

    // Verify deck ownership
    const deck = await prisma.flashcardDeck.findFirst({
      where: {
        id: data.deckId,
        userId: session.user.id,
      },
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    // Handle bulk import (array of cards) or single card
    if (Array.isArray(data.cards)) {
      // Bulk import
      const cardsToCreate = data.cards
        .filter((card: { front: string; back: string }) =>
          card.front?.trim() && card.back?.trim()
        )
        .map((card: { front: string; back: string; interval?: number; easeFactor?: number; repetitions?: number; nextReview?: string }) => ({
          deckId: data.deckId,
          front: card.front.trim(),
          back: card.back.trim(),
          // Preserve spaced repetition data if provided (for import)
          ...(card.interval !== undefined && { interval: card.interval }),
          ...(card.easeFactor !== undefined && { easeFactor: card.easeFactor }),
          ...(card.repetitions !== undefined && { repetitions: card.repetitions }),
          ...(card.nextReview && { nextReview: new Date(card.nextReview) }),
        }));

      if (cardsToCreate.length === 0) {
        return NextResponse.json(
          { error: 'No valid cards to import' },
          { status: 400 }
        );
      }

      await prisma.flashcard.createMany({
        data: cardsToCreate,
      });

      // Fetch the created cards
      const cards = await prisma.flashcard.findMany({
        where: { deckId: data.deckId },
        orderBy: { createdAt: 'desc' },
        take: cardsToCreate.length,
      });

      return NextResponse.json({ cards, count: cardsToCreate.length }, { status: 201 });
    } else {
      // Single card
      if (!data.front?.trim() || !data.back?.trim()) {
        return NextResponse.json(
          { error: 'Both front and back are required' },
          { status: 400 }
        );
      }

      const card = await prisma.flashcard.create({
        data: {
          deckId: data.deckId,
          front: data.front.trim(),
          back: data.back.trim(),
          // Preserve spaced repetition data if provided (for import)
          ...(data.interval !== undefined && { interval: data.interval }),
          ...(data.easeFactor !== undefined && { easeFactor: data.easeFactor }),
          ...(data.repetitions !== undefined && { repetitions: data.repetitions }),
          ...(data.nextReview && { nextReview: new Date(data.nextReview) }),
        },
      });

      return NextResponse.json({ card }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating flashcard:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create flashcard', details: errorMessage },
      { status: 500 }
    );
  }
}
