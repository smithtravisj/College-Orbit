import { prisma } from '@/lib/prisma';
import { Achievement, XpStats, GamificationRecordResult } from '@/types';

// XP rewards
const BASE_XP_PER_COMPLETION = 10;

// Level thresholds
const LEVEL_THRESHOLDS = [
  0,    // Level 1
  75,   // Level 2
  175,  // Level 3
  300,  // Level 4
  450,  // Level 5
  625,  // Level 6
  825,  // Level 7
  1050, // Level 8
  1300, // Level 9
  1600, // Level 10
];
const XP_PER_LEVEL_AFTER_10 = 350;

/**
 * Calculate level from total XP
 */
export function calculateLevel(totalXp: number): number {
  // Check predefined thresholds first
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      if (i === LEVEL_THRESHOLDS.length - 1) {
        // Beyond level 10, calculate additional levels
        const xpBeyond10 = totalXp - LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
        const additionalLevels = Math.floor(xpBeyond10 / XP_PER_LEVEL_AFTER_10);
        return LEVEL_THRESHOLDS.length + additionalLevels;
      }
      return i + 1;
    }
  }
  return 1;
}

/**
 * Calculate XP stats for display
 */
export function calculateXpStats(totalXp: number): XpStats {
  const level = calculateLevel(totalXp);

  let currentLevelXp: number;
  let nextLevelXp: number;

  if (level < LEVEL_THRESHOLDS.length) {
    currentLevelXp = LEVEL_THRESHOLDS[level - 1];
    nextLevelXp = LEVEL_THRESHOLDS[level];
  } else {
    // Beyond level 10
    const levelsAfter10 = level - LEVEL_THRESHOLDS.length;
    currentLevelXp = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + (levelsAfter10 * XP_PER_LEVEL_AFTER_10);
    nextLevelXp = currentLevelXp + XP_PER_LEVEL_AFTER_10;
  }

  const xpInCurrentLevel = totalXp - currentLevelXp;
  const xpNeededForNextLevel = nextLevelXp - currentLevelXp;
  const progress = Math.min(100, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100));

  return {
    total: totalXp,
    level,
    currentLevelXp: xpInCurrentLevel,
    nextLevelXp: xpNeededForNextLevel,
    progress,
  };
}

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
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Check if streak should be broken based on weekday-focused logic
 * - Mon-Fri are "required" days - missing a weekday breaks your streak
 * - Sat-Sun are "bonus" days - activity adds to streak, inactivity doesn't break it
 */
function shouldBreakStreak(lastActivityDate: Date | null, today: Date): boolean {
  if (!lastActivityDate) return false; // No previous activity, start fresh

  const lastActivity = getUtcDateOnly(lastActivityDate);
  const todayDate = getUtcDateOnly(today);

  // If last activity was today, streak is fine
  if (lastActivity.getTime() === todayDate.getTime()) {
    return false;
  }

  // If last activity was yesterday, streak is fine
  const yesterday = new Date(todayDate);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  if (lastActivity.getTime() === yesterday.getTime()) {
    return false;
  }

  // Count how many weekdays were missed between last activity and today
  // If any weekday was missed, the streak is broken
  const dayAfterLastActivity = new Date(lastActivity);
  dayAfterLastActivity.setUTCDate(dayAfterLastActivity.getUTCDate() + 1);

  let checkDate = new Date(dayAfterLastActivity);
  while (checkDate < todayDate) {
    if (!isWeekend(checkDate)) {
      // Found a weekday that was missed - streak is broken
      return true;
    }
    checkDate.setUTCDate(checkDate.getUTCDate() + 1);
  }

  // No weekdays were missed between last activity and today
  // (only weekends in between, or today is the day after last activity)
  return false;
}

/**
 * Process a task completion and update gamification data
 * @param itemType - Type of item: "task", "deadline", "exam", "workItem"
 * @param itemId - The unique ID of the item being completed
 */
