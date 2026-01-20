import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

// GET /api/calendar/token - Get or create calendar subscription token
export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { calendarToken: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If no token exists, generate one
    if (!user.calendarToken) {
      const newToken = randomUUID() + randomUUID().replace(/-/g, '');
      await prisma.user.update({
        where: { id: session.user.id },
        data: { calendarToken: newToken },
      });
      return NextResponse.json({ token: newToken });
    }

    return NextResponse.json({ token: user.calendarToken });
  } catch (error) {
    console.error('Error getting calendar token:', error);
    return NextResponse.json({ error: 'Failed to get calendar token' }, { status: 500 });
  }
}

// POST /api/calendar/token - Regenerate calendar subscription token
export async function POST() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate new token
    const newToken = randomUUID() + randomUUID().replace(/-/g, '');

    await prisma.user.update({
      where: { id: session.user.id },
      data: { calendarToken: newToken },
    });

    return NextResponse.json({ token: newToken, message: 'Calendar token regenerated. Previous subscription URLs will no longer work.' });
  } catch (error) {
    console.error('Error regenerating calendar token:', error);
    return NextResponse.json({ error: 'Failed to regenerate calendar token' }, { status: 500 });
  }
}
