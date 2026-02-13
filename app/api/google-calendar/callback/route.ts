import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';
import {
  exchangeCodeForTokens,
  createGoogleCalendarClient,
  encryptToken,
  getEncryptionSecret,
} from '@/lib/google-calendar';
import { cookies } from 'next/headers';

// GET - Handle Google Calendar OAuth callback
export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.redirect(new URL('/login?error=session_expired', req.url));
    }

    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle Google authorization errors
    if (error) {
      console.error('[Google Calendar Callback] Authorization error:', error);
      return NextResponse.redirect(
        new URL(`/settings?tab=integrations&google_calendar_error=${encodeURIComponent(error)}`, req.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings?tab=integrations&google_calendar_error=missing_params', req.url)
      );
    }

    // Verify state and get code verifier from cookies
    const cookieStore = await cookies();
    const storedState = cookieStore.get('google_cal_state')?.value;
    const codeVerifier = cookieStore.get('google_cal_code_verifier')?.value;

    if (!storedState || state !== storedState) {
      return NextResponse.redirect(
        new URL('/settings?tab=integrations&google_calendar_error=state_mismatch', req.url)
      );
    }

    if (!codeVerifier) {
      return NextResponse.redirect(
        new URL('/settings?tab=integrations&google_calendar_error=missing_verifier', req.url)
      );
    }

    // Clear the cookies
    cookieStore.delete('google_cal_state');
    cookieStore.delete('google_cal_code_verifier');

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/settings?tab=integrations&google_calendar_error=not_configured', req.url)
      );
    }

    // Get redirect URI
    const baseUrl = process.env.NEXTAUTH_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const redirectUri = `${baseUrl}/api/google-calendar/callback`;

    // Exchange code for tokens
    let tokens;
    try {
      tokens = await exchangeCodeForTokens(code, clientId, clientSecret, redirectUri, codeVerifier);
    } catch (error) {
      console.error('[Google Calendar Callback] Token exchange failed:', error);
      return NextResponse.redirect(
        new URL('/settings?tab=integrations&google_calendar_error=token_exchange_failed', req.url)
      );
    }

    // Get user email to verify connection
    const client = createGoogleCalendarClient(tokens.access_token);
    let userInfo;
    try {
      userInfo = await client.getUserInfo();
    } catch (error) {
      console.error('[Google Calendar Callback] Failed to fetch user info:', error);
      return NextResponse.redirect(
        new URL('/settings?tab=integrations&google_calendar_error=user_fetch_failed', req.url)
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

    // Update settings with Google Calendar connection info
    await prisma.settings.upsert({
      where: { userId: userId },
      update: {
        googleCalendarAccessToken: encryptedAccessToken,
        googleCalendarRefreshToken: encryptedRefreshToken,
        googleCalendarTokenExpiresAt: expiresAt,
        googleCalendarEmail: userInfo.email,
        googleCalendarConnected: true,
      },
      create: {
        userId: userId,
        googleCalendarAccessToken: encryptedAccessToken,
        googleCalendarRefreshToken: encryptedRefreshToken,
        googleCalendarTokenExpiresAt: expiresAt,
        googleCalendarEmail: userInfo.email,
        googleCalendarConnected: true,
      },
    });

    // Redirect back to settings with success
    return NextResponse.redirect(
      new URL('/settings?tab=integrations&google_calendar_connected=true', req.url)
    );
  } catch (error) {
    console.error('[Google Calendar Callback] Error:', error);
    return NextResponse.redirect(
      new URL('/settings?tab=integrations&google_calendar_error=unknown', req.url)
    );
  }
}
