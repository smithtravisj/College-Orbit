import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

/**
 * Get UTC date only (midnight)
 */
function getUtcDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Calculate streak from activity dates
 * Rules:
 * - Weekdays are required - missing a weekday breaks the streak
 * - Weekends are optional - can skip them without breaking streak
 */
function calculateStreakFromActivities(activityDates: Date[], today: Date): {
  currentStreak: number;
  lastActivityDate: Date | null;
  streakStartDate: Date | null;
} {
  if (activityDates.length === 0) {
    return { currentStreak: 0, lastActivityDate: null, streakStartDate: null };
  }

  // Sort dates in descending order (most recent first)
  const sortedDates = activityDates
    .map(d => getUtcDateOnly(d))
    .sort((a, b) => b.getTime() - a.getTime());

  const todayDate = getUtcDateOnly(today);
  const yesterday = new Date(todayDate);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  // Check if the most recent activity was today or yesterday
  const lastActivity = sortedDates[0];
  const lastActivityIsRecent =
    lastActivity.getTime() === todayDate.getTime() ||
    lastActivity.getTime() === yesterday.getTime();

  if (!lastActivityIsRecent) {
    // Check if only weekends were missed between last activity and today
    let checkDate = new Date(lastActivity);
    checkDate.setUTCDate(checkDate.getUTCDate() + 1);

    let weekdayMissed = false;
    while (checkDate < todayDate) {
      if (!isWeekend(checkDate)) {
        weekdayMissed = true;
        break;
      }
      checkDate.setUTCDate(checkDate.getUTCDate() + 1);
    }

    if (weekdayMissed) {
      // Streak is broken - but we still count from the last activity
      return { currentStreak: 0, lastActivityDate: lastActivity, streakStartDate: null };
    }
  }

  // Count consecutive days going backwards
  let streak = 1;
  let streakStartDate = lastActivity;
  const activitySet = new Set(sortedDates.map(d => d.getTime()));

  let currentDate = new Date(lastActivity);
  currentDate.setUTCDate(currentDate.getUTCDate() - 1);

  while (true) {
    const hasActivity = activitySet.has(currentDate.getTime());
    const weekend = isWeekend(currentDate);

    if (hasActivity) {
      streak++;
      streakStartDate = new Date(currentDate);
      currentDate.setUTCDate(currentDate.getUTCDate() - 1);
    } else if (weekend) {
      // Weekend with no activity is OK, just skip it
      currentDate.setUTCDate(currentDate.getUTCDate() - 1);
    } else {
      // Weekday with no activity - streak ends here
      break;
    }

    // Safety check to prevent infinite loop (go back max 365 days)
    if (todayDate.getTime() - currentDate.getTime() > 365 * 24 * 60 * 60 * 1000) {
      break;
    }
  }

  return {
    currentStreak: streak,
    lastActivityDate: lastActivity,
    streakStartDate,
  };
}

async function fixStreaks() {
  console.log('Starting streak fix...\n');

  // Get ALL users who have any daily activity (not just those with UserStreak records)
  const usersWithActivity = await prisma.dailyActivity.findMany({
    select: { userId: true },
    distinct: ['userId'],
  });

  console.log(`Found ${usersWithActivity.length} users with activity records\n`);

  const today = new Date();
  let fixedCount = 0;

  for (const { userId } of usersWithActivity) {
    // Get or create user streak record
    let userStreak = await prisma.userStreak.findUnique({
      where: { userId },
    });

    if (!userStreak) {
      userStreak = await prisma.userStreak.create({
        data: { userId },
      });
      console.log(`Created UserStreak record for ${userId}`);
    }

    // Get all daily activity for this user
    const activities = await prisma.dailyActivity.findMany({
      where: { userId },
      select: { activityDate: true },
      orderBy: { activityDate: 'desc' },
    });

    if (activities.length === 0) {
      continue;
    }

    const activityDates = activities.map(a => a.activityDate);
    const calculated = calculateStreakFromActivities(activityDates, today);

    const oldStreak = userStreak.currentStreak;
    const newStreak = calculated.currentStreak;
    const newLongest = Math.max(userStreak.longestStreak, newStreak);

    if (oldStreak !== newStreak) {
      console.log(`User ${userId}:`);
      console.log(`  Old streak: ${oldStreak}`);
      console.log(`  New streak: ${newStreak}`);
      console.log(`  Activity dates: ${activityDates.slice(0, 5).map(d => d.toISOString().split('T')[0]).join(', ')}${activityDates.length > 5 ? '...' : ''}`);
      console.log(`  Streak start: ${calculated.streakStartDate?.toISOString().split('T')[0] || 'null'}`);
      console.log('');

      await prisma.userStreak.update({
        where: { userId },
        data: {
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastActivityDate: calculated.lastActivityDate,
          streakStartDate: calculated.streakStartDate,
        },
      });

      fixedCount++;
    }
  }

  console.log(`\nDone! Fixed ${fixedCount} streak(s).`);
}

fixStreaks()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
