import { prisma } from '@/lib/prisma';

export interface GenerateCalendarEventInstancesOptions {
  patternId: string;
  userId: string;
  windowDays?: number;
}

/**
 * Generate recurring calendar event instances for a specific pattern.
 * Generates instances for the next N days (default 60 days).
 */
export async function generateRecurringCalendarEventInstances(
  options: GenerateCalendarEventInstancesOptions
): Promise<void> {
  const { patternId, userId, windowDays = 60 } = options;

  try {
    const pattern = await prisma.recurringCalendarEventPattern.findFirst({
      where: { id: patternId, userId, isActive: true },
    });

    if (!pattern) return;

    const now = new Date();
    const windowEnd = new Date();
    windowEnd.setDate(windowEnd.getDate() + windowDays);

    // Find the last instance date for this pattern
    const lastEvent = await prisma.calendarEvent.findFirst({
      where: { recurringPatternId: patternId },
      orderBy: { instanceDate: 'desc' },
    });

    let currentDate: Date;
    if (lastEvent?.instanceDate) {
      currentDate = new Date(lastEvent.instanceDate);
    } else if (pattern.startDate) {
      const sd = new Date(pattern.startDate);
      currentDate = new Date(sd.getUTCFullYear(), sd.getUTCMonth(), sd.getUTCDate(), 12, 0, 0);
      // Go back one day so moveToNextOccurrence finds the start date
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate = new Date(now);
      currentDate.setDate(currentDate.getDate() - 1);
    }

    let intervalDays: number;
    const daysOfWeek = (pattern.daysOfWeek as number[]) || [];
    const daysOfMonth = (pattern.daysOfMonth as number[]) || [];

    switch (pattern.recurrenceType) {
      case 'daily':
        intervalDays = 1;
        break;
      case 'weekly':
        intervalDays = 7;
        break;
      case 'biweekly':
        intervalDays = 14;
        break;
      case 'monthly':
        intervalDays = 30;
        break;
      case 'custom':
        intervalDays = pattern.intervalDays || 7;
        break;
      default:
        intervalDays = 7;
    }

    const moveToNextOccurrence = (date: Date): Date => {
      const newDate = new Date(date);

      if (pattern.recurrenceType === 'weekly' && daysOfWeek.length > 0) {
        for (let attempts = 0; attempts < 7; attempts++) {
          newDate.setDate(newDate.getDate() + 1);
          if (daysOfWeek.includes(newDate.getDay())) return newDate;
        }
        return newDate;
      } else if (pattern.recurrenceType === 'biweekly' && daysOfWeek.length > 0) {
        const minDate = new Date(date);
        minDate.setDate(minDate.getDate() + 14);
        for (let attempts = 0; attempts < 14; attempts++) {
          newDate.setDate(newDate.getDate() + 1);
          if (newDate >= minDate && daysOfWeek.includes(newDate.getDay())) return newDate;
        }
        return newDate;
      } else if (pattern.recurrenceType === 'monthly' && daysOfMonth.length > 0) {
        for (let attempts = 0; attempts < 365; attempts++) {
          newDate.setDate(newDate.getDate() + 1);
          if (daysOfMonth.includes(newDate.getDate())) return newDate;
        }
        return newDate;
      } else {
        newDate.setDate(newDate.getDate() + intervalDays);
        return newDate;
      }
    };

    currentDate = moveToNextOccurrence(currentDate);

    // Fetch existing instance dates
    const existingInstances = await prisma.calendarEvent.findMany({
      where: { recurringPatternId: patternId },
      select: { instanceDate: true },
    });
    const existingDates = new Set(
      existingInstances.map(i =>
        typeof i.instanceDate === 'string' ? i.instanceDate : i.instanceDate?.toISOString() || ''
      )
    );

    const template = pattern.eventTemplate as any;
    const instances: any[] = [];
    let instanceNumber = pattern.instanceCount;

    while (currentDate <= windowEnd) {
      // Check end conditions
      if (pattern.endDate) {
        const cd = currentDate;
        const currentDateStr = `${cd.getFullYear()}-${String(cd.getMonth() + 1).padStart(2, '0')}-${String(cd.getDate()).padStart(2, '0')}`;
        const ed = new Date(pattern.endDate);
        const endDateStr = `${ed.getUTCFullYear()}-${String(ed.getUTCMonth() + 1).padStart(2, '0')}-${String(ed.getUTCDate()).padStart(2, '0')}`;
        if (currentDateStr > endDateStr) break;
      }
      if (pattern.occurrenceCount && instanceNumber >= pattern.occurrenceCount) break;

      const instanceDateStr = currentDate.toISOString();
      if (!existingDates.has(instanceDateStr)) {
        // Build startAt
        const startAt = new Date(currentDate);
        if (!template.allDay && template.startTime) {
          const [h, m] = template.startTime.split(':').map(Number);
          startAt.setHours(h, m, 0, 0);
        } else {
          startAt.setHours(0, 0, 0, 0);
        }

        // Build endAt
        let endAt: Date | null = null;
        if (!template.allDay && template.endTime) {
          endAt = new Date(currentDate);
          const [eh, em] = template.endTime.split(':').map(Number);
          endAt.setHours(eh, em, 0, 0);
        }

        instances.push({
          userId,
          title: template.title,
          description: template.description || '',
          startAt,
          endAt,
          allDay: template.allDay || false,
          color: template.color || null,
          location: template.location || null,
          recurringPatternId: patternId,
          instanceDate: new Date(currentDate),
        });

        instanceNumber++;
      }

      currentDate = moveToNextOccurrence(currentDate);
    }

    // Batch create
    if (instances.length > 0) {
      await prisma.calendarEvent.createMany({ data: instances });
      await prisma.recurringCalendarEventPattern.update({
        where: { id: patternId },
        data: {
          lastGenerated: new Date(),
          instanceCount: instanceNumber,
        },
      });
    }
  } catch (error) {
    console.error('[generateRecurringCalendarEventInstances] Error:', error);
  }
}

/**
 * Generate instances for all active recurring calendar event patterns for a user.
 */
export async function generateAllRecurringCalendarEventInstances(userId: string): Promise<void> {
  const patterns = await prisma.recurringCalendarEventPattern.findMany({
    where: { userId, isActive: true },
  });

  for (const pattern of patterns) {
    await generateRecurringCalendarEventInstances({
      patternId: pattern.id,
      userId,
    });
  }
}