export async function processTaskCompletion(
  userId: string,
  timezoneOffset: number = 0,
  itemType: string = 'task',
  itemId?: string
): Promise<GamificationRecordResult> {
  // Check if this item has already been credited (prevent toggle exploit)
  if (itemId) {
    const existingCredit = await prisma.gamificationCredit.findUnique({
      where: {
        userId_itemType_itemId: {
          userId,
          itemType,
          itemId,
        },
      },
    });

    if (existingCredit) {
      // Already credited, return zero XP result
      const userStreak = await prisma.userStreak.findUnique({
        where: { userId },
      });
      return {
        xpEarned: 0,
        newAchievements: [],
        levelUp: false,
        previousLevel: userStreak?.level || 1,
        newLevel: userStreak?.level || 1,
        streakUpdated: false,
        newStreak: userStreak?.currentStreak || 0,
      };
    }
  }

  // Get or create user streak record
  let userStreak = await prisma.userStreak.findUnique({
    where: { userId },
  });

  if (!userStreak) {
    userStreak = await prisma.userStreak.create({
      data: { userId },
    });
  }

  // If vacation mode is enabled, only award XP but don't affect streak
  if (userStreak.vacationMode) {
    const xpEarned = BASE_XP_PER_COMPLETION;
    const previousLevel = userStreak.level;
    const newTotalXp = userStreak.totalXp + xpEarned;
    const newLevel = calculateLevel(newTotalXp);

    // Calculate local hour for time-based achievements
    const now = new Date();
    const userLocalTime = new Date(now.getTime() - timezoneOffset * 60000);
    const localHour = userLocalTime.getUTCHours();
    const isEarlyBird = localHour < 8;
    const isNightOwl = localHour >= 23;

    const updatedStreak = await prisma.userStreak.update({
      where: { userId },
      data: {
        totalXp: newTotalXp,
        totalTasksCompleted: userStreak.totalTasksCompleted + 1,
        level: newLevel,
        ...(isEarlyBird && { earlyBirdCount: { increment: 1 } }),
        ...(isNightOwl && { nightOwlCount: { increment: 1 } }),
      },
    });

    // Record the credit to prevent future exploits
    if (itemId) {
      await prisma.gamificationCredit.create({
        data: {
          userId,
          itemType,
          itemId,
          xpAwarded: xpEarned,
        },
      });
    }

    // Update daily activity (for friends leaderboard)
    const today = getUtcDateOnly(userLocalTime);

    await prisma.dailyActivity.upsert({
      where: {
        userId_activityDate: {
          userId,
          activityDate: today,
        },
      },
      update: {
        tasksCompleted: { increment: 1 },
        xpEarned: { increment: xpEarned },
      },
      create: {
        userId,
        activityDate: today,
        tasksCompleted: 1,
        xpEarned,
      },
    });

    // Update monthly XP total for college leaderboard (even in vacation mode)
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
          totalXp: { increment: xpEarned },
        },
        create: {
          userId,
          collegeId: user.collegeId,
          yearMonth,
          totalXp: xpEarned,
        },
      });
    }

    // Check for achievements (excluding streak-based ones)
    const newAchievements = await checkAchievements(userId, {
      totalTasks: userStreak.totalTasksCompleted + 1,
      currentStreak: userStreak.currentStreak,
      earlyBirdCount: updatedStreak.earlyBirdCount,
      nightOwlCount: updatedStreak.nightOwlCount,
    }, today);

    return {
      xpEarned,
      newAchievements,
      levelUp: newLevel > previousLevel,
      previousLevel,
      newLevel,
      streakUpdated: false,
      newStreak: userStreak.currentStreak,
    };
  }

  // Calculate today's date (adjusted for user's timezone)
  const now = new Date();
  const userLocalTime = new Date(now.getTime() - timezoneOffset * 60000);
  const today = getUtcDateOnly(userLocalTime);

  // Check if streak should be broken
  const streakBroken = shouldBreakStreak(userStreak.lastActivityDate, userLocalTime);

  let newStreak = userStreak.currentStreak;
  let streakStartDate = userStreak.streakStartDate;

  if (streakBroken) {
    // Start new streak
    newStreak = 1;
    streakStartDate = today;
  } else if (!userStreak.lastActivityDate ||
             getUtcDateOnly(userStreak.lastActivityDate).getTime() !== today.getTime()) {
    // Increment streak if this is the first completion today
    newStreak = userStreak.currentStreak + 1;
    if (!streakStartDate) {
      streakStartDate = today;
    }
  }
  // If already completed today, streak stays the same

  const longestStreak = Math.max(userStreak.longestStreak, newStreak);

  // Calculate XP (flat rate, no streak bonus)
  const xpEarned = BASE_XP_PER_COMPLETION;
  const previousLevel = userStreak.level;
  const newTotalXp = userStreak.totalXp + xpEarned;
  const newLevel = calculateLevel(newTotalXp);

  // Calculate local hour for time-based achievements
  const localHour = userLocalTime.getUTCHours();
  const isEarlyBird = localHour < 8;
  const isNightOwl = localHour >= 23;

  // Update user streak with early bird / night owl counts
  const updatedStreak = await prisma.userStreak.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak,
      lastActivityDate: today,
      streakStartDate,
      totalTasksCompleted: userStreak.totalTasksCompleted + 1,
      totalXp: newTotalXp,
      level: newLevel,
      ...(isEarlyBird && { earlyBirdCount: { increment: 1 } }),
      ...(isNightOwl && { nightOwlCount: { increment: 1 } }),
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
      tasksCompleted: { increment: 1 },
      xpEarned: { increment: xpEarned },
    },
    create: {
      userId,
      activityDate: today,
      tasksCompleted: 1,
      xpEarned,
    },
  });

  // Update monthly XP total for college leaderboard
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { collegeId: true },
  });

  if (user?.collegeId) {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await prisma.monthlyXpTotal.upsert({
      where: {
        userId_yearMonth: {
          userId,
          yearMonth,
        },
      },
      update: {
        totalXp: { increment: xpEarned },
      },
      create: {
        userId,
        collegeId: user.collegeId,
        yearMonth,
        totalXp: xpEarned,
      },
    });
  }

  // Record the credit to prevent future exploits
  if (itemId) {
    await prisma.gamificationCredit.create({
      data: {
        userId,
        itemType,
        itemId,
        xpAwarded: xpEarned,
      },
    });
  }

  // Check for new achievements
  const newAchievements = await checkAchievements(userId, {
    totalTasks: userStreak.totalTasksCompleted + 1,
    currentStreak: newStreak,
    earlyBirdCount: updatedStreak.earlyBirdCount,
    nightOwlCount: updatedStreak.nightOwlCount,
  }, today);

  return {
    xpEarned,
    newAchievements,
    levelUp: newLevel > previousLevel,
    previousLevel,
    newLevel,
    streakUpdated: newStreak !== userStreak.currentStreak,
    newStreak,
  };
}

