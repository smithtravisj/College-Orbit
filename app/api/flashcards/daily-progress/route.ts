import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';

// GET today's flashcard study progress
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get timezone offset from query params (in minutes, e.g., -300 for UTC-5)
    const { searchParams } = new URL(request.url);
    const timezoneOffset = parseInt(searchParams.get('tz') || '0', 10);

    // Calculate start of user's local day in UTC
    // timezoneOffset is from getTimezoneOffset(): positive = behind UTC, negative = ahead
    const now = new Date();
    const userLocalTime = new Date(now.getTime() - timezoneOffset * 60000);
    const startOfLocalDay = new Date(Date.UTC(
      userLocalTime.getUTCFullYear(),
      userLocalTime.getUTCMonth(),
      userLocalTime.getUTCDate()
    ));
    // Convert back to UTC: when it's midnight locally, what time is it in UTC?
    const today = new Date(startOfLocalDay.getTime() + timezoneOffset * 60000);

    // Count flashcard credits for today
    const todayCredits = await prisma.gamificationCredit.count({
      where: {
        userId: session.user.id,
        itemType: 'flashcard',
        createdAt: {
          gte: today,
        },
      },
    });

    // Get user's daily goal setting
    const userSettings = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { settings: true },
    });

    const settings = userSettings?.settings as Record<string, unknown> | null;
    const dailyGoal = (settings?.flashcardDailyGoal as number) ?? 20;

    return NextResponse.json({
      cardsStudiedToday: todayCredits,
      dailyGoal,
      progress: Math.min(100, Math.round((todayCredits / dailyGoal) * 100)),
      goalReached: todayCredits >= dailyGoal,
    });
  } catch (error) {
    console.error('Error fetching daily progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily progress' },
      { status: 500 }
    );
  }
}
