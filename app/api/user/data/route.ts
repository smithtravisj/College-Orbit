import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

// DELETE all user data
export const DELETE = withRateLimit(async function(_req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Delete all user data in parallel
    await Promise.all([
      prisma.course.deleteMany({ where: { userId } }),
      prisma.deadline.deleteMany({ where: { userId } }),
      prisma.task.deleteMany({ where: { userId } }),
      prisma.exam.deleteMany({ where: { userId } }),
      prisma.note.deleteMany({ where: { userId } }),
      prisma.folder.deleteMany({ where: { userId } }),
      prisma.gpaEntry.deleteMany({ where: { userId } }),
      prisma.excludedDate.deleteMany({ where: { userId } }),
      prisma.recurringPattern.deleteMany({ where: { userId } }),
      prisma.recurringDeadlinePattern.deleteMany({ where: { userId } }),
      prisma.recurringExamPattern.deleteMany({ where: { userId } }),
      prisma.settings.deleteMany({ where: { userId } }),
      prisma.notification.deleteMany({ where: { userId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user data:', error);
    return NextResponse.json(
      { error: 'Failed to delete data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
});
