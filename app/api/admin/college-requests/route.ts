import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';
import { logAuditEvent } from '@/lib/auditLog';
import { sendCollegeRequestApprovedEmail } from '@/lib/email';

// GET all college requests (admin only)
export const GET = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get pending college requests ordered by newest first
    const requests = await prisma.collegeRequest.findMany({
      where: {
        status: 'pending',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('[GET /api/admin/college-requests] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
});

// PATCH update request status
export const PATCH = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true, email: true },
    });

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const data = await req.json();
    const { requestId, status } = data;

    if (!requestId || !status) {
      return NextResponse.json({ error: 'Missing requestId or status' }, { status: 400 });
    }

    if (!['pending', 'added', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get the request with user info first
    const collegeRequest = await prisma.collegeRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    if (!collegeRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Update the request
    const updatedRequest = await prisma.collegeRequest.update({
      where: { id: requestId },
      data: { status },
    });

    // Create notification for the user and delete admin notifications
    if (status === 'added' || status === 'rejected') {
      const notificationTitle = status === 'added' ? 'College Request Approved' : 'College Request Rejected';
      const notificationMessage = status === 'added'
        ? `Your request for ${collegeRequest.collegeName} has been approved! You can now select it as your college in Settings.`
        : `Your request for ${collegeRequest.collegeName} was not approved.`;

      await prisma.notification.create({
        data: {
          userId: collegeRequest.user.id,
          title: notificationTitle,
          message: notificationMessage,
          type: status === 'added' ? 'college_request_approved' : 'college_request_rejected',
        },
      });

      // Send email notification for approved requests
      if (status === 'added' && collegeRequest.user.email) {
        try {
          await sendCollegeRequestApprovedEmail({
            email: collegeRequest.user.email,
            name: collegeRequest.user.name,
            collegeName: collegeRequest.collegeName,
          });
        } catch (emailError) {
          // Log but don't fail the request if email fails
          console.error('[PATCH /api/admin/college-requests] Failed to send email:', emailError);
        }
      }

      // Delete admin notifications for this college request
      await prisma.notification.deleteMany({
        where: {
          collegeRequestId: requestId,
        },
      });

      // Log audit event
      await logAuditEvent({
        adminId: userId,
        adminEmail: adminUser.email || 'unknown',
        action: status === 'added' ? 'approve_college_request' : 'reject_college_request',
        targetUserId: collegeRequest.user.id,
        details: {
          requestId,
          collegeName: collegeRequest.collegeName,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Request marked as ${status}`,
      request: updatedRequest,
    });
  } catch (error) {
    console.error('[PATCH /api/admin/college-requests] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    );
  }
});

// DELETE a college request
export const DELETE = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get('id');

    if (!requestId) {
      return NextResponse.json({ error: 'Missing request id' }, { status: 400 });
    }

    await prisma.collegeRequest.delete({
      where: { id: requestId },
    });

    return NextResponse.json({ success: true, message: 'Request deleted' });
  } catch (error) {
    console.error('[DELETE /api/admin/college-requests] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete request' },
      { status: 500 }
    );
  }
});
