import { prisma } from '@/lib/prisma';
// Import for internal use and re-export for backwards compatibility with server-side code
import { FREE_TIER_LIMITS } from '@/lib/subscription-constants';
export { FREE_TIER_LIMITS };

export type SubscriptionTier = 'trial' | 'free' | 'premium';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  isPremium: boolean;
  isTrialing: boolean;
  isLifetimePremium: boolean;
  trialDaysRemaining: number | null;
  trialEndsAt: Date | null;
  plan: 'monthly' | 'yearly' | null;
  expiresAt: Date | null;
  status?: 'active' | 'canceled' | 'past_due' | 'none' | 'lifetime';
}

export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      trialStartedAt: true,
      trialEndsAt: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      subscriptionExpiresAt: true,
      lifetimePremium: true,
    },
  });

  const defaultStatus: SubscriptionStatus = {
    tier: 'free',
    isPremium: false,
    isTrialing: false,
    isLifetimePremium: false,
    trialDaysRemaining: null,
    trialEndsAt: null,
    plan: null,
    expiresAt: null,
  };

  if (!user) {
    return defaultStatus;
  }

  // Admin-granted lifetime premium
  if (user.lifetimePremium) {
    return {
      tier: 'premium',
      isPremium: true,
      isTrialing: false,
      isLifetimePremium: true,
      trialDaysRemaining: null,
      trialEndsAt: null,
      plan: null,
      expiresAt: null,
      status: 'lifetime',
    };
  }

  // Active subscription
  if (user.subscriptionTier === 'premium' && user.subscriptionStatus === 'active') {
    return {
      tier: 'premium',
      isPremium: true,
      isTrialing: false,
      isLifetimePremium: false,
      trialDaysRemaining: null,
      trialEndsAt: null,
      plan: user.subscriptionPlan as 'monthly' | 'yearly' | null,
      expiresAt: user.subscriptionExpiresAt,
      status: 'active',
    };
  }

  // Canceled subscription - still has access until period ends
  if (user.subscriptionTier === 'premium' && user.subscriptionStatus === 'canceled' && user.subscriptionExpiresAt) {
    const now = new Date();
    if (now < user.subscriptionExpiresAt) {
      return {
        tier: 'premium',
        isPremium: true,
        isTrialing: false,
        isLifetimePremium: false,
        trialDaysRemaining: null,
        trialEndsAt: null,
        plan: user.subscriptionPlan as 'monthly' | 'yearly' | null,
        expiresAt: user.subscriptionExpiresAt,
        status: 'canceled',
      };
    }
    // Subscription period has ended - downgrade to free
    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: 'free', subscriptionStatus: 'none' },
    });
  }

  // Trial period check
  if (user.subscriptionTier === 'trial' && user.trialEndsAt) {
    const now = new Date();
    if (now < user.trialEndsAt) {
      const daysRemaining = Math.ceil(
        (user.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        tier: 'trial',
        isPremium: true, // Full access during trial
        isTrialing: true,
        isLifetimePremium: false,
        trialDaysRemaining: daysRemaining,
        trialEndsAt: user.trialEndsAt,
        plan: null,
        expiresAt: null,
      };
    }
    // Trial expired - update user to free tier
    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: 'free', subscriptionStatus: 'none' },
    });
  }

  return defaultStatus;
}

// Helper to check if user can perform a premium action
export async function checkPremiumAccess(userId: string): Promise<{ allowed: boolean; message?: string }> {
  const status = await getSubscriptionStatus(userId);
  if (status.isPremium) {
    return { allowed: true };
  }
  return {
    allowed: false,
    message: 'This feature requires a Premium subscription.',
  };
}

// Helper to check feature limits
export async function checkFeatureLimit(
  userId: string,
  feature: 'notes' | 'courses'
): Promise<{ allowed: boolean; current: number; limit: number; message?: string }> {
  const status = await getSubscriptionStatus(userId);

  if (status.isPremium) {
    const current = feature === 'notes'
      ? await prisma.note.count({ where: { userId } })
      : await prisma.course.count({ where: { userId } });
    return { allowed: true, current, limit: Infinity };
  }

  const limit = feature === 'notes' ? FREE_TIER_LIMITS.maxNotes : FREE_TIER_LIMITS.maxCourses;
  const current = feature === 'notes'
    ? await prisma.note.count({ where: { userId } })
    : await prisma.course.count({ where: { userId } });

  if (current >= limit) {
    return {
      allowed: false,
      current,
      limit,
      message: `Free tier allows up to ${limit} ${feature}. Upgrade to Premium for unlimited ${feature}.`,
    };
  }

  return { allowed: true, current, limit };
}
