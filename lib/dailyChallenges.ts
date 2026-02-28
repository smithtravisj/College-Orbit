import { prisma } from '@/lib/prisma';
import { DailyChallengeProgress } from '@/types';
import { calculateLevel } from '@/lib/gamification';

// Challenge definition
// `type` controls how progress is computed (what DB records count)
// `category` controls diversity — no two challenges from the same category per day
interface ChallengeDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  targetCount: number;
  xpReward: number;
  type: 'task' | 'flashcard' | 'assignment' | 'xp' | 'any';
  category: string; // Diversity group — max 1 per category per day
}

const CHALLENGE_POOL: ChallengeDefinition[] = [
  // ── Category: tasks (complete tasks specifically) ──
  { id: 'tasks_2', title: 'Double Check', description: 'Complete 2 tasks today', icon: 'check-circle', targetCount: 2, xpReward: 15, type: 'task', category: 'tasks' },
  { id: 'tasks_3', title: 'Task Tackler', description: 'Complete 3 tasks today', icon: 'check-circle', targetCount: 3, xpReward: 15, type: 'task', category: 'tasks' },
  { id: 'tasks_5', title: 'Task Master', description: 'Complete 5 tasks today', icon: 'check-circle', targetCount: 5, xpReward: 15, type: 'task', category: 'tasks' },

  // ── Category: flashcards (study flashcards) ──
  { id: 'flashcards_5', title: 'Flash Five', description: 'Study 5 flashcards today', icon: 'book-open', targetCount: 5, xpReward: 15, type: 'flashcard', category: 'flashcards' },
  { id: 'flashcards_10', title: 'Quick Study', description: 'Study 10 flashcards today', icon: 'book-open', targetCount: 10, xpReward: 15, type: 'flashcard', category: 'flashcards' },
  { id: 'flashcards_20', title: 'Card Shark', description: 'Study 20 flashcards today', icon: 'book-open', targetCount: 20, xpReward: 15, type: 'flashcard', category: 'flashcards' },
  { id: 'flashcards_30', title: 'Study Machine', description: 'Study 30 flashcards today', icon: 'book-open', targetCount: 30, xpReward: 15, type: 'flashcard', category: 'flashcards' },

  // ── Category: assignments (finish assignments/deadlines) ──
  { id: 'assignments_2', title: 'Double Down', description: 'Finish 2 assignments today', icon: 'file-text', targetCount: 2, xpReward: 15, type: 'assignment', category: 'assignments' },
  { id: 'assignments_3', title: 'Triple Threat', description: 'Finish 3 assignments today', icon: 'file-text', targetCount: 3, xpReward: 15, type: 'assignment', category: 'assignments' },

  // ── Category: xp (earn XP from any source) ──
  { id: 'xp_15', title: 'XP Starter', description: 'Earn 15 XP today', icon: 'zap', targetCount: 15, xpReward: 15, type: 'xp', category: 'xp' },
  { id: 'xp_25', title: 'XP Hunter', description: 'Earn 25 XP today', icon: 'zap', targetCount: 25, xpReward: 15, type: 'xp', category: 'xp' },
  { id: 'xp_50', title: 'XP Grinder', description: 'Earn 50 XP today', icon: 'zap', targetCount: 50, xpReward: 15, type: 'xp', category: 'xp' },
  { id: 'xp_75', title: 'XP Machine', description: 'Earn 75 XP today', icon: 'zap', targetCount: 75, xpReward: 15, type: 'xp', category: 'xp' },

  // ── Category: volume (complete many items of any kind) ──
  { id: 'any_2', title: 'Getting Started', description: 'Complete 2 items today', icon: 'target', targetCount: 2, xpReward: 15, type: 'any', category: 'volume' },
  { id: 'any_4', title: 'Momentum', description: 'Complete 4 items today', icon: 'target', targetCount: 4, xpReward: 15, type: 'any', category: 'volume' },
  { id: 'any_6', title: 'Productive Day', description: 'Complete 6 items today', icon: 'target', targetCount: 6, xpReward: 15, type: 'any', category: 'volume' },
  { id: 'any_8', title: 'On a Roll', description: 'Complete 8 items today', icon: 'target', targetCount: 8, xpReward: 15, type: 'any', category: 'volume' },

  // ── Category: grind (higher completion counts for any type) ──
  { id: 'grind_10', title: 'Grind Mode', description: 'Complete 10 items today', icon: 'flame', targetCount: 10, xpReward: 15, type: 'any', category: 'grind' },
  { id: 'grind_12', title: 'Unstoppable', description: 'Complete 12 items today', icon: 'flame', targetCount: 12, xpReward: 15, type: 'any', category: 'grind' },
  { id: 'grind_15', title: 'Beast Mode', description: 'Complete 15 items today', icon: 'flame', targetCount: 15, xpReward: 15, type: 'any', category: 'grind' },
];