/**
 * Check and award new achievements
 */
async function checkAchievements(
  userId: string,
  stats: {
    totalTasks: number;
    currentStreak: number;
    earlyBirdCount: number;
    nightOwlCount: number;
  },
  activityDate: Date
): Promise<Achievement[]> {
  // Get all achievements and user's existing achievements
  const [allAchievements, existingAchievements] = await Promise.all([
    prisma.achievement.findMany(),
    prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    }),
  ]);

  const existingIds = new Set(existingAchievements.map(a => a.achievementId));
  const newlyEarned: Achievement[] = [];

  for (const achievement of allAchievements) {
    if (existingIds.has(achievement.id)) continue;

    const req = achievement.requirement as { type: string; value: number };
    let earned = false;

    switch (req.type) {
      case 'streak':
        earned = stats.currentStreak >= req.value;
        break;
      case 'tasks':
        earned = stats.totalTasks >= req.value;
        break;
      case 'early_bird':
        // Count of completions before 8 AM
        earned = stats.earlyBirdCount >= req.value;
        break;
      case 'night_owl':
        // Count of completions after 11 PM
        earned = stats.nightOwlCount >= req.value;
        break;
    }

    if (earned) {
      // Award achievement
      await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
        },
      });

      // Award XP for achievement
      await prisma.userStreak.update({
        where: { userId },
        data: {
          totalXp: { increment: achievement.xpReward },
        },
      });

      // Also update DailyActivity so achievement XP shows in leaderboard
      await prisma.dailyActivity.upsert({
        where: {
          userId_activityDate: {
            userId,
            activityDate,
          },
        },
        update: {
          xpEarned: { increment: achievement.xpReward },
        },
        create: {
          userId,
          activityDate,
          tasksCompleted: 0,
          xpEarned: achievement.xpReward,
        },
      });

      // Update monthly XP total for college leaderboard
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { collegeId: true },
      });

      if (user?.collegeId) {
        const now = new Date();
        const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        await prisma.monthlyXpTotal.upsert({
          where: {
            userId_yearMonth: {
              userId,
              yearMonth,
            },
          },
          update: {
            totalXp: { increment: achievement.xpReward },
          },
          create: {
            userId,
            collegeId: user.collegeId,
            yearMonth,
            totalXp: achievement.xpReward,
          },
        });
      }

      newlyEarned.push({
        id: achievement.id,
        key: achievement.key,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category as Achievement['category'],
        xpReward: achievement.xpReward,
        tier: achievement.tier as Achievement['tier'],
        requirement: req as Achievement['requirement'],
        isSecret: achievement.isSecret,
        earnedAt: new Date().toISOString(),
      });
    }
  }

  return newlyEarned;
}

