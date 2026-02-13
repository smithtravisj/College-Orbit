import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if requester is admin
    const requester = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (!requester?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId: targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { email: true, lifetimePremium: true, subscriptionTier: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Revoke premium - reset to free tier
    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        lifetimePremium: false,
        subscriptionTier: 'free',
        subscriptionStatus: 'none',
        subscriptionPlan: null,
        subscriptionExpiresAt: null,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        title: 'Premium Access Revoked',
        message: 'Your premium access has been revoked by an administrator.',
        type: 'subscription_canceled',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Revoked premium from ${user.email}`,
    });
  } catch (error) {
    console.error('Error revoking premium:', error);
    return NextResponse.json(
      { error: 'Failed to revoke premium' },
      { status: 500 }
    );
  }
}
