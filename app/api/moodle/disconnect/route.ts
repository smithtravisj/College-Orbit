import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

// POST - Disconnect from Moodle LMS
export const POST = withRateLimit(async function(_req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    // Clear Moodle connection info from settings
    await prisma.settings.update({
      where: { userId: session.user.id },
      data: {
        moodleInstanceUrl: null,
        moodleAccessToken: null,
        moodleUserId: null,
        moodleUserName: null,
        moodleSyncEnabled: false,
        moodleLastSyncedAt: null,
      },
    });

    // Clear deleted items tracking
    try {
      await prisma.deletedMoodleItem.deleteMany({
        where: { userId: session.user.id },
      });
    } catch {
      // Table may not exist yet
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully disconnected from Moodle',
    });
  } catch (error) {
    console.error('[Moodle Disconnect] Error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect from Moodle. Please try again.' },
      { status: 500 }
    );
  }
});
