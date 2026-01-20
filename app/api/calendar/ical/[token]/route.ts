import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  generateIcal,
  deadlineToCalendarItem,
  examToCalendarItem,
  taskToCalendarItem,
  courseScheduleToCalendarItems,
  calendarEventToCalendarItem,
} from '@/lib/ical';

// GET /api/calendar/ical/[token] - Public iCal feed (token-based for subscriptions)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || token.length < 32) {
      return new NextResponse('Invalid token', { status: 400 });
    }

    // Find user by calendar token
    const user = await prisma.user.findUnique({
      where: { calendarToken: token },
      select: { id: true, name: true },
    });

    if (!user) {
      return new NextResponse('Invalid or expired calendar token', { status: 404 });
    }

    const userId = user.id;

    // Fetch all items with dates
    const [deadlines, exams, tasks, courses, calendarEvents] = await Promise.all([
      prisma.deadline.findMany({
        where: { userId },
        include: { course: { select: { name: true } } },
      }),
      prisma.exam.findMany({
        where: { userId },
        include: { course: { select: { name: true } } },
      }),
      prisma.task.findMany({
        where: { userId, dueAt: { not: null } },
        include: { course: { select: { name: true } } },
      }),
      prisma.course.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          code: true,
          meetingTimes: true,
          startDate: true,
          endDate: true,
        },
      }),
      prisma.calendarEvent.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          description: true,
          startAt: true,
          endAt: true,
          allDay: true,
          location: true,
        },
      }),
    ]);

    // Convert to calendar items
    const calendarItems = [
      ...deadlines.map(deadlineToCalendarItem).filter((item): item is NonNullable<typeof item> => item !== null),
      ...exams.map(examToCalendarItem).filter((item): item is NonNullable<typeof item> => item !== null),
      ...tasks.map(taskToCalendarItem).filter((item): item is NonNullable<typeof item> => item !== null),
      ...courses.flatMap(courseScheduleToCalendarItems),
      ...calendarEvents.map(calendarEventToCalendarItem),
    ];

    // Generate iCal content
    const calendarName = user.name ? `${user.name}'s College Orbit` : 'College Orbit';
    const icalContent = generateIcal(calendarItems, calendarName);

    // Return as iCal content (for subscription)
    return new NextResponse(icalContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error serving calendar feed:', error);
    return new NextResponse('Failed to serve calendar', { status: 500 });
  }
}
