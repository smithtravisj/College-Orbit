import { prisma } from '@/lib/prisma';

export interface GenerateWorkInstancesOptions {
  patternId: string;
  userId: string;
  windowDays?: number;
  includePast?: boolean; // Generate instances going backward from today
}

/**
 * Generate recurring work item instances for a specific pattern
 * Generates instances for the next N days (default 60 days)
 */
export async function generateRecurringWorkInstances(options: GenerateWorkInstancesOptions): Promise<void> {
  const { patternId, userId, windowDays = 60 } = options;

  try {
    // 1. Fetch the pattern
    const pattern = await prisma.recurringWorkPattern.findFirst({
      where: { id: patternId, userId, isActive: true },
    });

    if (!pattern) {
      console.log(`[generateRecurringWorkInstances] Pattern ${patternId} not found or inactive`);
      return;
    }

    // 2. Calculate generation window
    const now = new Date();
    const windowEnd = new Date();
    windowEnd.setDate(windowEnd.getDate() + windowDays);

    // If includePast is true, also generate backward from today
    let windowStart: Date | null = null;
    if (options.includePast) {
      windowStart = new Date();
      windowStart.setDate(windowStart.getDate() - windowDays); // Go backward N days
    }

    // 3. Find the last instance date for this pattern
    const lastItem = await prisma.workItem.findFirst({
      where: { recurringPatternId: patternId },
      orderBy: { instanceDate: 'desc' },
    });

    // Start generating from the last instance, or from startDate if set, or from today
    let currentDate: Date;
    if (lastItem?.instanceDate) {
      currentDate = new Date(lastItem.instanceDate);
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

    // Helper function to move to next valid occurrence
    const moveToNextOccurrence = (date: Date, recurrenceType: string, daysOfWeek: number[], daysOfMonth: number[]) => {
      const newDate = new Date(date);

      if (recurrenceType === 'weekly' && daysOfWeek.length > 0) {
        // Find next day that matches selected days of week (every 7 days)
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
        // Fallback: move 7 days forward
        newDate.setDate(date.getDate() + 7);
      } else if (recurrenceType === 'monthly' && daysOfMonth.length > 0) {
        // Find next day of month that matches
        let found = false;
        // Check remaining days in current month
        const currentDay = newDate.getDate();
        for (const dom of daysOfMonth.sort((a, b) => a - b)) {
          if (dom > currentDay) {
            newDate.setDate(dom);
            found = true;
            break;
          }
        }
        if (!found) {
          // Move to first matching day in next month
          newDate.setMonth(newDate.getMonth() + 1);
          newDate.setDate(Math.min(daysOfMonth[0], getDaysInMonth(newDate)));
        }
      } else {
        // Simple interval-based
        newDate.setDate(newDate.getDate() + intervalDays);
      }

      return newDate;
    };

    // 5. Generate instances until we hit the end condition
    let instanceCount = pattern.instanceCount;
    let generatedCount = 0;
    const maxIterations = 1000; // Safety limit
    let iterations = 0;

    const template = pattern.workItemTemplate as any;

    while (iterations < maxIterations) {
      iterations++;

      // Move to next occurrence
      currentDate = moveToNextOccurrence(currentDate, pattern.recurrenceType, daysOfWeek, daysOfMonth);

      // Check end conditions
      if (pattern.endDate && currentDate > new Date(pattern.endDate)) {
        console.log(`[generateRecurringWorkInstances] Reached end date for pattern ${patternId}`);
        break;
      }

      if (pattern.occurrenceCount !== null && instanceCount >= pattern.occurrenceCount) {
        console.log(`[generateRecurringWorkInstances] Reached occurrence count for pattern ${patternId}`);
        break;
      }

      if (currentDate > windowEnd) {
        console.log(`[generateRecurringWorkInstances] Reached window end for pattern ${patternId}`);
        break;
      }

      // Check if instance already exists
      const existingItem = await prisma.workItem.findFirst({
        where: {
          recurringPatternId: patternId,
          instanceDate: {
            gte: new Date(currentDate.setHours(0, 0, 0, 0)),
            lt: new Date(currentDate.setHours(23, 59, 59, 999)),
          },
        },
      });

      if (existingItem) {
        continue; // Skip if instance already exists
      }

      // Parse the time from template
      const dueTime = template.dueTime || '23:59';
      const [hours, minutes] = dueTime.split(':').map(Number);
      const dueAt = new Date(currentDate);
      dueAt.setHours(hours || 23, minutes || 59, 0, 0);

      // Create the work item instance
      await prisma.workItem.create({
        data: {
          userId,
          title: template.title,
          type: template.type || 'task',
          courseId: template.courseId || null,
          dueAt,
          priority: template.priority || null,
          effort: template.effort || null,
          pinned: template.pinned || false,
          checklist: template.checklist || [],
          notes: template.notes || '',
          tags: template.tags || [],
          links: template.links || [],
          files: template.files || [],
          status: 'open',
          workingOn: false,
          isRecurring: true,
          recurringPatternId: patternId,
          instanceDate: dueAt,
        },
      });

      instanceCount++;
      generatedCount++;
    }

    // Update pattern with new instance count and last generated time
    if (generatedCount > 0) {
      await prisma.recurringWorkPattern.update({
        where: { id: patternId },
        data: {
          instanceCount,
          lastGenerated: new Date(),
        },
      });

      console.log(`[generateRecurringWorkInstances] Generated ${generatedCount} instances for pattern ${patternId}`);
    }
  } catch (error) {
    console.error(`[generateRecurringWorkInstances] Error for pattern ${patternId}:`, error);
    throw error;
  }
}

/**
 * Generate recurring work item instances for all active patterns of a user
 */
export async function generateAllUserRecurringWorkInstances(userId: string, windowDays: number = 60): Promise<void> {
  try {
    const patterns = await prisma.recurringWorkPattern.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    console.log(`[generateAllUserRecurringWorkInstances] Found ${patterns.length} active patterns for user ${userId}`);

    for (const pattern of patterns) {
      try {
        await generateRecurringWorkInstances({
          patternId: pattern.id,
          userId,
          windowDays,
        });
      } catch (error) {
        console.error(
          `[generateAllUserRecurringWorkInstances] Error generating instances for pattern ${pattern.id}:`,
          error
        );
        // Continue with other patterns
      }
    }
  } catch (error) {
    console.error(`[generateAllUserRecurringWorkInstances] Error for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Helper function to get days in a month
 */
function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}
