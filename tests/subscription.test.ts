import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getSubscriptionStatus, checkPremiumAccess, checkFeatureLimit, FREE_TIER_LIMITS } from '@/lib/subscription';

// Type the mocked prisma
const mockPrisma = prisma as unknown as {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  note: {
    count: ReturnType<typeof vi.fn>;
  };
  course: {
    count: ReturnType<typeof vi.fn>;
  };
};

describe('getSubscriptionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns free tier for non-existent user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const status = await getSubscriptionStatus('non-existent-id');

    expect(status).toEqual({
      tier: 'free',
      isPremium: false,
      isTrialing: false,
      isLifetimePremium: false,
      trialDaysRemaining: null,
      trialEndsAt: null,
      plan: null,
      expiresAt: null,
    });
  });

  it('returns lifetime premium status for users with lifetimePremium flag', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      lifetimePremium: true,
      subscriptionTier: 'premium',
      subscriptionStatus: 'active',
      subscriptionPlan: null,
      subscriptionExpiresAt: null,
      trialStartedAt: null,
      trialEndsAt: null,
    });

    const status = await getSubscriptionStatus('user-id');

    expect(status.tier).toBe('premium');
    expect(status.isPremium).toBe(true);
    expect(status.isLifetimePremium).toBe(true);
    expect(status.status).toBe('lifetime');
  });

  it('returns active premium status for paying subscribers', async () => {
    const expiresAt = new Date('2025-12-31');
    mockPrisma.user.findUnique.mockResolvedValue({
      lifetimePremium: false,
      subscriptionTier: 'premium',
      subscriptionStatus: 'active',
      subscriptionPlan: 'monthly',
      subscriptionExpiresAt: expiresAt,
      trialStartedAt: null,
      trialEndsAt: null,
    });

    const status = await getSubscriptionStatus('user-id');

    expect(status.tier).toBe('premium');
    expect(status.isPremium).toBe(true);
    expect(status.isLifetimePremium).toBe(false);
    expect(status.plan).toBe('monthly');
    expect(status.expiresAt).toEqual(expiresAt);
    expect(status.status).toBe('active');
  });

  it('returns premium access for canceled subscription until period ends', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10); // 10 days from now

    mockPrisma.user.findUnique.mockResolvedValue({
      lifetimePremium: false,
      subscriptionTier: 'premium',
      subscriptionStatus: 'canceled',
      subscriptionPlan: 'yearly',
      subscriptionExpiresAt: futureDate,
      trialStartedAt: null,
      trialEndsAt: null,
    });

    const status = await getSubscriptionStatus('user-id');

    expect(status.tier).toBe('premium');
    expect(status.isPremium).toBe(true);
    expect(status.status).toBe('canceled');
    expect(status.plan).toBe('yearly');
  });

  it('downgrades to free when canceled subscription period has ended', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // Yesterday

    mockPrisma.user.findUnique.mockResolvedValue({
      lifetimePremium: false,
      subscriptionTier: 'premium',
      subscriptionStatus: 'canceled',
      subscriptionPlan: 'monthly',
      subscriptionExpiresAt: pastDate,
      trialStartedAt: null,
      trialEndsAt: null,
    });
    mockPrisma.user.update.mockResolvedValue({});

    const status = await getSubscriptionStatus('user-id');

    expect(status.tier).toBe('free');
    expect(status.isPremium).toBe(false);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { subscriptionTier: 'free', subscriptionStatus: 'none' },
    });
  });

  it('returns trial status with days remaining for active trial', async () => {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 5); // 5 days from now

    mockPrisma.user.findUnique.mockResolvedValue({
      lifetimePremium: false,
      subscriptionTier: 'trial',
      subscriptionStatus: null,
      subscriptionPlan: null,
      subscriptionExpiresAt: null,
      trialStartedAt: new Date(),
      trialEndsAt,
    });

    const status = await getSubscriptionStatus('user-id');

    expect(status.tier).toBe('trial');
    expect(status.isPremium).toBe(true); // Full access during trial
    expect(status.isTrialing).toBe(true);
    expect(status.trialDaysRemaining).toBeGreaterThanOrEqual(4);
    expect(status.trialDaysRemaining).toBeLessThanOrEqual(6);
    expect(status.trialEndsAt).toEqual(trialEndsAt);
  });

  it('downgrades to free when trial has expired', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // Yesterday

    mockPrisma.user.findUnique.mockResolvedValue({
      lifetimePremium: false,
      subscriptionTier: 'trial',
      subscriptionStatus: null,
      subscriptionPlan: null,
      subscriptionExpiresAt: null,
      trialStartedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      trialEndsAt: pastDate,
    });
    mockPrisma.user.update.mockResolvedValue({});

    const status = await getSubscriptionStatus('user-id');

    expect(status.tier).toBe('free');
    expect(status.isPremium).toBe(false);
    expect(status.isTrialing).toBe(false);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { subscriptionTier: 'free', subscriptionStatus: 'none' },
    });
  });
});

