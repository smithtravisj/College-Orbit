import { prisma } from '@/lib/prisma';
import { calculateLevel } from '@/lib/gamification';

const FLASHCARD_XP = 1; // 1 XP per flashcard review

/**
 * Get the start of day in UTC for a given date
 */
function getUtcDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

/**
 * Check if streak should be broken based on weekday-focused logic
 */
function shouldBreakStreak(lastActivityDate: Date | null, today: Date): boolean {
  if (!lastActivityDate) return false;

  const lastActivity = getUtcDateOnly(lastActivityDate);
  const todayDate = getUtcDateOnly(today);

  if (lastActivity.getTime() === todayDate.getTime()) {
    return false;
  }

  const yesterday = new Date(todayDate);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  if (lastActivity.getTime() === yesterday.getTime()) {
    return false;
  }

  const dayAfterLastActivity = new Date(lastActivity);
  dayAfterLastActivity.setUTCDate(dayAfterLastActivity.getUTCDate() + 1);

  let checkDate = new Date(dayAfterLastActivity);
  while (checkDate < todayDate) {
    if (!isWeekend(checkDate)) {
      return true;
    }
    checkDate.setUTCDate(checkDate.getUTCDate() + 1);
  }

  return false;
}

export interface FlashcardReviewResult {
  xpEarned: number;
  streakUpdated: boolean;
  newStreak: number;
  alreadyCredited: boolean;
  levelUp: boolean;
  newLevel: number;
}

/**
 * Process a flashcard review and award XP
 * Awards 1 XP per card review and updates the user's streak
 */
export async function processFlashcardReview(
  userId: string,
  timezoneOffset: number = 0,
  cardId: string
): Promise<FlashcardReviewResult> {
  // Check if this card has already been credited today (prevent exploit)
  const existingCredit = await prisma.gamificationCredit.findUnique({
    where: {
      userId_itemType_itemId: {
        userId,
        itemType: 'flashcard',
        itemId: cardId,
      },
    },
  });

  // Get or create user streak record
  let userStreak = await prisma.userStreak.findUnique({
    where: { userId },
  });

  if (!userStreak) {
    userStreak = await prisma.userStreak.create({
      data: { userId },
    });
  }

  // If already credited, still return the current streak but no XP
  if (existingCredit) {
    const currentLevel = calculateLevel(userStreak.totalXp);
    return {
      xpEarned: 0,
      streakUpdated: false,
      newStreak: userStreak.currentStreak,
      alreadyCredited: true,
      levelUp: false,
      newLevel: currentLevel,
    };
  }

  // Calculate today's date (adjusted for user's timezone)
  const now = new Date();
  const userLocalTime = new Date(now.getTime() - timezoneOffset * 60000);
  const today = getUtcDateOnly(userLocalTime);

  // If vacation mode is enabled, only award XP but don't affect streak
  if (userStreak.vacationMode) {
    const previousLevel = calculateLevel(userStreak.totalXp);
    const newTotalXp = userStreak.totalXp + FLASHCARD_XP;
    const newLevel = calculateLevel(newTotalXp);

    await prisma.userStreak.update({
      where: { userId },
      data: {
        totalXp: newTotalXp,
      },
    });

    // Record the credit
    await prisma.gamificationCredit.create({
      data: {
        userId,
        itemType: 'flashcard',
        itemId: cardId,
        xpAwarded: FLASHCARD_XP,
      },
    });

    // Update daily activity
    await prisma.dailyActivity.upsert({
      where: {
        userId_activityDate: {
          userId,
          activityDate: today,
        },
      },
      update: {
        xpEarned: { increment: FLASHCARD_XP },
      },
      create: {
        userId,
        activityDate: today,
        tasksCompleted: 0,
        xpEarned: FLASHCARD_XP,
      },
    });

    // Update monthly XP total for college leaderboard
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { collegeId: true },
    });

    if (user?.collegeId) {
      const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      await prisma.monthlyXpTotal.upsert({
        where: {
          userId_yearMonth: {
            userId,
            yearMonth,
          },
        },
        update: {
          totalXp: { increment: FLASHCARD_XP },
        },
        create: {
          userId,
          collegeId: user.collegeId,
          yearMonth,
          totalXp: FLASHCARD_XP,
        },
      });
    }

    return {
      xpEarned: FLASHCARD_XP,
      streakUpdated: false,
      newStreak: userStreak.currentStreak,
      alreadyCredited: false,
      levelUp: newLevel > previousLevel,
      newLevel,
    };
  }

  // Check if streak should be broken
  const streakBroken = shouldBreakStreak(userStreak.lastActivityDate, userLocalTime);

  let newStreak = userStreak.currentStreak;
  let streakStartDate = userStreak.streakStartDate;
  let streakUpdated = false;

  if (streakBroken) {
    newStreak = 1;
    streakStartDate = today;
    streakUpdated = true;
  } else if (!userStreak.lastActivityDate ||
             getUtcDateOnly(userStreak.lastActivityDate).getTime() !== today.getTime()) {
    newStreak = userStreak.currentStreak + 1;
    if (!streakStartDate) {
      streakStartDate = today;
    }
    streakUpdated = true;
  }

  const longestStreak = Math.max(userStreak.longestStreak, newStreak);
  const previousLevel = calculateLevel(userStreak.totalXp);
  const newTotalXp = userStreak.totalXp + FLASHCARD_XP;
  const newLevel = calculateLevel(newTotalXp);

  // Update user streak
  await prisma.userStreak.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak,
      lastActivityDate: today,
      streakStartDate,
      totalXp: newTotalXp,
    },
  });

  // Record the credit
  await prisma.gamificationCredit.create({
    data: {
      userId,
      itemType: 'flashcard',
      itemId: cardId,
      xpAwarded: FLASHCARD_XP,
    },
  });

  // Update daily activity
  await prisma.dailyActivity.upsert({
    where: {
      userId_activityDate: {
        userId,
        activityDate: today,
      },
    },
    update: {
      xpEarned: { increment: FLASHCARD_XP },
    },
    create: {
      userId,
      activityDate: today,
      tasksCompleted: 0,
      xpEarned: FLASHCARD_XP,
    },
  });

  // Update monthly XP total for college leaderboard
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { collegeId: true },
  });

  if (user?.collegeId) {
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await prisma.monthlyXpTotal.upsert({
      where: {
        userId_yearMonth: {
          userId,
          yearMonth,
        },
      },
      update: {
        totalXp: { increment: FLASHCARD_XP },
      },
      create: {
        userId,
        collegeId: user.collegeId,
        yearMonth,
        totalXp: FLASHCARD_XP,
      },
    });
  }

  return {
    xpEarned: FLASHCARD_XP,
    streakUpdated,
    newStreak,
    alreadyCredited: false,
    levelUp: newLevel > previousLevel,
    newLevel,
  };
}
