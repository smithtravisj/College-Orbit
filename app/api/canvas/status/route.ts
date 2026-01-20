import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

// GET - Get Canvas connection status
export const GET = withRateLimit(async function(_req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const settings = await prisma.settings.findUnique({
      where: { userId: session.user.id },
      select: {
        canvasInstanceUrl: true,
        canvasUserId: true,
        canvasUserName: true,
        canvasSyncEnabled: true,
        canvasLastSyncedAt: true,
        canvasSyncCourses: true,
        canvasSyncAssignments: true,
        canvasSyncGrades: true,
        canvasSyncEvents: true,
        canvasSyncAnnouncements: true,
        canvasAutoMarkComplete: true,
      },
    });

    if (!settings?.canvasInstanceUrl || !settings?.canvasSyncEnabled) {
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
      instanceUrl: settings.canvasInstanceUrl,
      userId: settings.canvasUserId,
      userName: settings.canvasUserName,
      lastSyncedAt: settings.canvasLastSyncedAt?.toISOString() || null,
      syncCourses: settings.canvasSyncCourses ?? true,
      syncAssignments: settings.canvasSyncAssignments ?? true,
      syncGrades: settings.canvasSyncGrades ?? true,
      syncEvents: settings.canvasSyncEvents ?? true,
      syncAnnouncements: settings.canvasSyncAnnouncements ?? true,
      autoMarkComplete: settings.canvasAutoMarkComplete ?? true,
    });
  } catch (error) {
    console.error('[Canvas Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get Canvas status. Please try again.' },
      { status: 500 }
    );
  }
});

// PATCH - Update Canvas sync settings
export const PATCH = withRateLimit(async function(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const data = await req.json();

    const updateData: any = {};

    if (data.syncCourses !== undefined) updateData.canvasSyncCourses = data.syncCourses;
    if (data.syncAssignments !== undefined) updateData.canvasSyncAssignments = data.syncAssignments;
    if (data.syncGrades !== undefined) updateData.canvasSyncGrades = data.syncGrades;
    if (data.syncEvents !== undefined) updateData.canvasSyncEvents = data.syncEvents;
    if (data.syncAnnouncements !== undefined) updateData.canvasSyncAnnouncements = data.syncAnnouncements;
    if (data.autoMarkComplete !== undefined) updateData.canvasAutoMarkComplete = data.autoMarkComplete;

    await prisma.settings.update({
      where: { userId: session.user.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Sync settings updated',
    });
  } catch (error) {
    console.error('[Canvas Status PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update sync settings. Please try again.' },
      { status: 500 }
    );
  }
});