const SWEEP_BONUS_XP = 25;

/**
 * Simple hash function for deterministic challenge selection by date.
 * Uses a better mixing function for more uniform distribution.
 */
function hashDateString(dateStr: string): number {
  let hash = 5381;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) + hash + dateStr.charCodeAt(i)) & 0x7fffffff;
  }
  return hash;
}

/**
 * Get 3 daily challenges for a given date string (YYYY-MM-DD).
 * Deterministic: all users see the same challenges on the same day.
 * Ensures category diversity — no two challenges from the same category.
 */
export function getDailyChallenges(dateKey: string): ChallengeDefinition[] {
  const hash = hashDateString(dateKey);

  // Group challenges by category (not type — category is the diversity key)
  const byCategory: Record<string, ChallengeDefinition[]> = {};
  for (const c of CHALLENGE_POOL) {
    if (!byCategory[c.category]) byCategory[c.category] = [];
    byCategory[c.category].push(c);
  }

  const categories = Object.keys(byCategory);
  const selected: ChallengeDefinition[] = [];
  const usedCategories = new Set<string>();

  for (let i = 0; i < 3; i++) {
    const availableCategories = categories.filter(c => !usedCategories.has(c));
    if (availableCategories.length === 0) break;

    // Use different hash offsets per slot for good spread
    const catIndex = (hash + i * 2654435761) % availableCategories.length;
    const chosenCategory = availableCategories[catIndex];
    usedCategories.add(chosenCategory);

    const pool = byCategory[chosenCategory];
    const challengeIndex = (hash + i * 40503) % pool.length;
    selected.push(pool[challengeIndex]);
  }

  return selected;
}

/**
 * Compute progress for today's challenges from GamificationCredit records.
 */
export async function computeChallengeProgress(
  userId: string,
  dateKey: string,
  timezoneOffset: number = 0
): Promise<DailyChallengeProgress[]> {
  const challenges = getDailyChallenges(dateKey);

  // Calculate local midnight in UTC terms
  // timezoneOffset is in minutes (from getTimezoneOffset(), e.g., 300 for EST)
  const [year, month, day] = dateKey.split('-').map(Number);
  // Local midnight in UTC
  const localMidnightUtc = new Date(Date.UTC(year, month - 1, day) + timezoneOffset * 60000);
  const localEndOfDayUtc = new Date(localMidnightUtc.getTime() + 24 * 60 * 60 * 1000);

  // Get all GamificationCredits for today
  const [credits, dailyActivity, claimedRewards] = await Promise.all([
    prisma.gamificationCredit.findMany({
      where: {
        userId,
        createdAt: {
          gte: localMidnightUtc,
          lt: localEndOfDayUtc,
        },
      },
    }),
    prisma.dailyActivity.findFirst({
      where: {
        userId,
        activityDate: new Date(Date.UTC(year, month - 1, day)),
      },
    }),
    prisma.dailyChallengeReward.findMany({
      where: {
        userId,
        dateKey,
      },
    }),
  ]);

  const claimedIds = new Set(claimedRewards.map(r => r.challengeId));

  // Count by type
  const taskCount = credits.filter(c => c.itemType === 'task').length;
  const flashcardCount = credits.filter(c => c.itemType === 'flashcard').length;
  const assignmentCount = credits.filter(c => c.itemType === 'deadline' || c.itemType === 'workItem').length;
  const totalCount = credits.length;
  const xpEarned = dailyActivity?.xpEarned || 0;

  return challenges.map(challenge => {
    let currentCount = 0;

    switch (challenge.type) {
      case 'task':
        currentCount = taskCount;
        break;
      case 'flashcard':
        currentCount = flashcardCount;
        break;
      case 'assignment':
        currentCount = assignmentCount;
        break;
      case 'xp':
        currentCount = xpEarned;
        break;
      case 'any':
        currentCount = totalCount;
        break;
    }

    return {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      icon: challenge.icon,
      currentCount: Math.min(currentCount, challenge.targetCount),
      targetCount: challenge.targetCount,
      completed: currentCount >= challenge.targetCount,
      claimed: claimedIds.has(challenge.id),
      xpReward: challenge.xpReward,
    };
  });
}

