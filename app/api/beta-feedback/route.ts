import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';

// POST create new beta feedback
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    // Beta feedback is open to all users (beta enrollment check removed)

    const data = await req.json();

    if (!data.description || !data.description.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    if (data.description.trim().length > 1000) {
      return NextResponse.json(
        { error: 'Description must be 1000 characters or less' },
        { status: 400 }
      );
    }

    const betaFeedback = await prisma.betaFeedback.create({
      data: {
        userId: userId,
        description: data.description.trim(),
        status: 'pending',
      },
    });

    // Get user info for notification message
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    // Create notification for the user
    await prisma.notification.create({
      data: {
        userId: userId,
        title: 'Beta Feedback Submitted',
        message: 'Thanks for helping improve College Orbit! We\'ll review your feedback soon.',
        type: 'beta_feedback_submitted',
        betaFeedbackId: betaFeedback.id,
      },
    });

    // Create notifications for all admins
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true },
    });

    if (admins.length > 0) {
      const descriptionPreview = data.description.trim().length > 50
        ? data.description.trim().substring(0, 50) + '...'
        : data.description.trim();

      await Promise.all(
        admins.map((admin) =>
          prisma.notification.create({
            data: {
              userId: admin.id,
              title: 'New Beta Feedback',
              message: `${user?.name || user?.email || 'A beta user'} submitted: "${descriptionPreview}"`,
              type: 'beta_feedback',
              betaFeedbackId: betaFeedback.id,
            },
          })
        )
      );
    }

    return NextResponse.json({ betaFeedback }, { status: 201 });
  } catch (error) {
    console.error('Error creating beta feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit beta feedback' },
      { status: 500 }
    );
  }
});
