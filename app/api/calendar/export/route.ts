import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import {
  generateIcal,
  deadlineToCalendarItem,
  examToCalendarItem,
  taskToCalendarItem,
  courseScheduleToCalendarItems,
  calendarEventToCalendarItem,
} from '@/lib/ical';

// GET /api/calendar/export - Download iCal file (authenticated)
export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

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
    const icalContent = generateIcal(calendarItems, 'College Orbit');

    // Return as downloadable file
    return new NextResponse(icalContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="college-orbit-calendar.ics"`,
      },
    });
  } catch (error) {
    console.error('Error exporting calendar:', error);
    return NextResponse.json({ error: 'Failed to export calendar' }, { status: 500 });
  }
}
