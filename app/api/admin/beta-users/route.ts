import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';

// GET all beta users (admin only)
export const GET = withRateLimit(async function() {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find all users with isBetaUser = true in their settings
    const betaSettings = await prisma.settings.findMany({
      where: { isBetaUser: true },
      select: {
        userId: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        },
      },
    });

    const betaUsers = betaSettings.map((setting) => ({
      id: setting.user.id,
      email: setting.user.email,
      name: setting.user.name,
      createdAt: setting.user.createdAt,
      betaJoinedAt: setting.updatedAt, // Approximate - when settings were last updated
    }));

    return NextResponse.json({
      betaUsers,
      count: betaUsers.length,
    });
  } catch (error) {
    console.error('Error fetching beta users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch beta users' },
      { status: 500 }
    );
  }
});
