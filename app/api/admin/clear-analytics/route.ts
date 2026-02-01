import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';
import { logAuditEvent } from '@/lib/auditLog';

// DELETE all analytics events (admin only)
export const DELETE = withRateLimit(async function() {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get count before deletion for logging
    const countBefore = await prisma.analyticsEvent.count();

    // Delete all analytics events
    const result = await prisma.analyticsEvent.deleteMany({});

    // Log the admin action
    await logAuditEvent({
      adminId: session.user.id,
      adminEmail: session.user.email || 'unknown',
      action: 'clear_analytics',
      details: {
        deletedCount: result.count,
        countBefore,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Cleared ${result.count} analytics events`,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error('Error clearing analytics:', error);
    return NextResponse.json(
      { error: 'Failed to clear analytics' },
      { status: 500 }
    );
  }
});

// GET analytics count (admin only) - useful for preview before clearing
export const GET = withRateLimit(async function() {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const count = await prisma.analyticsEvent.count();

    // Get date range of events
    const [oldest, newest] = await Promise.all([
      prisma.analyticsEvent.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
      prisma.analyticsEvent.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
    ]);

    return NextResponse.json({
      count,
      oldestEvent: oldest?.createdAt || null,
      newestEvent: newest?.createdAt || null,
    });
  } catch (error) {
    console.error('Error getting analytics count:', error);
    return NextResponse.json(
      { error: 'Failed to get analytics count' },
      { status: 500 }
    );
  }
});
