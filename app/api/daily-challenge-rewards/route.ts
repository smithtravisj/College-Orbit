import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';
import { withRateLimit } from '@/lib/withRateLimit';

// GET all daily challenge rewards for the user (for export)
export const GET = withRateLimit(async function(_req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rewards = await prisma.dailyChallengeReward.findMany({
      where: { userId: session.user.id },
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
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
          userId: session.user.id,
          challengeId,
          dateKey,
        },
      },
      update: { xpAwarded },
      create: {
        userId: session.user.id,
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
