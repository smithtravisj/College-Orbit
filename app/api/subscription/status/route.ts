import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/getAuthUserId';
import { getSubscriptionStatus } from '@/lib/subscription';
import { withRateLimit } from '@/lib/withRateLimit';

export const GET = withRateLimit(async function (req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const status = await getSubscriptionStatus(userId);

    return NextResponse.json({
      tier: status.tier,
      isPremium: status.isPremium,
      isTrialing: status.isTrialing,
      isLifetimePremium: status.isLifetimePremium,
      trialDaysRemaining: status.trialDaysRemaining,
      trialEndsAt: status.trialEndsAt?.toISOString() || null,
      plan: status.plan,
      expiresAt: status.expiresAt?.toISOString() || null,
      status: status.status || 'none',
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
});
