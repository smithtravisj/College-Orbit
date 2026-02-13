import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { withRateLimit } from '@/lib/withRateLimit';
import {
  refreshAccessToken,
  encryptToken,
  decryptToken,
  getEncryptionSecret,
} from '@/lib/spotify';

// POST - Refresh Spotify access token
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const settings = await prisma.settings.findUnique({
      where: { userId },
      select: {
        spotifyConnected: true,
        spotifyRefreshToken: true,
        spotifyTokenExpiresAt: true,
      },
    });

    if (!settings?.spotifyConnected || !settings.spotifyRefreshToken) {
      return NextResponse.json(
        { error: 'Not connected to Spotify' },
        { status: 400 }
      );
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: 'Spotify integration is not configured' },
        { status: 500 }
      );
    }

    // Decrypt refresh token
    const secret = getEncryptionSecret();
    const refreshToken = decryptToken(settings.spotifyRefreshToken, secret);

    // Refresh the access token
    let tokens;
    try {
      tokens = await refreshAccessToken(refreshToken, clientId);
    } catch (error) {
      console.error('[Spotify Refresh] Token refresh failed:', error);
      // If refresh fails, the connection may be invalid
      await prisma.settings.update({
        where: { userId },
        data: {
          spotifyConnected: false,
        },
      });
      return NextResponse.json(
        { error: 'Token refresh failed. Please reconnect to Spotify.' },
        { status: 401 }
      );
    }

    // Encrypt new tokens
    const encryptedAccessToken = encryptToken(tokens.access_token, secret);
    const encryptedRefreshToken = tokens.refresh_token
      ? encryptToken(tokens.refresh_token, secret)
      : settings.spotifyRefreshToken; // Keep old refresh token if not provided

    // Calculate new expiration time
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Update stored tokens
    await prisma.settings.update({
      where: { userId },
      data: {
        spotifyAccessToken: encryptedAccessToken,
        spotifyRefreshToken: encryptedRefreshToken,
        spotifyTokenExpiresAt: expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('[Spotify Refresh] Error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh Spotify token' },
      { status: 500 }
    );
  }
});
