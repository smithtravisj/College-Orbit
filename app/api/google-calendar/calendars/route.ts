import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';
import {
  createGoogleCalendarClient,
  getValidAccessToken,
  GoogleCalendarAuthError,
} from '@/lib/google-calendar';

// GET - List user's Google Calendars
export const GET = withRateLimit(async function(_req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const settings = await prisma.settings.findUnique({
      where: { userId: session.user.id },
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

    const accessToken = await getValidAccessToken(settings, session.user.id);
    const client = createGoogleCalendarClient(accessToken);
    const calendarList = await client.listCalendars();

    // Return simplified calendar list
    const calendars = calendarList.items.map(cal => ({
      id: cal.id,
      summary: cal.summary,
      primary: cal.primary ?? false,
      backgroundColor: cal.backgroundColor,
    }));

    return NextResponse.json({ calendars });
  } catch (error) {
    console.error('[Google Calendar Calendars] Error:', error);

    if (error instanceof GoogleCalendarAuthError) {
      return NextResponse.json(
        { error: 'Google Calendar authentication failed. Please reconnect.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch calendars' },
      { status: 500 }
    );
  }
});
