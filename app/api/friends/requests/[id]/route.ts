import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';
import { getAuthUserId } from '@/lib/getAuthUserId';

// PATCH accept or decline friend request
export const PATCH = withRateLimit(async function(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const { id } = await params;
    const { action } = await req.json();

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Find the friend request
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id },
      include: {
        sender: {
          select: { id: true, name: true, username: true },
        },
        receiver: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    if (!friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }

    // Only the receiver can accept/decline
    if (friendRequest.receiverId !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (friendRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Request already processed' }, { status: 400 });
    }

    const receiverName = friendRequest.receiver.name || friendRequest.receiver.username || 'Someone';

    if (action === 'accept') {
      // Create friendship (ensure user1Id < user2Id for consistent ordering)
      const [user1Id, user2Id] = [friendRequest.senderId, friendRequest.receiverId].sort();

      await prisma.$transaction([
        // Update request status
        prisma.friendRequest.update({
          where: { id },
          data: { status: 'accepted' },
        }),
        // Create friendship
        prisma.friendship.create({
          data: { user1Id, user2Id },
        }),
        // Notify sender
        prisma.notification.create({
          data: {
            userId: friendRequest.senderId,
            title: 'Friend Request Accepted',
            message: `${receiverName} accepted your friend request`,
            type: 'friend_request_accepted',
          },
        }),
      ]);

      return NextResponse.json({ message: 'Friend request accepted' });
    } else {
      // Decline
      await prisma.$transaction([
        prisma.friendRequest.update({
          where: { id },
          data: { status: 'declined' },
        }),
        prisma.notification.create({
          data: {
            userId: friendRequest.senderId,
            title: 'Friend Request Declined',
            message: `${receiverName} declined your friend request`,
            type: 'friend_request_declined',
          },
        }),
      ]);

      return NextResponse.json({ message: 'Friend request declined' });
    }
  } catch (error) {
    console.error('Error processing friend request:', error);
    return NextResponse.json(
      { error: 'Failed to process friend request' },
      { status: 500 }
    );
  }
});

// DELETE cancel a sent friend request
export const DELETE = withRateLimit(async function(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const { id } = await params;

    // Find the friend request
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id },
    });

    if (!friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }

    // Only the sender can cancel
    if (friendRequest.senderId !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (friendRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Request already processed' }, { status: 400 });
    }

    await prisma.friendRequest.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Friend request cancelled' });
  } catch (error) {
    console.error('Error cancelling friend request:', error);
    return NextResponse.json(
      { error: 'Failed to cancel friend request' },
      { status: 500 }
    );
  }
});
