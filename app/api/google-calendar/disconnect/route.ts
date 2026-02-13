import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { withRateLimit } from '@/lib/withRateLimit';
import { decryptToken, getEncryptionSecret } from '@/lib/google-calendar';

// POST - Disconnect from Google Calendar
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    // Get current tokens to revoke
    const settings = await prisma.settings.findUnique({
      where: { userId },
      select: { googleCalendarAccessToken: true },
    });

    // Try to revoke the token at Google
    if (settings?.googleCalendarAccessToken) {
      try {
        const secret = getEncryptionSecret();
        const accessToken = decryptToken(settings.googleCalendarAccessToken, secret);
        await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
      } catch {
        // Revocation failure is non-critical
      }
    }

    // Clear Google Calendar connection info
    await prisma.settings.update({
      where: { userId },
      data: {
        googleCalendarAccessToken: null,
        googleCalendarRefreshToken: null,
        googleCalendarTokenExpiresAt: null,
        googleCalendarEmail: null,
        googleCalendarConnected: false,
        googleCalendarLastSyncedAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully disconnected from Google Calendar',
    });
  } catch (error) {
    console.error('[Google Calendar Disconnect] Error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect from Google Calendar' },
      { status: 500 }
    );
  }
});
