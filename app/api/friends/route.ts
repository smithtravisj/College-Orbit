import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { sendPushNotification } from '@/lib/sendPushNotification';

// GET list user's friends with gamification stats
export const GET = withRateLimit(async function(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    // Get all friendships where user is either user1 or user2
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            name: true,
            profileImage: true,
            college: {
              select: { id: true, fullName: true, acronym: true },
            },
            streak: {
              select: { currentStreak: true, longestStreak: true, totalXp: true, level: true },
            },
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            name: true,
            profileImage: true,
            college: {
              select: { id: true, fullName: true, acronym: true },
            },
            streak: {
              select: { currentStreak: true, longestStreak: true, totalXp: true, level: true },
            },
          },
        },
      },
    });

    // Map to friend objects (the other user in each friendship)
    const friends = friendships.map(f => {
      const friend = f.user1Id === userId ? f.user2 : f.user1;
      return {
        id: friend.id,
        username: friend.username,
        name: friend.name,
        profileImage: friend.profileImage,
        college: friend.college,
        streak: {
          currentStreak: friend.streak?.currentStreak || 0,
          longestStreak: friend.streak?.longestStreak || 0,
        },
        xp: {
          total: friend.streak?.totalXp || 0,
          level: friend.streak?.level || 1,
        },
        friendshipId: f.id,
        friendsSince: f.createdAt,
      };
    });

    return NextResponse.json({ friends });
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends' },
      { status: 500 }
    );
  }
});

// POST send friend request
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const { identifier } = await req.json();
    const senderId = userId;

    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json({ error: 'Username or email required' }, { status: 400 });
    }

    const trimmedIdentifier = identifier.trim().toLowerCase();

    // Find user by username or email
    const receiver = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: trimmedIdentifier, mode: 'insensitive' } },
          { email: { equals: trimmedIdentifier, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
      },
    });

    if (!receiver) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (receiver.id === senderId) {
      return NextResponse.json({ error: 'Cannot send friend request to yourself' }, { status: 400 });
    }

    // Check if already friends
    const [user1Id, user2Id] = [senderId, receiver.id].sort();
    const existingFriendship = await prisma.friendship.findUnique({
      where: {
        user1Id_user2Id: { user1Id, user2Id },
      },
    });

    if (existingFriendship) {
      return NextResponse.json({ error: 'Already friends with this user' }, { status: 400 });
    }

    // Check for existing pending request in either direction
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId: receiver.id },
          { senderId: receiver.id, receiverId: senderId },
        ],
      },
    });

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        if (existingRequest.senderId === senderId) {
          return NextResponse.json({ error: 'Friend request already sent' }, { status: 400 });
        } else {
          return NextResponse.json({ error: 'This user has already sent you a friend request. Check your pending requests.' }, { status: 400 });
        }
      }
      // If there's an old non-pending request (accepted/declined), delete it to allow a new request
      await prisma.friendRequest.delete({
        where: { id: existingRequest.id },
      });
    }

    // Get sender name for notification
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { name: true, username: true },
    });

    const senderName = sender?.name || sender?.username || 'Someone';

    // Create friend request
    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId,
        receiverId: receiver.id,
        status: 'pending',
      },
      include: {
        receiver: {
          select: {
            id: true,
            username: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiver.id,
        title: 'New Friend Request',
        message: `${senderName} wants to be your friend`,
        type: 'friend_request',
      },
    });

    // Send push notification
    sendPushNotification(
      receiver.id,
      'New Friend Request',
      `${senderName} wants to be your friend`,
      { type: 'friend_request' }
    ).catch(() => {});

    return NextResponse.json({
      friendRequest,
      message: 'Friend request sent',
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    return NextResponse.json(
      { error: 'Failed to send friend request' },
      { status: 500 }
    );
  }
});