/**
 * Claim all completed-but-unclaimed daily challenges.
 * Awards XP and creates DailyChallengeReward records.
 * Returns total XP awarded and whether a level up occurred.
 */
export async function claimCompletedChallenges(
  userId: string,
  dateKey: string,
  timezoneOffset: number = 0
): Promise<{ xpAwarded: number; levelUp: boolean; newLevel: number; sweepBonus: boolean; claimedChallenges: Array<{ id: string; title: string; xpReward: number }> }> {
  const progress = await computeChallengeProgress(userId, dateKey, timezoneOffset);

  const toClaim = progress.filter(p => p.completed && !p.claimed);
  if (toClaim.length === 0) {
    const userStreak = await prisma.userStreak.findUnique({ where: { userId } });
    return { xpAwarded: 0, levelUp: false, newLevel: userStreak?.level || 1, sweepBonus: false, claimedChallenges: [] };
  }

  let totalXp = 0;
  for (const challenge of toClaim) {
    totalXp += challenge.xpReward;
  }

  // Check sweep bonus: all 3 completed (including previously claimed + newly claiming)
  const allCompleted = progress.every(p => p.completed);
  const alreadyClaimedSweep = await prisma.dailyChallengeReward.findUnique({
    where: {
      userId_challengeId_dateKey: {
        userId,
        challengeId: 'sweep_bonus',
        dateKey,
      },
    },
  });
  let sweepBonus = allCompleted && !alreadyClaimedSweep;
  if (sweepBonus) {
    totalXp += SWEEP_BONUS_XP;
  }

  // Get current state
  const userStreak = await prisma.userStreak.findUnique({ where: { userId } });
  if (!userStreak) {
    return { xpAwarded: 0, levelUp: false, newLevel: 1, sweepBonus: false, claimedChallenges: [] };
  }

  const previousLevel = userStreak.level;
  const newTotalXp = userStreak.totalXp + totalXp;
  const newLevel = calculateLevel(newTotalXp);

  // Create reward records and update XP in a transaction
  const [year, month, day] = dateKey.split('-').map(Number);
  const activityDate = new Date(Date.UTC(year, month - 1, day));

  await prisma.$transaction(async (tx) => {
    // Create reward records for each claimed challenge
    for (const challenge of toClaim) {
      await tx.dailyChallengeReward.create({
        data: {
          userId,
          challengeId: challenge.id,
          dateKey,
          xpAwarded: challenge.xpReward,
        },
      });
    }

    // Create sweep bonus record if applicable
    if (sweepBonus) {
      await tx.dailyChallengeReward.create({
        data: {
          userId,
          challengeId: 'sweep_bonus',
          dateKey,
          xpAwarded: SWEEP_BONUS_XP,
        },
      });
    }

    // Update UserStreak totalXp and level
    await tx.userStreak.update({
      where: { userId },
      data: {
        totalXp: newTotalXp,
        level: newLevel,
      },
    });

    // Update DailyActivity
    await tx.dailyActivity.upsert({
      where: {
        userId_activityDate: {
          userId,
          activityDate,
        },
      },
      update: {
        xpEarned: { increment: totalXp },
      },
      create: {
        userId,
        activityDate,
        tasksCompleted: 0,
        xpEarned: totalXp,
      },
    });

    // Update MonthlyXpTotal if user has a college
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { collegeId: true },
    });

    if (user?.collegeId) {
      const now = new Date();
      const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      await tx.monthlyXpTotal.upsert({
        where: {
          userId_yearMonth: {
            userId,
            yearMonth,
          },
        },
        update: {
          totalXp: { increment: totalXp },
        },
        create: {
          userId,
          collegeId: user.collegeId,
          yearMonth,
          totalXp,
        },
      });
    }
  });

  // Cascade: claiming challenges awards XP, which may complete XP-based challenges.
  // Re-check once for newly completed challenges after the XP update.
  const cascadeProgress = await computeChallengeProgress(userId, dateKey, timezoneOffset);
  const cascadeClaim = cascadeProgress.filter(p => p.completed && !p.claimed);

  if (cascadeClaim.length > 0) {
    let cascadeXp = 0;
    for (const c of cascadeClaim) cascadeXp += c.xpReward;

    // Check sweep bonus if not already awarded
    const allNowCompleted = cascadeProgress.every(p => p.completed);
    const cascadeSweep = allNowCompleted && !sweepBonus && !alreadyClaimedSweep;
    if (cascadeSweep) {
      cascadeXp += SWEEP_BONUS_XP;
    }

    const freshStreak = await prisma.userStreak.findUnique({ where: { userId } });
    if (freshStreak) {
      const cascadeTotalXp = freshStreak.totalXp + cascadeXp;
      const cascadeLevel = calculateLevel(cascadeTotalXp);

      await prisma.$transaction(async (tx) => {
        for (const c of cascadeClaim) {
          await tx.dailyChallengeReward.create({
            data: { userId, challengeId: c.id, dateKey, xpAwarded: c.xpReward },
          });
        }

        if (cascadeSweep) {
          await tx.dailyChallengeReward.create({
            data: { userId, challengeId: 'sweep_bonus', dateKey, xpAwarded: SWEEP_BONUS_XP },
          });
        }

        await tx.userStreak.update({
          where: { userId },
          data: { totalXp: cascadeTotalXp, level: cascadeLevel },
        });

        await tx.dailyActivity.upsert({
          where: { userId_activityDate: { userId, activityDate } },
          update: { xpEarned: { increment: cascadeXp } },
          create: { userId, activityDate, tasksCompleted: 0, xpEarned: cascadeXp },
        });

        const user = await tx.user.findUnique({ where: { id: userId }, select: { collegeId: true } });
        if (user?.collegeId) {
          const now = new Date();
          const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          await tx.monthlyXpTotal.upsert({
            where: { userId_yearMonth: { userId, yearMonth } },
            update: { totalXp: { increment: cascadeXp } },
            create: { userId, collegeId: user.collegeId, yearMonth, totalXp: cascadeXp },
          });
        }
      });

      totalXp += cascadeXp;
      toClaim.push(...cascadeClaim);
      if (cascadeSweep) sweepBonus = true;
      // Update final level info
      const finalStreak = await prisma.userStreak.findUnique({ where: { userId } });
      return {
        xpAwarded: totalXp,
        levelUp: (finalStreak?.level || newLevel) > previousLevel,
        newLevel: finalStreak?.level || newLevel,
        sweepBonus,
        claimedChallenges: toClaim.map(c => ({ id: c.id, title: c.title, xpReward: c.xpReward })),
      };
    }
  }

  return {
    xpAwarded: totalXp,
    levelUp: newLevel > previousLevel,
    newLevel,
    sweepBonus,
    claimedChallenges: toClaim.map(c => ({ id: c.id, title: c.title, xpReward: c.xpReward })),
  };
}
