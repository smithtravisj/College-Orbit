import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { generateRecurringInstances } from '@/lib/recurringTaskUtils';

// PATCH update a recurring pattern
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    console.log('[PATCH /api/recurring-patterns/[id]] Received data:', JSON.stringify(data, null, 2));

    // Verify ownership
    const pattern = await prisma.recurringPattern.findFirst({
      where: { id, userId: token.id },
    });

    if (!pattern) {
      return NextResponse.json({ error: 'Pattern not found' }, { status: 404 });
    }

    console.log('[PATCH /api/recurring-patterns/[id]] Existing pattern:', {
      recurrenceType: pattern.recurrenceType,
      daysOfWeek: pattern.daysOfWeek,
      daysOfMonth: pattern.daysOfMonth,
      startDate: pattern.startDate,
    });

    // Update pattern - support all fields
    const updated = await prisma.recurringPattern.update({
      where: { id },
      data: {
        isActive: data.isActive !== undefined ? data.isActive : pattern.isActive,
        recurrenceType: data.recurrenceType !== undefined ? data.recurrenceType : pattern.recurrenceType,
        intervalDays: data.intervalDays !== undefined ? data.intervalDays : pattern.intervalDays,
        daysOfWeek: data.daysOfWeek !== undefined ? data.daysOfWeek : pattern.daysOfWeek,
        daysOfMonth: data.daysOfMonth !== undefined ? data.daysOfMonth : pattern.daysOfMonth,
        startDate: 'startDate' in data ? (data.startDate ? new Date(data.startDate) : null) : pattern.startDate,
        endDate: 'endDate' in data ? (data.endDate ? new Date(data.endDate) : null) : pattern.endDate,
        occurrenceCount: 'occurrenceCount' in data ? data.occurrenceCount : pattern.occurrenceCount,
        taskTemplate:
          'taskTemplate' in data ? data.taskTemplate : pattern.taskTemplate,
      },
    });

    console.log('[PATCH /api/recurring-patterns/[id]] Updated pattern:', {
      recurrenceType: updated.recurrenceType,
      daysOfWeek: updated.daysOfWeek,
      daysOfMonth: updated.daysOfMonth,
      startDate: updated.startDate,
    });

    // Delete old instances and regenerate with new pattern settings
    console.log('[PATCH /api/recurring-patterns/[id]] Deleting old instances and regenerating...');
    try {
      // Delete all existing instances for this pattern
      await prisma.task.deleteMany({
        where: { recurringPatternId: id },
      });

      // Reset the pattern's instance tracking
      await prisma.recurringPattern.update({
        where: { id },
        data: {
          lastGenerated: new Date(),
          instanceCount: 0,
        },
      });

      // Regenerate instances with the new pattern settings
      await generateRecurringInstances({
        patternId: id,
        userId: token.id,
        windowDays: 365,
      });

      console.log('[PATCH /api/recurring-patterns/[id]] Successfully regenerated instances');
    } catch (error) {
      console.error('[PATCH /api/recurring-patterns/[id]] Error regenerating instances:', error);
      // Don't fail the update if regeneration fails - pattern is still updated
    }

    return NextResponse.json({ pattern: updated });
  } catch (error) {
    console.error('[PATCH /api/recurring-patterns/[id]] Error:', error);
    return NextResponse.json({ error: 'Failed to update pattern' }, { status: 500 });
  }
}
