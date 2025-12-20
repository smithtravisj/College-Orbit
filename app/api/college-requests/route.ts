import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';

// POST create a new college request
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const data = await req.json();
    const { collegeName } = data;

    // Validate college name
    if (!collegeName || typeof collegeName !== 'string') {
      return NextResponse.json({ error: 'College name is required' }, { status: 400 });
    }

    const trimmedName = collegeName.trim();
    if (trimmedName.length === 0) {
      return NextResponse.json({ error: 'College name cannot be empty' }, { status: 400 });
    }

    if (trimmedName.length > 100) {
      return NextResponse.json({ error: 'College name is too long (max 100 characters)' }, { status: 400 });
    }

    // Create college request
    const collegeRequest = await prisma.collegeRequest.create({
      data: {
        userId: session.user.id,
        collegeName: trimmedName,
        status: 'pending',
      },
    });

    // Create notification for the user
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: 'Request Submitted',
        message: `Your request to add ${trimmedName} has been submitted. We'll review it soon!`,
        type: 'college_request_submitted',
        collegeRequestId: collegeRequest.id,
      },
    });

    // Create notification for all admins
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true },
    });

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: 'New College Request',
          message: `${session.user.name || 'A user'} requested to add ${trimmedName} as a college.`,
          type: 'college_request_pending',
          collegeRequestId: collegeRequest.id,
        },
      });
    }

    console.log('[POST /api/college-requests] College request created:', collegeRequest);

    return NextResponse.json({
      success: true,
      message: 'Request submitted! We\'ll review your college request.',
      collegeRequest,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[POST /api/college-requests] Error:', errorMessage);
    console.error('[POST /api/college-requests] Full error:', error);
    return NextResponse.json(
      { error: 'Failed to submit college request', details: errorMessage },
      { status: 500 }
    );
  }
}
