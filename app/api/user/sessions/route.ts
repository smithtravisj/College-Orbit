import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/prisma';

// POST /api/user/sessions - Invalidate all sessions (log out everywhere)
export async function POST() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Set sessionInvalidatedAt to now - this will invalidate all existing JWT tokens
    await prisma.user.update({
      where: { id: session.user.id },
      data: { sessionInvalidatedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: 'All sessions have been invalidated' });
  } catch (error) {
    console.error('Error invalidating sessions:', error);
    return NextResponse.json({ error: 'Failed to invalidate sessions' }, { status: 500 });
  }
}
