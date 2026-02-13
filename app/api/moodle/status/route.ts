import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { withRateLimit } from '@/lib/withRateLimit';

// GET - Get Moodle connection status
export const GET = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const settings = await prisma.settings.findUnique({
      where: { userId },
      select: {
        moodleInstanceUrl: true,
        moodleUserId: true,
        moodleUserName: true,
        moodleSyncEnabled: true,
        moodleLastSyncedAt: true,
        moodleSyncCourses: true,
        moodleSyncAssignments: true,
        moodleSyncGrades: true,
        moodleSyncEvents: true,
        moodleSyncAnnouncements: true,
        moodleAutoMarkComplete: true,
      },
    });

    if (!settings?.moodleInstanceUrl || !settings?.moodleSyncEnabled) {
      return NextResponse.json({
        connected: false,
        syncEnabled: false,
        instanceUrl: null,
        userId: null,
        userName: null,
        lastSyncedAt: null,
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
      instanceUrl: settings.moodleInstanceUrl,
      userId: settings.moodleUserId,
      userName: settings.moodleUserName,
      lastSyncedAt: settings.moodleLastSyncedAt?.toISOString() || null,
      syncCourses: settings.moodleSyncCourses ?? true,
      syncAssignments: settings.moodleSyncAssignments ?? true,
      syncGrades: settings.moodleSyncGrades ?? true,
      syncEvents: settings.moodleSyncEvents ?? true,
      syncAnnouncements: settings.moodleSyncAnnouncements ?? true,
      autoMarkComplete: settings.moodleAutoMarkComplete ?? true,
    });
  } catch (error) {
    console.error('[Moodle Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get Moodle status. Please try again.' },
      { status: 500 }
    );
  }
});

// PATCH - Update Moodle sync settings
export const PATCH = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const data = await req.json();

    const updateData: Record<string, boolean> = {};

    if (data.syncCourses !== undefined) updateData.moodleSyncCourses = data.syncCourses;
    if (data.syncAssignments !== undefined) updateData.moodleSyncAssignments = data.syncAssignments;
    if (data.syncGrades !== undefined) updateData.moodleSyncGrades = data.syncGrades;
    if (data.syncEvents !== undefined) updateData.moodleSyncEvents = data.syncEvents;
    if (data.syncAnnouncements !== undefined) updateData.moodleSyncAnnouncements = data.syncAnnouncements;
    if (data.autoMarkComplete !== undefined) updateData.moodleAutoMarkComplete = data.autoMarkComplete;

    await prisma.settings.update({
      where: { userId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Sync settings updated',
    });
  } catch (error) {
    console.error('[Moodle Status PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update sync settings. Please try again.' },
      { status: 500 }
    );
  }
});
