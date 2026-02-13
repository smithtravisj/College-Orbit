import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { withRateLimit } from '@/lib/withRateLimit';

// GET - Get Brightspace connection status
export const GET = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const settings = await prisma.settings.findUnique({
      where: { userId },
      select: {
        brightspaceInstanceUrl: true,
        brightspaceUserId: true,
        brightspaceUserName: true,
        brightspaceSyncEnabled: true,
        brightspaceLastSyncedAt: true,
        brightspaceTokenExpiresAt: true,
        brightspaceSyncCourses: true,
        brightspaceSyncAssignments: true,
        brightspaceSyncGrades: true,
        brightspaceSyncEvents: true,
        brightspaceSyncAnnouncements: true,
        brightspaceAutoMarkComplete: true,
      },
    });

    if (!settings?.brightspaceInstanceUrl || !settings?.brightspaceSyncEnabled) {
      return NextResponse.json({
        connected: false,
        syncEnabled: false,
        instanceUrl: null,
        userId: null,
        userName: null,
        lastSyncedAt: null,
        tokenExpiresAt: null,
        syncCourses: true,
        syncAssignments: true,
        syncGrades: true,
        syncEvents: true,
        syncAnnouncements: true,
        autoMarkComplete: true,
      });
    }

    return NextResponse.json({
      connected: true,
      syncEnabled: true,
      instanceUrl: settings.brightspaceInstanceUrl,
      userId: settings.brightspaceUserId,
      userName: settings.brightspaceUserName,
      lastSyncedAt: settings.brightspaceLastSyncedAt?.toISOString() || null,
      tokenExpiresAt: settings.brightspaceTokenExpiresAt?.toISOString() || null,
      syncCourses: settings.brightspaceSyncCourses ?? true,
      syncAssignments: settings.brightspaceSyncAssignments ?? true,
      syncGrades: settings.brightspaceSyncGrades ?? true,
      syncEvents: settings.brightspaceSyncEvents ?? true,
      syncAnnouncements: settings.brightspaceSyncAnnouncements ?? true,
      autoMarkComplete: settings.brightspaceAutoMarkComplete ?? true,
    });
  } catch (error) {
    console.error('[Brightspace Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get Brightspace status. Please try again.' },
      { status: 500 }
    );
  }
});

// PATCH - Update Brightspace sync settings
export const PATCH = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const data = await req.json();

    const updateData: Record<string, boolean> = {};

    if (data.syncCourses !== undefined) updateData.brightspaceSyncCourses = data.syncCourses;
    if (data.syncAssignments !== undefined) updateData.brightspaceSyncAssignments = data.syncAssignments;
    if (data.syncGrades !== undefined) updateData.brightspaceSyncGrades = data.syncGrades;
    if (data.syncEvents !== undefined) updateData.brightspaceSyncEvents = data.syncEvents;
    if (data.syncAnnouncements !== undefined) updateData.brightspaceSyncAnnouncements = data.syncAnnouncements;
    if (data.autoMarkComplete !== undefined) updateData.brightspaceAutoMarkComplete = data.autoMarkComplete;

    await prisma.settings.update({
      where: { userId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Sync settings updated',
    });
  } catch (error) {
    console.error('[Brightspace Status PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update sync settings. Please try again.' },
      { status: 500 }
    );
  }
});
