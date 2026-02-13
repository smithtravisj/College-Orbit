import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if requester is admin
    const requester = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (!requester?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: {
        id: true,
        email: true,
        name: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ admins });
  } catch (error) {
    console.error('Error listing admins:', error);
    return NextResponse.json(
      { error: 'Failed to list admins' },
      { status: 500 }
    );
  }
}
