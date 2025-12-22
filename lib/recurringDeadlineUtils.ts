import { prisma } from '@/lib/prisma';

export interface GenerateDeadlineInstancesOptions {
  patternId: string;
  userId: string;
  windowDays?: number;
  includePast?: boolean;
}

/**
 * Generate recurring deadline instances for a specific pattern
 * Generates instances for the next N days (default 60 days)
 */
export async function generateRecurringDeadlineInstances(
  options: GenerateDeadlineInstancesOptions
): Promise<void> {
  const { patternId, userId, windowDays = 60 } = options;

  try {
    // 1. Fetch the pattern
    const pattern = await prisma.recurringDeadlinePattern.findFirst({
      where: { id: patternId, userId, isActive: true },
    });

    if (!pattern) {
      console.log(`[generateRecurringDeadlineInstances] Pattern ${patternId} not found or inactive`);
      return;
    }

    // 2. Calculate generation window
    const now = new Date();
    const windowEnd = new Date();
    windowEnd.setDate(windowEnd.getDate() + windowDays);

    console.log(`[generateRecurringDeadlineInstances] Pattern ${patternId}:`, {
      recurrenceType: pattern.recurrenceType,
      windowDays,
      now: now.toISOString().split('T')[0],
      windowEnd: windowEnd.toISOString().split('T')[0],
    });

    // If includePast is true, also generate backward from today
    let windowStart: Date | null = null;
    if (options.includePast) {
      windowStart = new Date();
      windowStart.setDate(windowStart.getDate() - windowDays);
    }

    // 3. Find the last instance date for this pattern
    const lastDeadline = await prisma.deadline.findFirst({
      where: { recurringPatternId: patternId },
      orderBy: { instanceDate: 'desc' },
    });

    // Start generating from the last instance, or from startDate if set, or from today
    let currentDate: Date;
    if (lastDeadline?.instanceDate) {
      currentDate = new Date(lastDeadline.instanceDate);
    } else if (pattern.startDate) {
      currentDate = new Date(pattern.startDate);
    } else {
      // No startDate set - start from today (go back 1 day so moveToNextOccurrence finds today or later)
      currentDate = new Date(now);
      currentDate.setDate(currentDate.getDate() - 1);
    }

    // 4. Calculate interval based on recurrence type and get days of week/month
    let intervalDays: number;
    const daysOfWeek = (pattern.daysOfWeek as number[]) || [];
    const daysOfMonth = (pattern.daysOfMonth as number[]) || [];

    switch (pattern.recurrenceType) {
      case 'weekly':
        intervalDays = 7;
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

    // Helper function to move to next valid occurrence
    const moveToNextOccurrence = (date: Date, recurrenceType: string, daysOfWeek: number[], daysOfMonth: number[]) => {
      const newDate = new Date(date);

      if (recurrenceType === 'weekly' && daysOfWeek.length > 0) {
        let attempts = 0;
        const maxAttempts = 7;
        while (attempts < maxAttempts) {
          newDate.setDate(newDate.getDate() + 1);
          const dayOfWeek = newDate.getDay();
          if (daysOfWeek.includes(dayOfWeek)) {
            return newDate;
          }
          attempts++;
        }
        return newDate;
      } else if (recurrenceType === 'monthly' && daysOfMonth.length > 0) {
        let attempts = 0;
        const maxAttempts = 365;
        while (attempts < maxAttempts) {
          newDate.setDate(newDate.getDate() + 1);
          const dayOfMonth = newDate.getDate();
          if (daysOfMonth.includes(dayOfMonth)) {
            return newDate;
          }
          attempts++;
        }
        return newDate;
      } else {
        newDate.setDate(newDate.getDate() + intervalDays);
        return newDate;
      }
    };

    // Move to next occurrence
    currentDate = moveToNextOccurrence(currentDate, pattern.recurrenceType, daysOfWeek, daysOfMonth);

    // 5. Fetch all existing instances for this pattern (for batch checking)
    const existingInstances = await prisma.deadline.findMany({
      where: { recurringPatternId: patternId },
      select: { instanceDate: true },
    });
    const existingDates = new Set(existingInstances.map(i =>
      typeof i.instanceDate === 'string' ? i.instanceDate : i.instanceDate?.toISOString() || ''
    ));

    // 6. Generate instances until window end or end conditions met
    const template = pattern.deadlineTemplate as any;
    const instances: any[] = [];
    let instanceNumber = pattern.instanceCount;

    while (currentDate <= windowEnd) {
      // Check end conditions
      if (pattern.endDate) {
        const currentDateStr = currentDate.toISOString().split('T')[0];
        const endDateStr = new Date(pattern.endDate).toISOString().split('T')[0];
        if (currentDateStr > endDateStr) {
          break;
        }
      }
      if (pattern.occurrenceCount && instanceNumber >= pattern.occurrenceCount) {
        break;
      }

      // Check if instance already exists (using in-memory set for performance)
      const instanceDateStr = currentDate.toISOString();
      if (!existingDates.has(instanceDateStr)) {
        const dueAt = new Date(currentDate);
        dueAt.setHours(23, 59, 0, 0);

        instances.push({
          userId,
          title: template.title,
          courseId: template.courseId || null,
          notes: template.notes || '',
          links: template.links || [],
          dueAt: dueAt.toISOString(),
          recurringPatternId: patternId,
          instanceDate: instanceDateStr,
          isRecurring: true,
          status: 'open',
        });

        instanceNumber++;
      }

      // Move to next occurrence
      currentDate = moveToNextOccurrence(currentDate, pattern.recurrenceType, daysOfWeek, daysOfMonth);
    }

    // 6. Bulk create instances
    if (instances.length > 0) {
      const firstInstance = instances[0].instanceDate;
      const lastInstance = instances[instances.length - 1].instanceDate;
      console.log(`[generateRecurringDeadlineInstances] Creating ${instances.length} instances for pattern ${patternId}`, {
        firstInstance: new Date(firstInstance).toISOString().split('T')[0],
        lastInstance: new Date(lastInstance).toISOString().split('T')[0],
      });
      await prisma.deadline.createMany({ data: instances });

      // Update pattern tracking
      await prisma.recurringDeadlinePattern.update({
        where: { id: patternId },
        data: {
          lastGenerated: new Date(),
          instanceCount: instanceNumber,
        },
      });
    }
  } catch (error) {
    console.error(`[generateRecurringDeadlineInstances] Error for pattern ${patternId}:`, error);
    throw error;
  }
}

/**
 * Generate instances for all active recurring deadline patterns for a user
 */
export async function generateAllUserRecurringDeadlineInstances(
  userId: string,
  windowDays: number = 60
): Promise<void> {
  try {
    const patterns = await prisma.recurringDeadlinePattern.findMany({
      where: { userId, isActive: true },
    });

    console.log(`[generateAllUserRecurringDeadlineInstances] Generating for ${patterns.length} patterns for user ${userId}`);

    for (const pattern of patterns) {
      await generateRecurringDeadlineInstances({
        patternId: pattern.id,
        userId,
        windowDays,
      });
    }
  } catch (error) {
    console.error(`[generateAllUserRecurringDeadlineInstances] Error for user ${userId}:`, error);
  }
}
