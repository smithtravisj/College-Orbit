import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';

// GET all issue reports (admin only)
export const GET = withRateLimit(async function() {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const reports = await prisma.issueReport.findMany({
      where: {
        status: 'pending',
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error fetching issue reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issue reports' },
      { status: 500 }
    );
  }
});

// PATCH update issue report status (admin only)
export const PATCH = withRateLimit(async function(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    const { id, reportId, status } = data;
    const reportIdToUpdate = id || reportId;

    if (!reportIdToUpdate || !status) {
      return NextResponse.json(
        { error: 'ID and status are required' },
        { status: 400 }
      );
    }

    // Get the issue report with user info first
    const originalReport = await prisma.issueReport.findUnique({
      where: { id: reportIdToUpdate },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!originalReport) {
      return NextResponse.json({ error: 'Issue report not found' }, { status: 404 });
    }

    const issueReport = await prisma.issueReport.update({
      where: { id: reportIdToUpdate },
      data: { status },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    // Create notification for the user who submitted the report (non-blocking)
    try {
      const statusLabel = status === 'fixed' ? 'Fixed' : status === 'rejected' ? 'Rejected' : status;
      const shortDescription = originalReport.description.length > 100
        ? originalReport.description.substring(0, 100) + '...'
        : originalReport.description;

      await prisma.notification.create({
        data: {
          userId: originalReport.user.id,
          title: `Issue Report ${statusLabel}`,
          message: `Your issue report has been marked as ${status === 'fixed' ? 'fixed' : 'rejected'}: "${shortDescription}"`,
          type: `issue_report_${status}`,
          issueReportId: issueReport.id,
        },
      });
    } catch (notificationError) {
      console.error('Failed to create notification for issue report:', notificationError);
      // Don't block the response if notification fails
    }

    return NextResponse.json({ issueReport });
  } catch (error) {
    console.error('Error updating issue report:', error);
    return NextResponse.json(
      { error: 'Failed to update issue report' },
      { status: 500 }
    );
  }
});

// DELETE issue report (admin only)
export const DELETE = withRateLimit(async function(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    const { id } = data;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.issueReport.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting issue report:', error);
    return NextResponse.json(
      { error: 'Failed to delete issue report' },
      { status: 500 }
    );
  }
});
