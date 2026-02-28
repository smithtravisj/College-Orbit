import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { withRateLimit } from '@/lib/withRateLimit';
import {
  createSpotifyClient,
  decryptToken,
  encryptToken,
  getEncryptionSecret,
  refreshAccessToken,
  SpotifyAuthError,
} from '@/lib/spotify';

// Helper to get authenticated Spotify client (with proactive token refresh)
async function getSpotifyClient(userId: string) {
  const settings = await prisma.settings.findUnique({
    where: { userId },
    select: {
      spotifyConnected: true,
      spotifyAccessToken: true,
      spotifyRefreshToken: true,
      spotifyTokenExpiresAt: true,
      spotifyProduct: true,
    },
  });

  if (!settings?.spotifyConnected || !settings.spotifyAccessToken) {
    throw new Error('Not connected to Spotify');
  }

  const secret = getEncryptionSecret();
  const now = new Date();
  const expiresAt = settings.spotifyTokenExpiresAt ? new Date(settings.spotifyTokenExpiresAt) : null;
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  // Proactively refresh if token expires within 5 minutes
  if (expiresAt && fiveMinutesFromNow >= expiresAt && settings.spotifyRefreshToken) {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    if (clientId) {
      try {
        const refreshToken = decryptToken(settings.spotifyRefreshToken, secret);
        const tokens = await refreshAccessToken(refreshToken, clientId);

        const encryptedAccessToken = encryptToken(tokens.access_token, secret);
        const encryptedRefreshToken = tokens.refresh_token
          ? encryptToken(tokens.refresh_token, secret)
          : settings.spotifyRefreshToken;
        const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

        await prisma.settings.update({
          where: { userId },
          data: {
            spotifyAccessToken: encryptedAccessToken,
            spotifyRefreshToken: encryptedRefreshToken,
            spotifyTokenExpiresAt: newExpiresAt,
          },
        });

        return {
          client: createSpotifyClient(tokens.access_token),
          isPremium: settings.spotifyProduct === 'premium',
        };
      } catch {
        // If proactive refresh fails but token isn't expired yet, continue with current token
        if (expiresAt && now < expiresAt) {
          const accessToken = decryptToken(settings.spotifyAccessToken, secret);
          return {
            client: createSpotifyClient(accessToken),
            isPremium: settings.spotifyProduct === 'premium',
          };
        }
        throw new SpotifyAuthError('Token expired and refresh failed', 401);
      }
    }
  }

  // Check if token is already expired (no refresh possible or not near expiry)
  if (expiresAt && now >= expiresAt) {
    throw new SpotifyAuthError('Token expired', 401);
  }

  const accessToken = decryptToken(settings.spotifyAccessToken, secret);

  return {
    client: createSpotifyClient(accessToken),
    isPremium: settings.spotifyProduct === 'premium',
  };
}

// GET - Get current playback state
export const GET = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const { client, isPremium } = await getSpotifyClient(userId);

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
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const { action } = await req.json();

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const { client, isPremium } = await getSpotifyClient(userId);

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
