import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/withRateLimit';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { prisma } from '@/lib/prisma';
import { calculateLevel } from '@/lib/gamification';

const XP_PER_QUESTION = 1;

function getUtcDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

function shouldBreakStreak(lastActivityDate: Date | null, today: Date): boolean {
  if (!lastActivityDate) return false;

  const lastActivity = getUtcDateOnly(lastActivityDate);
  const todayDate = getUtcDateOnly(today);

  if (lastActivity.getTime() === todayDate.getTime()) return false;

  const yesterday = new Date(todayDate);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  if (lastActivity.getTime() === yesterday.getTime()) return false;

  const dayAfterLastActivity = new Date(lastActivity);
  dayAfterLastActivity.setUTCDate(dayAfterLastActivity.getUTCDate() + 1);

  let checkDate = new Date(dayAfterLastActivity);
  while (checkDate < todayDate) {
    if (!isWeekend(checkDate)) return true;
    checkDate.setUTCDate(checkDate.getUTCDate() + 1);
  }

  return false;
}

export const POST = withRateLimit(async function(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const body = await request.json();
    const { deckId, score, total, timezoneOffset = 0 } = body;

    if (!deckId || score === undefined || total === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate today's date key for credit check
    const now = new Date();
    const userLocalTime = new Date(now.getTime() - timezoneOffset * 60000);
    const today = getUtcDateOnly(userLocalTime);
    const dateKey = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`;
    const creditId = `quiz-${deckId}-${dateKey}`;

    // Check if already credited today for this deck
    const existingCredit = await prisma.gamificationCredit.findUnique({
      where: {
        userId_itemType_itemId: {
          userId,
          itemType: 'quiz',
          itemId: creditId,
        },
      },
    });

    if (existingCredit) {
      const userStreak = await prisma.userStreak.findUnique({ where: { userId } });
      return NextResponse.json({
        xpEarned: 0,
        levelUp: false,
        newLevel: userStreak ? calculateLevel(userStreak.totalXp) : 1,
        alreadyCredited: true,
      });
    }

    const xpToAward = Math.max(1, Math.min(total, 20)) * XP_PER_QUESTION;

    // Get or create user streak
    let userStreak = await prisma.userStreak.findUnique({ where: { userId } });
    if (!userStreak) {
      userStreak = await prisma.userStreak.create({ data: { userId } });
    }

    const previousLevel = calculateLevel(userStreak.totalXp);
    const newTotalXp = userStreak.totalXp + xpToAward;
    const newLevel = calculateLevel(newTotalXp);

    // Handle streak logic (same as processFlashcardReview)
    if (userStreak.vacationMode) {
      await prisma.userStreak.update({
        where: { userId },
        data: { totalXp: newTotalXp, level: newLevel },
      });
    } else {
      const streakBroken = shouldBreakStreak(userStreak.lastActivityDate, userLocalTime);
      let newStreak = userStreak.currentStreak;
      let streakStartDate = userStreak.streakStartDate;

      if (streakBroken) {
        newStreak = 1;
        streakStartDate = today;
      } else if (!userStreak.lastActivityDate ||
                 getUtcDateOnly(userStreak.lastActivityDate).getTime() !== today.getTime()) {
        newStreak = userStreak.currentStreak + 1;
        if (!streakStartDate) streakStartDate = today;
      }

      const longestStreak = Math.max(userStreak.longestStreak, newStreak);

      await prisma.userStreak.update({
        where: { userId },
        data: {
          currentStreak: newStreak,
          longestStreak,
          lastActivityDate: today,
          streakStartDate,
          totalXp: newTotalXp,
          level: newLevel,
        },
      });
    }

    // Record the credit
    await prisma.gamificationCredit.create({
      data: {
        userId,
        itemType: 'quiz',
        itemId: creditId,
        xpAwarded: xpToAward,
      },
    });

    // Update daily activity
    await prisma.dailyActivity.upsert({
      where: {
        userId_activityDate: { userId, activityDate: today },
      },
      update: {
        xpEarned: { increment: xpToAward },
      },
      create: {
        userId,
        activityDate: today,
        tasksCompleted: 0,
        xpEarned: xpToAward,
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
          userId_yearMonth: { userId, yearMonth },
        },
        update: {
          totalXp: { increment: xpToAward },
        },
        create: {
          userId,
          collegeId: user.collegeId,
          yearMonth,
          totalXp: xpToAward,
        },
      });
    }

    return NextResponse.json({
      xpEarned: xpToAward,
      levelUp: newLevel > previousLevel,
      newLevel,
      alreadyCredited: false,
    });
  } catch (error) {
    console.error('Error completing quiz:', error);
    return NextResponse.json(
      { error: 'Failed to record quiz completion' },
      { status: 500 }
    );
  }
});
