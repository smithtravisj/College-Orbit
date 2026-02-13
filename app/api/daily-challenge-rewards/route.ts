import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/withRateLimit';
import { getAuthUserId } from '@/lib/getAuthUserId';

// GET all daily challenge rewards for the user (for export)
export const GET = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const rewards = await prisma.dailyChallengeReward.findMany({
      where: { userId },
      orderBy: { claimedAt: 'desc' },
    });

    return NextResponse.json({ rewards });
  } catch (error) {
    console.error('[GET /api/daily-challenge-rewards] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily challenge rewards' },
      { status: 500 }
    );
  }
});

// POST create a daily challenge reward (for import)
export const POST = withRateLimit(async function(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const body = await req.json();
    const { challengeId, dateKey, xpAwarded } = body;

    if (!challengeId || !dateKey || xpAwarded === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: challengeId, dateKey, xpAwarded' },
        { status: 400 }
      );
    }

    const reward = await prisma.dailyChallengeReward.upsert({
      where: {
        userId_challengeId_dateKey: {
          userId,
          challengeId,
          dateKey,
        },
      },
      update: { xpAwarded },
      create: {
        userId,
        challengeId,
        dateKey,
        xpAwarded,
      },
    });

    return NextResponse.json({ reward });
  } catch (error) {
    console.error('[POST /api/daily-challenge-rewards] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create daily challenge reward' },
      { status: 500 }
    );
  }
});
