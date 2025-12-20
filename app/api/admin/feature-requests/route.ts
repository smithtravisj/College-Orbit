import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';

// GET all feature requests (admin only)
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

    const requests = await prisma.featureRequest.findMany({
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

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching feature requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature requests' },
      { status: 500 }
    );
  }
});

// PATCH update feature request status (admin only)
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
    const { id, requestId, status } = data;
    const featureIdToUpdate = id || requestId;

    if (!featureIdToUpdate || !status) {
      return NextResponse.json(
        { error: 'ID and status are required' },
        { status: 400 }
      );
    }

    // Get the feature request with user info first
    const originalRequest = await prisma.featureRequest.findUnique({
      where: { id: featureIdToUpdate },
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

    if (!originalRequest) {
      return NextResponse.json({ error: 'Feature request not found' }, { status: 404 });
    }

    const featureRequest = await prisma.featureRequest.update({
      where: { id: featureIdToUpdate },
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

    // Create notification for the user who submitted the request (non-blocking)
    try {
      const statusLabel = status === 'implemented' ? 'Implemented' : status === 'rejected' ? 'Rejected' : status;
      const shortDescription = originalRequest.description.length > 100
        ? originalRequest.description.substring(0, 100) + '...'
        : originalRequest.description;

      await prisma.notification.create({
        data: {
          userId: originalRequest.user.id,
          title: `Feature Request ${statusLabel}`,
          message: `Your feature request has been marked as ${status === 'implemented' ? 'implemented' : 'rejected'}: "${shortDescription}"`,
          type: `feature_request_${status}`,
          featureRequestId: featureRequest.id,
        },
      });
    } catch (notificationError) {
      console.error('Failed to create notification for feature request:', notificationError);
      // Don't block the response if notification fails
    }

    return NextResponse.json({ featureRequest });
  } catch (error) {
    console.error('Error updating feature request:', error);
    return NextResponse.json(
      { error: 'Failed to update feature request' },
      { status: 500 }
    );
  }
});

// DELETE feature request (admin only)
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

    await prisma.featureRequest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting feature request:', error);
    return NextResponse.json(
      { error: 'Failed to delete feature request' },
      { status: 500 }
    );
  }
});
