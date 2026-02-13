import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';
import { getAuthUserId } from '@/lib/getAuthUserId';

// DELETE remove a friend (unfriend)
export const DELETE = withRateLimit(async function(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const { id: friendId } = await params;

    // Find the friendship
    const [user1Id, user2Id] = [userId, friendId].sort();
    const friendship = await prisma.friendship.findUnique({
      where: {
        user1Id_user2Id: { user1Id, user2Id },
      },
    });

    if (!friendship) {
      return NextResponse.json({ error: 'Friendship not found' }, { status: 404 });
    }

    // Delete the friendship and any associated friend requests
    await prisma.$transaction([
      // Delete the friendship
      prisma.friendship.delete({
        where: { id: friendship.id },
      }),
      // Delete any friend requests between the two users (in either direction)
      prisma.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId: userId, receiverId: friendId },
            { senderId: friendId, receiverId: userId },
          ],
        },
      }),
    ]);

    return NextResponse.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('Error removing friend:', error);
    return NextResponse.json(
      { error: 'Failed to remove friend' },
      { status: 500 }
    );
  }
});
