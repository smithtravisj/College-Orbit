import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { withRateLimit } from '@/lib/withRateLimit';

// DELETE user account
export const DELETE = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    // Delete analytics events and audit logs (not cascade-deleted since no FK relation)
    await Promise.all([
      prisma.analyticsEvent.deleteMany({ where: { userId } }),
      prisma.auditLog.deleteMany({ where: { OR: [{ adminId: userId }, { targetUserId: userId }] } }),
    ]);

    // Delete user (cascades to all related data)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user account:', error);
    return NextResponse.json(
      { error: 'We couldn\'t delete your account. Please try again.' },
      { status: 500 }
    );
  }
});
