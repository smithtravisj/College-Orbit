import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLog';

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if requester is admin
    const requester = await prisma.user.findUnique({
      where: { id: token.id as string },
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

    // Calculate semester expiration (4 months from now)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 4);

    // Grant semester pass
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: 'premium',
        subscriptionStatus: 'active',
        subscriptionPlan: 'semester',
        subscriptionExpiresAt: expiresAt,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Semester Pass Granted!',
        message: `You have been granted a 4-month Semester Pass by an admin. Enjoy premium features until ${expiresAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}!`,
        type: 'subscription_active',
      },
    });

    // Log audit event
    await logAuditEvent({
      adminId: token.id as string,
      adminEmail: requester.email || 'unknown',
      action: 'grant_semester',
      targetUserId: user.id,
      targetEmail: user.email,
      details: {
        expiresAt: expiresAt.toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Granted semester pass to ${user.email} (expires ${expiresAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`,
    });
  } catch (error) {
    console.error('Error granting semester pass:', error);
    return NextResponse.json(
      { error: 'Failed to grant semester pass' },
      { status: 500 }
    );
  }
}
