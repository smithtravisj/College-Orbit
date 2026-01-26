import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWeeklyDigestEmail } from '@/lib/email';

// This endpoint should be called by a cron job every Sunday (or Monday) morning
// Example cron schedule: 0 8 * * 0 (Sundays at 8 AM)

export async function GET(req: NextRequest) {
  // Verify cron secret for security
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {

    console.log('[Weekly Digest] Starting weekly digest job...');

    // Get all users who have weekly digest enabled
    const usersWithDigest = await prisma.settings.findMany({
      where: {
        emailWeeklyDigest: true,
      },
      select: {
        userId: true,
      },
    });

    console.log(`[Weekly Digest] Found ${usersWithDigest.length} users with digest enabled`);

    // Calculate date range for the coming week
    const now = new Date();
    const weekStart = new Date(now);
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekStartStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weekEndStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    let sentCount = 0;
    let errorCount = 0;

    for (const { userId } of usersWithDigest) {
      try {
        // Get user info
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true },
        });

        if (!user?.email) {
          console.log(`[Weekly Digest] User ${userId} has no email, skipping`);
          continue;
        }

        // Get upcoming assignments (WorkItems with type 'assignment')
        const assignments = await prisma.workItem.findMany({
          where: {
            userId,
            type: 'assignment',
            status: 'open',
            dueAt: {
              gte: now,
              lte: weekEnd,
            },
          },
          include: {
            course: {
              select: { name: true },
            },
          },
          orderBy: { dueAt: 'asc' },
        });

        // Get upcoming exams
        const exams = await prisma.exam.findMany({
          where: {
            userId,
            examAt: {
              gte: now,
              lte: weekEnd,
            },
          },
          include: {
            course: {
              select: { name: true },
            },
          },
          orderBy: { examAt: 'asc' },
        });

        // Get upcoming tasks (WorkItems with type 'task')
        const tasks = await prisma.workItem.findMany({
          where: {
            userId,
            type: 'task',
            status: 'open',
            dueAt: {
              gte: now,
              lte: weekEnd,
            },
          },
          include: {
            course: {
              select: { name: true },
            },
          },
          orderBy: { dueAt: 'asc' },
        });

        // Format items for email
        const formattedAssignments = assignments.map(a => ({
          title: a.title,
          courseName: a.course?.name,
          dueAt: a.dueAt!.toISOString(),
          type: 'assignment' as const,
        }));

        const formattedExams = exams.map(e => ({
          title: e.title,
          courseName: e.course?.name,
          dueAt: e.examAt!.toISOString(),
          type: 'exam' as const,
        }));

        const formattedTasks = tasks.map(t => ({
          title: t.title,
          courseName: t.course?.name,
          dueAt: t.dueAt!.toISOString(),
          type: 'task' as const,
        }));

        // Send email
        await sendWeeklyDigestEmail({
          email: user.email,
          name: user.name,
          assignments: formattedAssignments,
          exams: formattedExams,
          tasks: formattedTasks,
          weekStart: weekStartStr,
          weekEnd: weekEndStr,
        });

        sentCount++;
        console.log(`[Weekly Digest] Sent to ${user.email}`);
      } catch (error) {
        errorCount++;
        console.error(`[Weekly Digest] Error sending to user ${userId}:`, error);
      }
    }

    console.log(`[Weekly Digest] Completed. Sent: ${sentCount}, Errors: ${errorCount}`);

    return NextResponse.json({
      success: true,
      sent: sentCount,
      errors: errorCount,
      total: usersWithDigest.length,
    });
  } catch (error) {
    console.error('[Weekly Digest] Fatal error:', error);
    return NextResponse.json(
      { error: 'Failed to process weekly digest' },
      { status: 500 }
    );
  }
}
