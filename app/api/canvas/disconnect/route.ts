import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { withRateLimit } from '@/lib/withRateLimit';

// POST - Disconnect from Canvas LMS
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    // Clear Canvas connection info from settings
    await prisma.settings.update({
      where: { userId },
      data: {
        canvasInstanceUrl: null,
        canvasAccessToken: null,
        canvasUserId: null,
        canvasUserName: null,
        canvasSyncEnabled: false,
        canvasLastSyncedAt: null,
      },
    });

    // Note: We intentionally keep canvasCourseId, canvasAssignmentId, etc. on existing items
    // This allows users to reconnect and continue syncing without losing the mapping

    return NextResponse.json({
      success: true,
      message: 'Successfully disconnected from Canvas',
    });
  } catch (error) {
    console.error('[Canvas Disconnect] Error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect from Canvas. Please try again.' },
      { status: 500 }
    );
  }
});
