import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

// POST - Disconnect from Brightspace LMS
export const POST = withRateLimit(async function(_req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    // Clear Brightspace connection info from settings
    await prisma.settings.update({
      where: { userId: session.user.id },
      data: {
        brightspaceInstanceUrl: null,
        brightspaceClientId: null,
        brightspaceClientSecret: null,
        brightspaceAccessToken: null,
        brightspaceRefreshToken: null,
        brightspaceTokenExpiresAt: null,
        brightspaceUserId: null,
        brightspaceUserName: null,
        brightspaceSyncEnabled: false,
        brightspaceLastSyncedAt: null,
      },
    });

    // Clear deleted items tracking
    try {
      await prisma.deletedBrightspaceItem.deleteMany({
        where: { userId: session.user.id },
      });
    } catch {
      // Table may not exist yet
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully disconnected from Brightspace',
    });
  } catch (error) {
    console.error('[Brightspace Disconnect] Error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect from Brightspace. Please try again.' },
      { status: 500 }
    );
  }
});
