import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { withRateLimit } from '@/lib/withRateLimit';
import {
  getValidAccessToken,
  GoogleCalendarAuthError,
} from '@/lib/google-calendar';

// POST - Manually refresh Google Calendar token
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const settings = await prisma.settings.findUnique({
      where: { userId },
      select: {
        googleCalendarConnected: true,
        googleCalendarAccessToken: true,
        googleCalendarRefreshToken: true,
        googleCalendarTokenExpiresAt: true,
      },
    });

    if (!settings?.googleCalendarConnected) {
      return NextResponse.json(
        { error: 'Google Calendar is not connected' },
        { status: 400 }
      );
    }

    // getValidAccessToken will auto-refresh if needed
    await getValidAccessToken(settings, userId);

    return NextResponse.json({ success: true, message: 'Token refreshed' });
  } catch (error) {
    console.error('[Google Calendar Refresh] Error:', error);

    if (error instanceof GoogleCalendarAuthError) {
      return NextResponse.json(
        { error: 'Failed to refresh token. Please reconnect Google Calendar.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
});
