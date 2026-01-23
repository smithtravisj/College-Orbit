import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';
import { logAuditEvent } from '@/lib/auditLog';

// GET all beta feedback (admin only)
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

    const feedback = await prisma.betaFeedback.findMany({
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

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error fetching beta feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch beta feedback' },
      { status: 500 }
    );
  }
});

// PATCH update beta feedback status/response (admin only)
export const PATCH = withRateLimit(async function(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, email: true },
    });

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    const { id, status, adminResponse } = data;

    if (!id) {
      return NextResponse.json(
        { error: 'Feedback ID is required' },
        { status: 400 }
      );
    }

    // Get the original feedback
    const originalFeedback = await prisma.betaFeedback.findUnique({
      where: { id },
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

    if (!originalFeedback) {
      return NextResponse.json({ error: 'Beta feedback not found' }, { status: 404 });
    }

    // Build update data
    const updateData: {
      status?: string;
      adminResponse?: string;
      respondedAt?: Date;
    } = {};

    if (status) {
      updateData.status = status;
    }

    if (adminResponse !== undefined) {
      updateData.adminResponse = adminResponse;
      updateData.respondedAt = new Date();
    }

    const updatedFeedback = await prisma.betaFeedback.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    // Create notification for the user if admin responded
    if (adminResponse) {
      const responsePreview = adminResponse.length > 100
        ? adminResponse.substring(0, 100) + '...'
        : adminResponse;

      await prisma.notification.create({
        data: {
          userId: originalFeedback.user.id,
          title: 'Response to Your Beta Feedback',
          message: responsePreview,
          type: 'beta_feedback_response',
          betaFeedbackId: id,
        },
      });
    }

    // Create notification for status changes (without response)
    if (status && !adminResponse && status !== originalFeedback.status) {
      const statusLabel = status === 'reviewed' ? 'reviewed' : status === 'resolved' ? 'resolved' : status;
      // Use specific notification type based on status for proper icon coloring
      const notificationType = status === 'resolved' ? 'beta_feedback_resolved' : 'beta_feedback_reviewed';
      // Include preview of original feedback
      const feedbackPreview = originalFeedback.description.length > 60
        ? originalFeedback.description.substring(0, 60) + '...'
        : originalFeedback.description;
      await prisma.notification.create({
        data: {
          userId: originalFeedback.user.id,
          title: 'Beta Feedback Update',
          message: `Your feedback "${feedbackPreview}" has been marked as ${statusLabel}.`,
          type: notificationType,
          betaFeedbackId: id,
        },
      });
    }

    // Log audit event
    await logAuditEvent({
      adminId: session.user.id,
      adminEmail: adminUser.email || 'unknown',
      action: adminResponse ? 'respond_beta_feedback' : 'update_beta_feedback_status',
      targetUserId: originalFeedback.user.id,
      targetEmail: originalFeedback.user.email,
      details: {
        feedbackId: id,
        status: status || originalFeedback.status,
        hasResponse: !!adminResponse,
      },
    });

    return NextResponse.json({ feedback: updatedFeedback });
  } catch (error) {
    console.error('Error updating beta feedback:', error);
    return NextResponse.json(
      { error: 'Failed to update beta feedback' },
      { status: 500 }
    );
  }
});
