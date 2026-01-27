import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

// GET pending friend requests (sent and received)
export const GET = withRateLimit(async function(_request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get sent requests
    const sent = await prisma.friendRequest.findMany({
      where: {
        senderId: userId,
        status: 'pending',
      },
      include: {
        receiver: {
          select: {
            id: true,
            username: true,
            name: true,
            profileImage: true,
            college: {
              select: { id: true, fullName: true, acronym: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get received requests
    const received = await prisma.friendRequest.findMany({
      where: {
        receiverId: userId,
        status: 'pending',
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            profileImage: true,
            college: {
              select: { id: true, fullName: true, acronym: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      sent: sent.map(r => ({
        id: r.id,
        senderId: r.senderId,
        receiverId: r.receiverId,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        receiver: r.receiver,
      })),
      received: received.map(r => ({
        id: r.id,
        senderId: r.senderId,
        receiverId: r.receiverId,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        sender: r.sender,
      })),
    });
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friend requests' },
      { status: 500 }
    );
  }
});
