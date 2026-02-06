import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

// POST - Disconnect from Spotify
export const POST = withRateLimit(async function(_req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    // Clear Spotify connection info
    await prisma.settings.update({
      where: { userId: session.user.id },
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
