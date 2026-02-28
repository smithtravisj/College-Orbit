import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';

// GET a single pattern
export const GET = withRateLimit(async function (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const pattern = await prisma.recurringCalendarEventPattern.findFirst({
      where: { id, userId },
    });

    if (!pattern) {
      return NextResponse.json({ error: 'Pattern not found' }, { status: 404 });
    }

    return NextResponse.json({ pattern });
  } catch (error) {
    console.error('[GET /api/recurring-calendar-event-patterns/[id]] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch pattern' }, { status: 500 });
  }
});

// PATCH update a pattern
export const PATCH = withRateLimit(async function (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    const existing = await prisma.recurringCalendarEventPattern.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Pattern not found' }, { status: 404 });
    }

    const updated = await prisma.recurringCalendarEventPattern.update({
      where: { id },
      data: {
        ...(data.recurrenceType !== undefined && { recurrenceType: data.recurrenceType }),
        ...(data.intervalDays !== undefined && { intervalDays: data.intervalDays }),
        ...(data.daysOfWeek !== undefined && { daysOfWeek: data.daysOfWeek }),
        ...(data.daysOfMonth !== undefined && { daysOfMonth: data.daysOfMonth }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
        ...(data.occurrenceCount !== undefined && { occurrenceCount: data.occurrenceCount }),
        ...(data.eventTemplate !== undefined && { eventTemplate: data.eventTemplate }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return NextResponse.json({ pattern: updated });
  } catch (error) {
    console.error('[PATCH /api/recurring-calendar-event-patterns/[id]] Error:', error);
    return NextResponse.json({ error: 'Failed to update pattern' }, { status: 500 });
  }
});

// DELETE a pattern (and optionally its instances)
export const DELETE = withRateLimit(async function (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const deleteInstances = searchParams.get('deleteInstances') === 'true';

    const existing = await prisma.recurringCalendarEventPattern.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Pattern not found' }, { status: 404 });
    }

    if (deleteInstances) {
      // Delete all generated instances
      await prisma.calendarEvent.deleteMany({
        where: { recurringPatternId: id },
      });
    } else {
      // Unlink instances so they become standalone events
      await prisma.calendarEvent.updateMany({
        where: { recurringPatternId: id },
        data: { recurringPatternId: null, instanceDate: null },
      });
    }

    await prisma.recurringCalendarEventPattern.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/recurring-calendar-event-patterns/[id]] Error:', error);
    return NextResponse.json({ error: 'Failed to delete pattern' }, { status: 500 });
  }
});
