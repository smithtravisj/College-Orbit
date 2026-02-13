import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLog';

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if requester is admin
    const requester = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true, email: true },
    });

    if (!requester?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userIdOrEmail } = await req.json();

    if (!userIdOrEmail) {
      return NextResponse.json({ error: 'userIdOrEmail is required' }, { status: 400 });
    }

    // Find user by ID or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userIdOrEmail },
          { email: userIdOrEmail },
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already has lifetime premium
    if (user.lifetimePremium) {
      return NextResponse.json({ error: 'User already has lifetime premium' }, { status: 400 });
    }

    // Grant lifetime premium
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lifetimePremium: true,
        subscriptionTier: 'premium',
        subscriptionStatus: 'active',
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Lifetime Premium Granted!',
        message: 'You have been granted lifetime Premium access by an admin. Enjoy all premium features forever!',
        type: 'subscription_active',
      },
    });

    // Log audit event
    await logAuditEvent({
      adminId: userId,
      adminEmail: requester.email || 'unknown',
      action: 'grant_premium',
      targetUserId: user.id,
      targetEmail: user.email,
    });

    return NextResponse.json({
      success: true,
      message: `Granted lifetime premium to ${user.email}`,
    });
  } catch (error) {
    console.error('Error granting lifetime premium:', error);
    return NextResponse.json(
      { error: 'Failed to grant lifetime premium' },
      { status: 500 }
    );
  }
}
