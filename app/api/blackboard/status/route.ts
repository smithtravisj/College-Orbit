import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

// GET - Get Blackboard connection status
export const GET = withRateLimit(async function(_req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const settings = await prisma.settings.findUnique({
      where: { userId: session.user.id },
      select: {
        blackboardInstanceUrl: true,
        blackboardUserId: true,
        blackboardUserName: true,
        blackboardSyncEnabled: true,
        blackboardLastSyncedAt: true,
        blackboardTokenExpiresAt: true,
        blackboardSyncCourses: true,
        blackboardSyncAssignments: true,
        blackboardSyncGrades: true,
        blackboardSyncEvents: true,
        blackboardAutoMarkComplete: true,
      },
    });

    if (!settings?.blackboardInstanceUrl || !settings?.blackboardSyncEnabled) {
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
        autoMarkComplete: true,
      });
    }

    return NextResponse.json({
      connected: true,
      syncEnabled: true,
      instanceUrl: settings.blackboardInstanceUrl,
      userId: settings.blackboardUserId,
      userName: settings.blackboardUserName,
      lastSyncedAt: settings.blackboardLastSyncedAt?.toISOString() || null,
      tokenExpiresAt: settings.blackboardTokenExpiresAt?.toISOString() || null,
      syncCourses: settings.blackboardSyncCourses ?? true,
      syncAssignments: settings.blackboardSyncAssignments ?? true,
      syncGrades: settings.blackboardSyncGrades ?? true,
      syncEvents: settings.blackboardSyncEvents ?? true,
      autoMarkComplete: settings.blackboardAutoMarkComplete ?? true,
    });
  } catch (error) {
    console.error('[Blackboard Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get Blackboard status. Please try again.' },
      { status: 500 }
    );
  }
});

// PATCH - Update Blackboard sync settings
export const PATCH = withRateLimit(async function(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const data = await req.json();

    const updateData: Record<string, boolean> = {};

    if (data.syncCourses !== undefined) updateData.blackboardSyncCourses = data.syncCourses;
    if (data.syncAssignments !== undefined) updateData.blackboardSyncAssignments = data.syncAssignments;
    if (data.syncGrades !== undefined) updateData.blackboardSyncGrades = data.syncGrades;
    if (data.syncEvents !== undefined) updateData.blackboardSyncEvents = data.syncEvents;
    if (data.autoMarkComplete !== undefined) updateData.blackboardAutoMarkComplete = data.autoMarkComplete;

    await prisma.settings.update({
      where: { userId: session.user.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Sync settings updated',
    });
  } catch (error) {
    console.error('[Blackboard Status PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update sync settings. Please try again.' },
      { status: 500 }
    );
  }
});
