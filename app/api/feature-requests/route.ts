import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

// POST create new feature request
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const data = await req.json();

    if (!data.description || !data.description.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    const featureRequest = await prisma.featureRequest.create({
      data: {
        userId: token.id,
        description: data.description.trim(),
        status: 'pending',
      },
    });

    // Get user info for notification message
    const user = await prisma.user.findUnique({
      where: { id: token.id },
      select: { name: true },
    });

    // Create notification for the user
    await prisma.notification.create({
      data: {
        userId: token.id,
        title: 'Request Submitted',
        message: 'Your feature request has been submitted. We appreciate your feedback!',
        type: 'feature_request_submitted',
        featureRequestId: featureRequest.id,
      },
    });

    // Create notifications for all admins
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true },
    });

    if (admins.length > 0) {
      await Promise.all(
        admins.map((admin) =>
          prisma.notification.create({
            data: {
              userId: admin.id,
              title: 'New Feature Request',
              message: `${user?.name || 'A user'} requested: "${data.description.trim()}"`,
              type: 'feature_request',
              featureRequestId: featureRequest.id,
            },
          })
        )
      );
    }

    return NextResponse.json({ featureRequest }, { status: 201 });
  } catch (error) {
    console.error('Error creating feature request:', error);
    return NextResponse.json(
      { error: 'Failed to create feature request' },
      { status: 500 }
    );
  }
}
