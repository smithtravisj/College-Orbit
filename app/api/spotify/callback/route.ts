import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import {
  exchangeCodeForTokens,
  createSpotifyClient,
  encryptToken,
  getEncryptionSecret,
} from '@/lib/spotify';
import { cookies } from 'next/headers';

// GET - Handle Spotify OAuth callback
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      // Redirect to login with error
      return NextResponse.redirect(new URL('/login?error=session_expired', req.url));
    }

    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle Spotify authorization errors
    if (error) {
      console.error('[Spotify Callback] Authorization error:', error);
      return NextResponse.redirect(
        new URL(`/settings?tab=integrations&spotify_error=${encodeURIComponent(error)}`, req.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings?tab=integrations&spotify_error=missing_params', req.url)
      );
    }

    // Verify state and get code verifier from cookies
    const cookieStore = await cookies();
    const storedState = cookieStore.get('spotify_state')?.value;
    const codeVerifier = cookieStore.get('spotify_code_verifier')?.value;

    if (!storedState || state !== storedState) {
      return NextResponse.redirect(
        new URL('/settings?tab=integrations&spotify_error=state_mismatch', req.url)
      );
    }

    if (!codeVerifier) {
      return NextResponse.redirect(
        new URL('/settings?tab=integrations&spotify_error=missing_verifier', req.url)
      );
    }

    // Clear the cookies
    cookieStore.delete('spotify_state');
    cookieStore.delete('spotify_code_verifier');

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    if (!clientId) {
      return NextResponse.redirect(
        new URL('/settings?tab=integrations&spotify_error=not_configured', req.url)
      );
    }

    // Get redirect URI
    const baseUrl = process.env.NEXTAUTH_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const redirectUri = `${baseUrl}/api/spotify/callback`;

    // Exchange code for tokens
    let tokens;
    try {
      tokens = await exchangeCodeForTokens(code, clientId, redirectUri, codeVerifier);
    } catch (error) {
      console.error('[Spotify Callback] Token exchange failed:', error);
      return NextResponse.redirect(
        new URL('/settings?tab=integrations&spotify_error=token_exchange_failed', req.url)
      );
    }

    // Get user profile to verify connection and get product tier
    const client = createSpotifyClient(tokens.access_token);
    let spotifyUser;
    try {
      spotifyUser = await client.testConnection();
    } catch (error) {
      console.error('[Spotify Callback] Failed to fetch user:', error);
      return NextResponse.redirect(
        new URL('/settings?tab=integrations&spotify_error=user_fetch_failed', req.url)
      );
    }

    // Encrypt tokens before storing
    const secret = getEncryptionSecret();
    const encryptedAccessToken = encryptToken(tokens.access_token, secret);
    const encryptedRefreshToken = tokens.refresh_token
      ? encryptToken(tokens.refresh_token, secret)
      : null;

    // Calculate token expiration time
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Update settings with Spotify connection info
    await prisma.settings.upsert({
      where: { userId: session.user.id },
      update: {
        spotifyAccessToken: encryptedAccessToken,
        spotifyRefreshToken: encryptedRefreshToken,
        spotifyTokenExpiresAt: expiresAt,
        spotifyUserId: spotifyUser.id,
        spotifyUserName: spotifyUser.display_name,
        spotifyProfileImage: spotifyUser.images?.[0]?.url || null,
        spotifyProduct: spotifyUser.product,
        spotifyConnected: true,
      },
      create: {
        userId: session.user.id,
        spotifyAccessToken: encryptedAccessToken,
        spotifyRefreshToken: encryptedRefreshToken,
        spotifyTokenExpiresAt: expiresAt,
        spotifyUserId: spotifyUser.id,
        spotifyUserName: spotifyUser.display_name,
        spotifyProfileImage: spotifyUser.images?.[0]?.url || null,
        spotifyProduct: spotifyUser.product,
        spotifyConnected: true,
      },
    });

    // Redirect back to settings with success
    return NextResponse.redirect(
      new URL('/admin?tab=integrations&spotify_connected=true', req.url)
    );
  } catch (error) {
    console.error('[Spotify Callback] Error:', error);
    return NextResponse.redirect(
      new URL('/admin?tab=integrations&spotify_error=unknown', req.url)
    );
  }
}
