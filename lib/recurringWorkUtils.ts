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
  const { patternId, userId, windowDays = 180 } = options;

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
    let includeCurrentDate = false;
    if (lastItem?.instanceDate) {
      currentDate = new Date(lastItem.instanceDate);
      console.log(`[DEBUG] Using lastItem.instanceDate: ${lastItem.instanceDate} → currentDate: ${currentDate.toISOString()}`);
    } else if (pattern.startDate) {
      // Use UTC methods to avoid timezone shift (UTC midnight becomes previous day in US timezones)
      const sd = new Date(pattern.startDate);
      console.log(`[DEBUG] pattern.startDate raw: ${pattern.startDate}`);
      console.log(`[DEBUG] parsed sd: ${sd.toISOString()}`);
      console.log(`[DEBUG] sd.getUTCFullYear()=${sd.getUTCFullYear()} sd.getUTCMonth()=${sd.getUTCMonth()} sd.getUTCDate()=${sd.getUTCDate()}`);
      console.log(`[DEBUG] sd.getFullYear()=${sd.getFullYear()} sd.getMonth()=${sd.getMonth()} sd.getDate()=${sd.getDate()}`);
      currentDate = new Date(sd.getUTCFullYear(), sd.getUTCMonth(), sd.getUTCDate(), 12, 0, 0);
      console.log(`[DEBUG] computed currentDate: ${currentDate.toISOString()}`);
      includeCurrentDate = true;
    } else {
      // No startDate set - start from today
      currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
      console.log(`[DEBUG] No startDate, using today: ${currentDate.toISOString()}`);
      includeCurrentDate = true;
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

    // 5. Fetch all existing instances upfront for batch checking
    const existingInstances = await prisma.workItem.findMany({
      where: { recurringPatternId: patternId },
      select: { instanceDate: true },
    });
    const existingDates = new Set(
      existingInstances.map((i) => {
        if (!i.instanceDate) return '';
        const d = new Date(i.instanceDate);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })
    );

    // 6. Generate instances until we hit the end condition
    let instanceCount = pattern.instanceCount;
    const maxIterations = 1000; // Safety limit
    let iterations = 0;
    let needsAdvance = !includeCurrentDate;

    const template = pattern.workItemTemplate as any;
    const instances: any[] = [];

    // For includeCurrentDate with weekly recurrence, verify the start date matches a selected day
    if (includeCurrentDate && pattern.recurrenceType === 'weekly' && daysOfWeek.length > 0) {
      if (!daysOfWeek.includes(currentDate.getDay())) {
        console.log(`[DEBUG] currentDate day ${currentDate.getDay()} not in daysOfWeek ${JSON.stringify(daysOfWeek)}, advancing`);
        needsAdvance = true;
      }
    }
    if (includeCurrentDate && pattern.recurrenceType === 'monthly' && daysOfMonth.length > 0) {
      if (!daysOfMonth.includes(currentDate.getDate())) {
        needsAdvance = true;
      }
    }

    console.log(`[DEBUG] recurrenceType=${pattern.recurrenceType} includeCurrentDate=${includeCurrentDate} needsAdvance=${needsAdvance} intervalDays=${intervalDays}`);
    console.log(`[DEBUG] daysOfWeek=${JSON.stringify(daysOfWeek)} currentDate.getDay()=${currentDate.getDay()}`);

    while (iterations < maxIterations) {
      iterations++;

      if (needsAdvance) {
        currentDate = moveToNextOccurrence(currentDate, pattern.recurrenceType, daysOfWeek, daysOfMonth);
      }
      needsAdvance = true;

      // Check end conditions
      if (pattern.endDate) {
        const ed = new Date(pattern.endDate);
        const endLocal = new Date(ed.getUTCFullYear(), ed.getUTCMonth(), ed.getUTCDate(), 23, 59, 59);
        if (currentDate > endLocal) {
          break;
        }
      }

      if (pattern.occurrenceCount !== null && instanceCount >= pattern.occurrenceCount) {
        break;
      }

      if (currentDate > windowEnd) {
        break;
      }

      // Check if instance already exists (using in-memory set)
      const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      if (existingDates.has(dateKey)) {
        continue;
      }

      // Parse the time from template
      const dueTime = template.dueTime || '23:59';
      const [hours, minutes] = dueTime.split(':').map(Number);
      const dueAt = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
        hours || 23,
        minutes || 59,
        0,
        0
      );

      if (instances.length < 3) {
        console.log(`[DEBUG] Creating instance #${instances.length + 1}: dueAt=${dueAt.toISOString()} currentDate=${currentDate.toISOString()}`);
      }

      instances.push({
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
      });

      existingDates.add(dateKey);
      instanceCount++;
    }

    // 7. Bulk create instances
    if (instances.length > 0) {
      console.log(`[generateRecurringWorkInstances] Creating ${instances.length} instances for pattern ${patternId}`);
      await prisma.workItem.createMany({ data: instances });

      // Update pattern with new instance count and last generated time
      await prisma.recurringWorkPattern.update({
        where: { id: patternId },
        data: {
          instanceCount,
          lastGenerated: new Date(),
        },
      });
    }
  } catch (error) {
    console.error(`[generateRecurringWorkInstances] Error for pattern ${patternId}:`, error);
    throw error;
  }
}

/**
 * Generate recurring work item instances for all active patterns of a user
 */
export async function generateAllUserRecurringWorkInstances(userId: string, windowDays: number = 180): Promise<void> {
  try {
    // Only fetch patterns that need regeneration (lastGenerated is null or older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const patterns = await prisma.recurringWorkPattern.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { lastGenerated: { equals: null as unknown as undefined } },
          { lastGenerated: { lt: oneHourAgo } },
        ],
      },
    });

    if (patterns.length === 0) return;

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