/**
 * Get user's gamification data
 * @param userId - The user's ID
 * @param timezoneOffset - The user's timezone offset in minutes (from getTimezoneOffset())
 */
export async function getUserGamificationData(userId: string, timezoneOffset: number = 0) {
  // Get or create user streak
  let userStreak = await prisma.userStreak.findUnique({
    where: { userId },
  });

  if (!userStreak) {
    userStreak = await prisma.userStreak.create({
      data: { userId },
    });
  }

  // Check if streak should be broken based on last activity
  // This ensures the displayed streak is accurate even if the user hasn't completed any tasks
  // Use the user's local time for accurate date comparison
  const now = new Date();
  const userLocalTime = new Date(now.getTime() - timezoneOffset * 60000);
  const streakBroken = !userStreak.vacationMode && shouldBreakStreak(userStreak.lastActivityDate, userLocalTime);

  if (streakBroken && userStreak.currentStreak > 0) {
    // Update the database to reset the streak
    userStreak = await prisma.userStreak.update({
      where: { userId },
      data: {
        currentStreak: 0,
        streakStartDate: null,
      },
    });
  }

  // Get all achievements and user's earned ones
  const [allAchievements, userAchievements, recentActivity] = await Promise.all([
    prisma.achievement.findMany({
      orderBy: [{ category: 'asc' }, { xpReward: 'asc' }],
    }),
    prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    }),
    prisma.dailyActivity.findMany({
      where: { userId },
      orderBy: { activityDate: 'desc' },
      take: 7,
    }),
  ]);

  const earnedMap = new Map(userAchievements.map(ua => [ua.achievementId, ua.earnedAt]));

  // Map achievements with earned status
  const achievements: Achievement[] = allAchievements.map(a => ({
    id: a.id,
    key: a.key,
    name: a.name,
    description: a.description,
    icon: a.icon,
    category: a.category as Achievement['category'],
    xpReward: a.xpReward,
    tier: a.tier as Achievement['tier'],
    requirement: a.requirement as Achievement['requirement'],
    isSecret: a.isSecret,
    earnedAt: earnedMap.get(a.id)?.toISOString() || null,
  }));

  const unlockedAchievements = achievements.filter(a => a.earnedAt);

  return {
    streak: {
      id: userStreak.id,
      currentStreak: userStreak.currentStreak,
      longestStreak: userStreak.longestStreak,
      lastActivityDate: userStreak.lastActivityDate?.toISOString() || null,
      streakStartDate: userStreak.streakStartDate?.toISOString() || null,
      totalTasksCompleted: userStreak.totalTasksCompleted,
      totalXp: userStreak.totalXp,
      level: userStreak.level,
      vacationMode: userStreak.vacationMode,
      vacationStartedAt: userStreak.vacationStartedAt?.toISOString() || null,
    },
    xp: calculateXpStats(userStreak.totalXp),
    achievements,
    unlockedAchievements,
    recentActivity: recentActivity.map(a => ({
      date: a.activityDate.toISOString().split('T')[0],
      tasksCompleted: a.tasksCompleted,
      xpEarned: a.xpEarned,
    })),
  };
}

/**
 * Toggle vacation mode for a user
 */
export async function toggleVacationMode(userId: string, enabled: boolean) {
  const userStreak = await prisma.userStreak.findUnique({
    where: { userId },
  });

  if (!userStreak) {
    return prisma.userStreak.create({
      data: {
        userId,
        vacationMode: enabled,
        vacationStartedAt: enabled ? new Date() : null,
      },
    });
  }

  return prisma.userStreak.update({
    where: { userId },
    data: {
      vacationMode: enabled,
      vacationStartedAt: enabled ? new Date() : null,
    },
  });
}
