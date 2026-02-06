import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

// GET - Get Spotify connection status
export const GET = withRateLimit(async function(_req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const settings = await prisma.settings.findUnique({
      where: { userId: session.user.id },
      select: {
        spotifyConnected: true,
        spotifyUserId: true,
        spotifyUserName: true,
        spotifyProfileImage: true,
        spotifyProduct: true,
        spotifyTokenExpiresAt: true,
        spotifyMiniPlayerSize: true,
        spotifyVisualizerEnabled: true,
      },
    });

    if (!settings?.spotifyConnected) {
      return NextResponse.json({
        connected: false,
      });
    }

    return NextResponse.json({
      connected: true,
      user: {
        id: settings.spotifyUserId,
        name: settings.spotifyUserName,
        image: settings.spotifyProfileImage,
        product: settings.spotifyProduct,
      },
      tokenExpiresAt: settings.spotifyTokenExpiresAt,
      preferences: {
        miniPlayerSize: settings.spotifyMiniPlayerSize,
        visualizerEnabled: settings.spotifyVisualizerEnabled,
      },
    });
  } catch (error) {
    console.error('[Spotify Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get Spotify status' },
      { status: 500 }
    );
  }
});

// PATCH - Update Spotify preferences
export const PATCH = withRateLimit(async function(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const body = await req.json();
    const { miniPlayerSize, visualizerEnabled } = body;

    const updateData: Record<string, unknown> = {};

    if (miniPlayerSize !== undefined) {
      if (!['big', 'medium', 'mini'].includes(miniPlayerSize)) {
        return NextResponse.json(
          { error: 'Invalid miniPlayerSize value' },
          { status: 400 }
        );
      }
      updateData.spotifyMiniPlayerSize = miniPlayerSize;
    }

    if (visualizerEnabled !== undefined) {
      updateData.spotifyVisualizerEnabled = Boolean(visualizerEnabled);
    }

    await prisma.settings.update({
      where: { userId: session.user.id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Spotify Status PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update Spotify preferences' },
      { status: 500 }
    );
  }
});
