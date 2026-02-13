import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { withRateLimit } from '@/lib/withRateLimit';

// POST - Disconnect from Brightspace LMS
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    // Clear Brightspace connection info from settings
    await prisma.settings.update({
      where: { userId },
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
        where: { userId },
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
