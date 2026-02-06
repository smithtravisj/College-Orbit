import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';
import {
  createSpotifyClient,
  decryptToken,
  getEncryptionSecret,
  SpotifyAuthError,
} from '@/lib/spotify';

// Helper to get authenticated Spotify client
async function getSpotifyClient(userId: string) {
  const settings = await prisma.settings.findUnique({
    where: { userId },
    select: {
      spotifyConnected: true,
      spotifyAccessToken: true,
      spotifyTokenExpiresAt: true,
      spotifyProduct: true,
    },
  });

  if (!settings?.spotifyConnected || !settings.spotifyAccessToken) {
    throw new Error('Not connected to Spotify');
  }

  // Check if token is expired
  if (settings.spotifyTokenExpiresAt && new Date() >= settings.spotifyTokenExpiresAt) {
    throw new SpotifyAuthError('Token expired', 401);
  }

  const secret = getEncryptionSecret();
  const accessToken = decryptToken(settings.spotifyAccessToken, secret);

  return {
    client: createSpotifyClient(accessToken),
    isPremium: settings.spotifyProduct === 'premium',
  };
}

// GET - Get current playback state
export const GET = withRateLimit(async function(_req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const { client, isPremium } = await getSpotifyClient(session.user.id);

    const playbackState = await client.getPlaybackState();

    if (!playbackState) {
      return NextResponse.json({
        isPlaying: false,
        track: null,
        position: 0,
        duration: 0,
        isPremium,
      });
    }

    return NextResponse.json({
      isPlaying: playbackState.is_playing,
      track: playbackState.item
        ? {
            id: playbackState.item.id,
            name: playbackState.item.name,
            artists: playbackState.item.artists.map((a) => ({
              id: a.id,
              name: a.name,
            })),
            album: {
              id: playbackState.item.album.id,
              name: playbackState.item.album.name,
              images: playbackState.item.album.images,
            },
            duration: playbackState.item.duration_ms,
            uri: playbackState.item.uri,
            externalUrl: playbackState.item.external_urls.spotify,
          }
        : null,
      position: playbackState.progress_ms || 0,
      duration: playbackState.item?.duration_ms || 0,
      device: playbackState.device
        ? {
            id: playbackState.device.id,
            name: playbackState.device.name,
            type: playbackState.device.type,
            volume: playbackState.device.volume_percent,
          }
        : null,
      isPremium,
    });
  } catch (error) {
    if (error instanceof SpotifyAuthError) {
      return NextResponse.json(
        { error: 'Token expired', needsRefresh: true },
        { status: 401 }
      );
    }

    console.error('[Spotify Playback GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get playback state' },
      { status: 500 }
    );
  }
});

// POST - Control playback (requires Premium)
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const { action } = await req.json();

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const { client, isPremium } = await getSpotifyClient(session.user.id);

    // Check if user has Premium for playback control
    if (!isPremium) {
      return NextResponse.json(
        { error: 'Playback control requires Spotify Premium' },
        { status: 403 }
      );
    }

    try {
      switch (action) {
        case 'play':
          await client.play();
          break;
        case 'pause':
          await client.pause();
          break;
        case 'next':
          await client.skipToNext();
          break;
        case 'previous':
          await client.skipToPrevious();
          break;
        default:
          return NextResponse.json(
            { error: `Unknown action: ${action}` },
            { status: 400 }
          );
      }
    } catch (error) {
      // Handle specific Spotify errors
      if (error instanceof Error) {
        if (error.message.includes('No active device')) {
          return NextResponse.json(
            { error: 'No active Spotify device. Please start playing on a device first.' },
            { status: 400 }
          );
        }
        if (error.message.includes('PREMIUM_REQUIRED')) {
          return NextResponse.json(
            { error: 'This action requires Spotify Premium' },
            { status: 403 }
          );
        }
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof SpotifyAuthError) {
      return NextResponse.json(
        { error: 'Token expired', needsRefresh: true },
        { status: 401 }
      );
    }

    console.error('[Spotify Playback POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to control playback' },
      { status: 500 }
    );
  }
});
