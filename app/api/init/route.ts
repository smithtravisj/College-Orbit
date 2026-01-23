import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

// GET all data for authenticated user in a single request
// This replaces 14 separate API calls with 1
export const GET = withRateLimit(async function(_request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all data in parallel using a single database connection
    const [
      courses,
      deadlines,
      tasks,
      exams,
      notes,
      folders,
      settings,
      excludedDates,
      gpaEntries,
      recurringPatterns,
      recurringDeadlinePatterns,
      recurringExamPatterns,
      shoppingItems,
      calendarEvents,
    ] = await Promise.all([
      prisma.course.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.deadline.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.task.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.exam.findMany({
        where: { userId },
        orderBy: { examAt: 'asc' },
      }),
      prisma.note.findMany({
        where: { userId },
        include: {
          course: { select: { id: true, code: true, name: true } },
          folder: { select: { id: true, name: true } },
          task: { select: { id: true, title: true } },
          deadline: { select: { id: true, title: true } },
          exam: { select: { id: true, title: true } },
          recurringTaskPattern: { select: { id: true, taskTemplate: true } },
          recurringDeadlinePattern: { select: { id: true, deadlineTemplate: true } },
          recurringExamPattern: { select: { id: true, examTemplate: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.folder.findMany({
        where: { userId },
        orderBy: { name: 'asc' },
      }),
      prisma.settings.findUnique({
        where: { userId },
      }),
      prisma.excludedDate.findMany({
        where: { userId },
      }),
      prisma.gpaEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.recurringPattern.findMany({
        where: { userId },
      }),
      prisma.recurringDeadlinePattern.findMany({
        where: { userId },
      }),
      prisma.recurringExamPattern.findMany({
        where: { userId },
      }),
      prisma.shoppingItem.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.calendarEvent.findMany({
        where: { userId },
        orderBy: { startAt: 'asc' },
      }),
    ]);

    // Return all data in a single response
    return NextResponse.json({
      userId,
      courses,
      deadlines,
      tasks,
      exams,
      notes,
      folders,
      settings: settings || {
        dueSoonWindowDays: 7,
        weekStartsOn: 'Sun',
        theme: 'dark',
        enableNotifications: false,
        university: null,
        hasCompletedOnboarding: false,
        selectedGradeSemester: 'all',
        courseTermFilter: 'all',
        visibleDashboardCards: ['timeline', 'overview', 'dashboard_quickLinks'],
        visibleToolsCards: ['pomodoroTimer', 'gradeTracker', 'gpaTrendChart', 'whatIfProjector', 'gpaCalculator', 'tools_quickLinks'],
      },
      excludedDates,
      gpaEntries,
      recurringPatterns,
      recurringDeadlinePatterns,
      recurringExamPatterns,
      shoppingItems,
      calendarEvents,
    });
  } catch (error) {
    console.error('Error fetching initial data:', error);
    return NextResponse.json(
      { error: 'We couldn\'t load your data. Please check your connection and try again.' },
      { status: 500 }
    );
  }
});
