import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';

// PATCH update card content
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    // Verify ownership through deck
    const existingCard = await prisma.flashcard.findFirst({
      where: { id },
      include: {
        deck: {
          select: { userId: true },
        },
      },
    });

    if (!existingCard || existingCard.deck.userId !== userId) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const card = await prisma.flashcard.update({
      where: { id },
      data: {
        front: data.front?.trim() ?? existingCard.front,
        back: data.back?.trim() ?? existingCard.back,
      },
    });

    return NextResponse.json({ card });
  } catch (error) {
    console.error('Error updating flashcard:', error);
    return NextResponse.json(
      { error: 'Failed to update flashcard' },
      { status: 500 }
    );
  }
}

// DELETE card
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership through deck
    const existingCard = await prisma.flashcard.findFirst({
      where: { id },
      include: {
        deck: {
          select: { userId: true },
        },
      },
    });

    if (!existingCard || existingCard.deck.userId !== userId) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    await prisma.flashcard.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    return NextResponse.json(
      { error: 'Failed to delete flashcard' },
      { status: 500 }
    );
  }
}
