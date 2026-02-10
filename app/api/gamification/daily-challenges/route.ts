import { NextRequest, NextResponse } from 'next/server';
import { computeChallengeProgress, claimCompletedChallenges } from '@/lib/dailyChallenges';
import { getAuthUserId } from '@/lib/getAuthUserId';

/**
 * Helper to get today's date key in user's local timezone
 */
function getLocalDateKey(timezoneOffset: number): string {
  const now = new Date();
  const userLocalTime = new Date(now.getTime() - timezoneOffset * 60000);
  const year = userLocalTime.getUTCFullYear();
  const month = String(userLocalTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(userLocalTime.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// GET today's challenges with progress
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timezoneOffset = parseInt(searchParams.get('tz') || '0', 10);
    const dateKey = getLocalDateKey(timezoneOffset);

    const challenges = await computeChallengeProgress(userId, dateKey, timezoneOffset);
    return NextResponse.json({ challenges, dateKey });
  } catch (error) {
    console.error('Error fetching daily challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily challenges' },
      { status: 500 }
    );
  }
}

// POST claim completed challenges
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const timezoneOffset = typeof data.timezoneOffset === 'number' ? data.timezoneOffset : 0;
    const dateKey = getLocalDateKey(timezoneOffset);

    const result = await claimCompletedChallenges(userId, dateKey, timezoneOffset);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error claiming daily challenges:', error);
    return NextResponse.json(
      { error: 'Failed to claim daily challenges' },
      { status: 500 }
    );
  }
}
