import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  getGoogleAuthUrl,
} from '@/lib/google-calendar';
import { cookies } from 'next/headers';

// GET - Initiate Google Calendar OAuth flow
export const GET = withRateLimit(async function(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: 'Google Calendar integration is not configured' },
        { status: 500 }
      );
    }

    // Generate PKCE code verifier and challenge
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();

    // Get redirect URI from environment or construct from request
    const baseUrl = process.env.NEXTAUTH_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const redirectUri = `${baseUrl}/api/google-calendar/callback`;

    // Store code verifier and state in cookies
    const cookieStore = await cookies();

    cookieStore.set('google_cal_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    cookieStore.set('google_cal_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    // Generate Google authorization URL
    const authUrl = getGoogleAuthUrl(clientId, redirectUri, state, codeChallenge);

    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error('[Google Calendar Connect] Error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google Calendar connection' },
      { status: 500 }
    );
  }
});
