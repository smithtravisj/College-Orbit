import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { withRateLimit } from '@/lib/withRateLimit';

// GET - Get Google Calendar connection status
export const GET = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const settings = await prisma.settings.findUnique({
      where: { userId },
      select: {
        googleCalendarConnected: true,
        googleCalendarEmail: true,
        googleCalendarLastSyncedAt: true,
        googleCalendarSyncImportEvents: true,
        googleCalendarSyncExportEvents: true,
        googleCalendarSyncExportDeadlines: true,
        googleCalendarSyncExportExams: true,
        googleCalendarImportCalendarId: true,
        googleCalendarExportCalendarId: true,
      },
    });

    return NextResponse.json({
      connected: settings?.googleCalendarConnected ?? false,
      email: settings?.googleCalendarEmail ?? null,
      lastSyncedAt: settings?.googleCalendarLastSyncedAt ?? null,
      syncImportEvents: settings?.googleCalendarSyncImportEvents ?? true,
      syncExportEvents: settings?.googleCalendarSyncExportEvents ?? true,
      syncExportDeadlines: settings?.googleCalendarSyncExportDeadlines ?? true,
      syncExportExams: settings?.googleCalendarSyncExportExams ?? true,
      importCalendarId: settings?.googleCalendarImportCalendarId ?? 'primary',
      exportCalendarId: settings?.googleCalendarExportCalendarId ?? 'primary',
    });
  } catch (error) {
    console.error('[Google Calendar Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Google Calendar status' },
      { status: 500 }
    );
  }
});

// PATCH - Update Google Calendar sync settings
export const PATCH = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const body = await req.json();

    // Map of allowed fields
    const allowedFields: Record<string, string> = {
      syncImportEvents: 'googleCalendarSyncImportEvents',
      syncExportEvents: 'googleCalendarSyncExportEvents',
      syncExportDeadlines: 'googleCalendarSyncExportDeadlines',
      syncExportExams: 'googleCalendarSyncExportExams',
      importCalendarId: 'googleCalendarImportCalendarId',
      exportCalendarId: 'googleCalendarExportCalendarId',
    };

    const updateData: Record<string, boolean | string> = {};
    for (const [key, dbField] of Object.entries(allowedFields)) {
      if (key in body) {
        updateData[dbField] = body[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    await prisma.settings.update({
      where: { userId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Google Calendar Status PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update Google Calendar settings' },
      { status: 500 }
    );
  }
});
