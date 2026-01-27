import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

// Username validation regex: 3-20 chars, alphanumeric + underscores
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

// GET check if username is available
export const GET = withRateLimit(async function(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    // Validate format
    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json({
        available: false,
        reason: 'Username must be 3-20 characters, alphanumeric and underscores only',
      });
    }

    // Check if username exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    // Available if no user has it, or if the current user owns it
    const available = !existingUser || existingUser.id === session.user.id;

    return NextResponse.json({ available });
  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json(
      { error: 'Failed to check username' },
      { status: 500 }
    );
  }
});
