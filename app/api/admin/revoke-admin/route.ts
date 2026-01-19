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

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Prevent self-demotion
    if (userId === token.id) {
      return NextResponse.json({ error: 'You cannot revoke your own admin access' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, isAdmin: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.isAdmin) {
      return NextResponse.json({ error: 'User is not an admin' }, { status: 400 });
    }

    // Revoke admin access
    await prisma.user.update({
      where: { id: userId },
      data: { isAdmin: false },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        title: 'Admin Access Revoked',
        message: 'Your admin access has been revoked by another administrator.',
        type: 'admin_revoked',
      },
    });

    // Log audit event
    await logAuditEvent({
      adminId: token.id as string,
      adminEmail: requester.email || 'unknown',
      action: 'revoke_admin',
      targetUserId: userId,
      targetEmail: user.email,
    });

    return NextResponse.json({
      success: true,
      message: `Revoked admin access from ${user.email}`,
    });
  } catch (error) {
    console.error('Error revoking admin:', error);
    return NextResponse.json(
      { error: 'Failed to revoke admin access' },
      { status: 500 }
    );
  }
}