describe('checkPremiumAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows access for premium users', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      lifetimePremium: true,
      subscriptionTier: 'premium',
      subscriptionStatus: 'active',
      subscriptionPlan: null,
      subscriptionExpiresAt: null,
      trialStartedAt: null,
      trialEndsAt: null,
    });

    const result = await checkPremiumAccess('user-id');

    expect(result.allowed).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it('denies access for free users with message', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      lifetimePremium: false,
      subscriptionTier: 'free',
      subscriptionStatus: 'none',
      subscriptionPlan: null,
      subscriptionExpiresAt: null,
      trialStartedAt: null,
      trialEndsAt: null,
    });

    const result = await checkPremiumAccess('user-id');

    expect(result.allowed).toBe(false);
    expect(result.message).toBe('This feature requires a Premium subscription.');
  });
});

describe('checkFeatureLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows unlimited notes for premium users', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      lifetimePremium: true,
      subscriptionTier: 'premium',
      subscriptionStatus: 'active',
      subscriptionPlan: null,
      subscriptionExpiresAt: null,
      trialStartedAt: null,
      trialEndsAt: null,
    });
    mockPrisma.note.count.mockResolvedValue(100);

    const result = await checkFeatureLimit('user-id', 'notes');

    expect(result.allowed).toBe(true);
    expect(result.current).toBe(100);
    expect(result.limit).toBe(Infinity);
  });

  it('allows free users under the notes limit', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      lifetimePremium: false,
      subscriptionTier: 'free',
      subscriptionStatus: 'none',
      subscriptionPlan: null,
      subscriptionExpiresAt: null,
      trialStartedAt: null,
      trialEndsAt: null,
    });
    mockPrisma.note.count.mockResolvedValue(5);

    const result = await checkFeatureLimit('user-id', 'notes');

    expect(result.allowed).toBe(true);
    expect(result.current).toBe(5);
    expect(result.limit).toBe(FREE_TIER_LIMITS.maxNotes);
  });

  it('denies free users at the notes limit', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      lifetimePremium: false,
      subscriptionTier: 'free',
      subscriptionStatus: 'none',
      subscriptionPlan: null,
      subscriptionExpiresAt: null,
      trialStartedAt: null,
      trialEndsAt: null,
    });
    mockPrisma.note.count.mockResolvedValue(FREE_TIER_LIMITS.maxNotes);

    const result = await checkFeatureLimit('user-id', 'notes');

    expect(result.allowed).toBe(false);
    expect(result.current).toBe(FREE_TIER_LIMITS.maxNotes);
    expect(result.limit).toBe(FREE_TIER_LIMITS.maxNotes);
    expect(result.message).toContain('Free tier allows up to');
  });

  it('checks course limits correctly', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      lifetimePremium: false,
      subscriptionTier: 'free',
      subscriptionStatus: 'none',
      subscriptionPlan: null,
      subscriptionExpiresAt: null,
      trialStartedAt: null,
      trialEndsAt: null,
    });
    mockPrisma.course.count.mockResolvedValue(FREE_TIER_LIMITS.maxCourses);

    const result = await checkFeatureLimit('user-id', 'courses');

    expect(result.allowed).toBe(false);
    expect(result.limit).toBe(FREE_TIER_LIMITS.maxCourses);
    expect(result.message).toContain('courses');
  });
});

describe('FREE_TIER_LIMITS', () => {
  it('has correct default limits', () => {
    expect(FREE_TIER_LIMITS.maxNotes).toBe(10);
    expect(FREE_TIER_LIMITS.maxCourses).toBe(8);
    expect(FREE_TIER_LIMITS.canUploadFiles).toBe(false);
    expect(FREE_TIER_LIMITS.canUseRecurring).toBe(false);
    expect(FREE_TIER_LIMITS.canAccessCalendar).toBe(false);
    expect(FREE_TIER_LIMITS.canAccessShopping).toBe(false);
    expect(FREE_TIER_LIMITS.canAccessFullTools).toBe(false);
  });
});
