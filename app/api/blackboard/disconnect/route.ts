import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { withRateLimit } from '@/lib/withRateLimit';

// POST - Disconnect from Blackboard LMS
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    // Clear Blackboard connection info from settings
    await prisma.settings.update({
      where: { userId },
      data: {
        blackboardInstanceUrl: null,
        blackboardApplicationKey: null,
        blackboardApplicationSecret: null,
        blackboardAccessToken: null,
        blackboardTokenExpiresAt: null,
        blackboardUserId: null,
        blackboardUserName: null,
        blackboardSyncEnabled: false,
        blackboardLastSyncedAt: null,
      },
    });

    // Note: We intentionally keep blackboardCourseId, blackboardColumnId, etc. on existing items
    // This allows users to reconnect and continue syncing without losing the mapping

    // Optionally clear deleted items tracking (user can re-delete if needed)
    try {
      await prisma.deletedBlackboardItem.deleteMany({
        where: { userId },
      });
    } catch {
      // Table may not exist yet if migration hasn't been run
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully disconnected from Blackboard',
    });
  } catch (error) {
    console.error('[Blackboard Disconnect] Error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect from Blackboard. Please try again.' },
      { status: 500 }
    );
  }
});
