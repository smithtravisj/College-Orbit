import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';
import { generateAllRecurringCalendarEventInstances } from '@/lib/recurringCalendarEventUtils';

// GET all calendar events for authenticated user
export const GET = withRateLimit(async function(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    // Generate recurring event instances in the background
    generateAllRecurringCalendarEventInstances(userId).catch(err => {
      console.error('Error generating recurring calendar event instances:', err);
    });

    const events = await prisma.calendarEvent.findMany({
      where: {
        userId,
      },
      orderBy: {
        startAt: 'asc',
      },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to load calendar events' },
      { status: 500 }
    );
  }
});

// POST create new calendar event
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const data = await req.json();

    if (!data.title || !data.title.trim()) {
      return NextResponse.json({ error: 'Event title is required' }, { status: 400 });
    }

    if (!data.startAt) {
      return NextResponse.json({ error: 'Start date/time is required' }, { status: 400 });
    }

    // If recurrence data is provided, create a recurring pattern instead
    if (data.recurrence && data.recurrence.type && data.recurrence.type !== 'none') {
      const { generateRecurringCalendarEventInstances } = await import('@/lib/recurringCalendarEventUtils');

      // Extract time from startAt
      const startDate = new Date(data.startAt);
      const startTime = data.allDay ? null : `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
      let endTime = null;
      if (data.endAt && !data.allDay) {
        const endDate = new Date(data.endAt);
        endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
      }

      const pattern = await prisma.recurringCalendarEventPattern.create({
        data: {
          userId,
          recurrenceType: data.recurrence.type,
          intervalDays: data.recurrence.intervalDays || null,
          daysOfWeek: data.recurrence.daysOfWeek || [],
          daysOfMonth: data.recurrence.daysOfMonth || [],
          startDate: new Date(data.startAt),
          endDate: data.recurrence.endDate ? new Date(data.recurrence.endDate) : null,
          occurrenceCount: data.recurrence.occurrenceCount || null,
          eventTemplate: {
            title: data.title.trim(),
            description: data.description || '',
            color: data.color || null,
            location: data.location || null,
            allDay: data.allDay || false,
            startTime,
            endTime,
          },
        },
      });

      await generateRecurringCalendarEventInstances({
        patternId: pattern.id,
        userId,
      });

      // Fetch generated events
      const events = await prisma.calendarEvent.findMany({
        where: { recurringPatternId: pattern.id },
        orderBy: { startAt: 'asc' },
        take: 1,
      });

      return NextResponse.json({ event: events[0] || null, pattern }, { status: 201 });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        userId,
        title: data.title.trim(),
        description: data.description || '',
        startAt: new Date(data.startAt),
        endAt: data.endAt ? new Date(data.endAt) : null,
        allDay: data.allDay || false,
        color: data.color || null,
        location: data.location || null,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
});
