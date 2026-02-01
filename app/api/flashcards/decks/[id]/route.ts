import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';

// GET single deck with all cards
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const deck = await prisma.flashcardDeck.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        course: {
          select: { id: true, name: true, code: true },
        },
        cards: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    const now = new Date();
    return NextResponse.json({
      deck: {
        ...deck,
        cardCount: deck.cards.length,
        dueCount: deck.cards.filter(card => new Date(card.nextReview) <= now).length,
      }
    });
  } catch (error) {
    console.error('Error fetching flashcard deck:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flashcard deck' },
      { status: 500 }
    );
  }
}

// PATCH update deck
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    // Verify ownership
    const existingDeck = await prisma.flashcardDeck.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingDeck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    const deck = await prisma.flashcardDeck.update({
      where: { id },
      data: {
        name: data.name?.trim() ?? existingDeck.name,
        description: data.description !== undefined ? (data.description?.trim() || null) : existingDeck.description,
        courseId: data.courseId !== undefined ? (data.courseId || null) : existingDeck.courseId,
      },
      include: {
        course: {
          select: { id: true, name: true, code: true },
        },
        cards: {
          select: { id: true, nextReview: true },
        },
      },
    });

    const now = new Date();
    return NextResponse.json({
      deck: {
        id: deck.id,
        name: deck.name,
        description: deck.description,
        courseId: deck.courseId,
        course: deck.course,
        cardCount: deck.cards.length,
        dueCount: deck.cards.filter(card => new Date(card.nextReview) <= now).length,
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt,
      }
    });
  } catch (error) {
    console.error('Error updating flashcard deck:', error);
    return NextResponse.json(
      { error: 'Failed to update flashcard deck' },
      { status: 500 }
    );
  }
}

// DELETE deck and all cards
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existingDeck = await prisma.flashcardDeck.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingDeck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    // Delete deck (cards will be cascade deleted)
    await prisma.flashcardDeck.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting flashcard deck:', error);
    return NextResponse.json(
      { error: 'Failed to delete flashcard deck' },
      { status: 500 }
    );
  }
}
