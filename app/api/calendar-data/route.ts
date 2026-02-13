import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';

// GET all calendar-related data in a single request
// This consolidates 6 separate API calls into 1
export const GET = withRateLimit(async function(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    // Fetch all calendar data in parallel
    const [
      tasks,
      deadlines,
      workItems,
      exams,
      calendarEvents,
      courses,
      excludedDates,
    ] = await Promise.all([
      prisma.task.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.deadline.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.workItem.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.exam.findMany({
        where: { userId },
        orderBy: { examAt: 'asc' },
      }),
      prisma.calendarEvent.findMany({
        where: { userId },
        orderBy: { startAt: 'asc' },
      }),
      prisma.course.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.excludedDate.findMany({
        where: { userId },
      }),
    ]);

    return NextResponse.json({
      tasks,
      deadlines,
      workItems,
      exams,
      calendarEvents,
      courses,
      excludedDates,
    });
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    return NextResponse.json(
      { error: 'Failed to load calendar data' },
      { status: 500 }
    );
  }
});
