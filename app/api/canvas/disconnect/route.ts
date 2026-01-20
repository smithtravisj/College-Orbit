import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

// POST - Disconnect from Canvas LMS
export const POST = withRateLimit(async function(_req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    // Clear Canvas connection info from settings
    await prisma.settings.update({
      where: { userId: session.user.id },
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
