import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';
import { generateRecurringCalendarEventInstances } from '@/lib/recurringCalendarEventUtils';

// GET all recurring calendar event patterns
export const GET = withRateLimit(async function (request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const patterns = await prisma.recurringCalendarEventPattern.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ patterns });
  } catch (error) {
    console.error('[GET /api/recurring-calendar-event-patterns] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch patterns' }, { status: 500 });
  }
});

// POST create a new recurring calendar event pattern + generate instances
export const POST = withRateLimit(async function (request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    if (!data.recurrenceType) {
      return NextResponse.json({ error: 'Recurrence type is required' }, { status: 400 });
    }

    if (!data.eventTemplate?.title?.trim()) {
      return NextResponse.json({ error: 'Event title is required' }, { status: 400 });
    }

    const pattern = await prisma.recurringCalendarEventPattern.create({
      data: {
        userId,
        recurrenceType: data.recurrenceType,
        intervalDays: data.intervalDays || null,
        daysOfWeek: data.daysOfWeek || [],
        daysOfMonth: data.daysOfMonth || [],
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        occurrenceCount: data.occurrenceCount || null,
        eventTemplate: data.eventTemplate,
      },
    });

    // Generate initial instances
    await generateRecurringCalendarEventInstances({
      patternId: pattern.id,
      userId,
    });

    return NextResponse.json({ pattern }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/recurring-calendar-event-patterns] Error:', error);
    return NextResponse.json({ error: 'Failed to create pattern' }, { status: 500 });
  }
});
