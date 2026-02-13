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

    // Check if already admin
    if (user.isAdmin) {
      return NextResponse.json({ error: 'User is already an admin' }, { status: 400 });
    }

    // Grant admin status (also grants lifetime premium automatically via session callback)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isAdmin: true,
        lifetimePremium: true,
        subscriptionTier: 'premium',
        subscriptionStatus: 'active',
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Admin Access Granted',
        message: 'You have been granted admin access. You now have access to the Admin panel and all premium features.',
        type: 'admin_granted',
      },
    });

    // Log audit event
    await logAuditEvent({
      adminId: userId,
      adminEmail: requester.email || 'unknown',
      action: 'grant_admin',
      targetUserId: user.id,
      targetEmail: user.email,
    });

    return NextResponse.json({
      success: true,
      message: `Granted admin access to ${user.email}`,
    });
  } catch (error) {
    console.error('Error granting admin access:', error);
    return NextResponse.json(
      { error: 'Failed to grant admin access' },
      { status: 500 }
    );
  }
}
