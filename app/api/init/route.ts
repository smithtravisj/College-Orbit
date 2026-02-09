import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

// GET all data for authenticated user in a single request
// This replaces 14 separate API calls with 1
// Note: No rate limiting on this read-heavy init endpoint to reduce latency
export async function GET(request: NextRequest) {
  try {
    // Use getToken instead of getServerSession to avoid session callback DB queries
    // This is ~10x faster since it only decodes the JWT without hitting the database
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const userId = token.id as string;

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
      workItems,
      recurringWorkPatterns,
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
        // Exclude content field - it can be large and is lazy-loaded when note is opened
        select: {
          id: true,
          title: true,
          plainText: true,
          tags: true,
          links: true,
          files: true,
          isPinned: true,
          createdAt: true,
          updatedAt: true,
          courseId: true,
          folderId: true,
          taskId: true,
          deadlineId: true,
          examId: true,
          workItemId: true,
          recurringTaskPatternId: true,
          recurringDeadlinePatternId: true,
          recurringExamPatternId: true,
          recurringWorkPatternId: true,
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
      prisma.workItem.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.recurringWorkPattern.findMany({
        where: { userId },
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
        weekStartsOn: 'Sun',
        theme: 'dark',
        enableNotifications: false,
        university: null,
        hasCompletedOnboarding: false,
        needsCollegeSelection: false,
        hasDemoData: false,
        selectedGradeSemester: 'all',
        courseTermFilter: 'all',
        visiblePages: ['Dashboard', 'Calendar', 'Work', 'Exams', 'Notes', 'Courses', 'Shopping', 'Tools', 'Progress', 'Settings'],
        visibleDashboardCards: ['timeline', 'progress', 'dashboard_quickLinks'],
        visibleToolsCards: ['pomodoroTimer', 'fileConverter', 'unitConverter', 'wordCounter', 'citationGenerator', 'flashcards', 'gradeTracker', 'gpaTrendChart', 'whatIfProjector', 'gpaCalculator', 'finalGradeCalculator', 'tools_quickLinks'],
        visiblePagesOrder: ['Dashboard', 'Calendar', 'Work', 'Exams', 'Notes', 'Courses', 'Shopping', 'Tools', 'Progress'],
        toolsCardsOrder: ['pomodoroTimer', 'fileConverter', 'unitConverter', 'wordCounter', 'citationGenerator', 'flashcards', 'gradeTracker', 'gpaTrendChart', 'whatIfProjector', 'gpaCalculator', 'finalGradeCalculator', 'tools_quickLinks'],
      },
      excludedDates,
      gpaEntries,
      recurringPatterns,
      recurringDeadlinePatterns,
      recurringExamPatterns,
      shoppingItems,
      calendarEvents,
      workItems,
      recurringWorkPatterns,
    });
  } catch (error) {
    console.error('Error fetching initial data:', error);
    return NextResponse.json(
      { error: 'We couldn\'t load your data. Please check your connection and try again.' },
      { status: 500 }
    );
  }
}
