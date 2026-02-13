import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { withRateLimit } from '@/lib/withRateLimit';

// POST - Disconnect from Spotify
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    // Clear Spotify connection info
    await prisma.settings.update({
      where: { userId },
      data: {
        spotifyAccessToken: null,
        spotifyRefreshToken: null,
        spotifyTokenExpiresAt: null,
        spotifyUserId: null,
        spotifyUserName: null,
        spotifyProfileImage: null,
        spotifyProduct: null,
        spotifyConnected: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully disconnected from Spotify',
    });
  } catch (error) {
    console.error('[Spotify Disconnect] Error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect from Spotify' },
      { status: 500 }
    );
  }
});
