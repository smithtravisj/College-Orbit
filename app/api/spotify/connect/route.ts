import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  getSpotifyAuthUrl,
} from '@/lib/spotify';
import { cookies } from 'next/headers';

// GET - Initiate Spotify OAuth flow
export const GET = withRateLimit(async function(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: 'Spotify integration is not configured' },
        { status: 500 }
      );
    }

    // Generate PKCE code verifier and challenge
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();

    // Get redirect URI from environment or construct from request
    const baseUrl = process.env.NEXTAUTH_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const redirectUri = `${baseUrl}/api/spotify/callback`;

    // Store code verifier and state in cookies (encrypted, short-lived)
    const cookieStore = await cookies();

    cookieStore.set('spotify_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    cookieStore.set('spotify_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    // Generate Spotify authorization URL
    const authUrl = getSpotifyAuthUrl(clientId, redirectUri, state, codeChallenge);

    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error('[Spotify Connect] Error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Spotify connection' },
      { status: 500 }
    );
  }
});
