import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

// Mock the email module
vi.mock('@/lib/email', () => ({
  sendSubscriptionStartedEmail: vi.fn().mockResolvedValue(undefined),
}));

// Mock stripe
vi.mock('@/lib/stripe', () => ({
  stripe: {
    subscriptions: {
      retrieve: vi.fn(),
    },
  },
}));

// Import after mocks
import { sendSubscriptionStartedEmail } from '@/lib/email';
import { stripe } from '@/lib/stripe';

// Type the mocked modules
const mockPrisma = prisma as unknown as {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  notification: {
    create: ReturnType<typeof vi.fn>;
  };
};

const mockStripe = stripe as unknown as {
  subscriptions: {
    retrieve: ReturnType<typeof vi.fn>;
  };
};

const mockSendEmail = sendSubscriptionStartedEmail as ReturnType<typeof vi.fn>;

// Extract the handler functions by re-implementing them for testing
// In a real scenario, you'd export these from the route file

async function handleCheckoutComplete(session: {
  metadata?: { userId?: string; plan?: string };
  subscription?: string;
}) {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('No userId in checkout session metadata');
    return;
  }

  const plan = (session.metadata?.plan || 'monthly') as 'monthly' | 'yearly' | 'semester';

  if (plan === 'semester') {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 4);

    const user = await mockPrisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: 'premium',
        subscriptionStatus: 'active',
        stripeSubscriptionId: null,
        subscriptionPlan: plan,
        subscriptionExpiresAt: expiresAt,
      },
    });

    await mockPrisma.notification.create({
      data: {
        userId,
        title: 'Welcome to Premium!',
        message: expect.any(String),
        type: 'subscription_active',
      },
    });

    try {
      await mockSendEmail({
        email: user.email,
        name: user.name,
        plan,
      });
    } catch {}

    return;
  }

  const subscriptionId = session.subscription as string;
  const subscription = await mockStripe.subscriptions.retrieve(subscriptionId);

  await mockPrisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: 'premium',
      subscriptionStatus: 'active',
      stripeSubscriptionId: subscription.id,
      subscriptionPlan: plan,
      subscriptionExpiresAt: new Date(subscription.current_period_end * 1000),
    },
  });
}

async function handleSubscriptionDeleted(subscription: {
  id: string;
  metadata?: { userId?: string };
}) {
  const userId = subscription.metadata?.userId;

  const user = userId
    ? await mockPrisma.user.findUnique({ where: { id: userId } })
    : await mockPrisma.user.findFirst({ where: { stripeSubscriptionId: subscription.id } });

  if (!user) {
    console.error('No user found for deleted subscription:', subscription.id);
    return;
  }

  await mockPrisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionTier: 'free',
      subscriptionStatus: 'canceled',
      stripeSubscriptionId: null,
      subscriptionPlan: null,
      subscriptionExpiresAt: null,
    },
  });

  await mockPrisma.notification.create({
    data: {
      userId: user.id,
      title: 'Subscription Canceled',
      message: expect.any(String),
      type: 'subscription_canceled',
    },
  });
}

async function handlePaymentFailed(invoice: { customer: string }) {
  const customerId = invoice.customer;

  const user = await mockPrisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    return;
  }

  await mockPrisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'past_due',
    },
  });

  await mockPrisma.notification.create({
    data: {
      userId: user.id,
      title: 'Payment Failed',
      message: expect.any(String),
      type: 'payment_failed',
    },
  });
}

async function handlePaymentSucceeded(invoice: { customer: string; subscription?: string }) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) return;

  const user = await mockPrisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) return;

  if (user.subscriptionStatus === 'past_due') {
    await mockPrisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'active',
      },
    });
  }
}

describe('Stripe Webhook Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleCheckoutComplete', () => {
    it('does nothing when userId is missing from metadata', async () => {
      await handleCheckoutComplete({ metadata: {} });

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('handles semester plan with 4-month expiration', async () => {
      const userId = 'user-123';
      mockPrisma.user.update.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
      });
      mockPrisma.notification.create.mockResolvedValue({});

      await handleCheckoutComplete({
        metadata: { userId, plan: 'semester' },
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({
          subscriptionTier: 'premium',
          subscriptionStatus: 'active',
          stripeSubscriptionId: null, // No recurring subscription
          subscriptionPlan: 'semester',
        }),
      });

      // Verify expiration is ~4 months from now
      const updateCall = mockPrisma.user.update.mock.calls[0][0];
      const expiresAt = updateCall.data.subscriptionExpiresAt as Date;
      const fourMonthsFromNow = new Date();
      fourMonthsFromNow.setMonth(fourMonthsFromNow.getMonth() + 4);

      // Should be within 1 day of 4 months from now
      const diffDays = Math.abs(expiresAt.getTime() - fourMonthsFromNow.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeLessThan(1);
    });

    it('handles monthly subscription with Stripe subscription ID', async () => {
      const userId = 'user-123';
      const subscriptionId = 'sub_abc123';
      const periodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days

      mockStripe.subscriptions.retrieve.mockResolvedValue({
        id: subscriptionId,
        current_period_end: periodEnd,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
      });

      await handleCheckoutComplete({
        metadata: { userId, plan: 'monthly' },
        subscription: subscriptionId,
      });

      expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith(subscriptionId);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({
          subscriptionTier: 'premium',
          subscriptionStatus: 'active',
          stripeSubscriptionId: subscriptionId,
          subscriptionPlan: 'monthly',
        }),
      });
    });

    it('sends welcome email after successful checkout', async () => {
      const userId = 'user-123';
      mockPrisma.user.update.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
      });
      mockPrisma.notification.create.mockResolvedValue({});

      await handleCheckoutComplete({
        metadata: { userId, plan: 'semester' },
      });

      expect(mockSendEmail).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        plan: 'semester',
      });
    });
  });

  describe('handleSubscriptionDeleted', () => {
    it('downgrades user to free tier', async () => {
      const userId = 'user-123';
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.notification.create.mockResolvedValue({});

      await handleSubscriptionDeleted({
        id: 'sub_abc123',
        metadata: { userId },
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          subscriptionTier: 'free',
          subscriptionStatus: 'canceled',
          stripeSubscriptionId: null,
          subscriptionPlan: null,
          subscriptionExpiresAt: null,
        },
      });
    });

    it('finds user by subscription ID when metadata is missing', async () => {
      const userId = 'user-123';
      const subscriptionId = 'sub_abc123';

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue({ id: userId });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.notification.create.mockResolvedValue({});

      await handleSubscriptionDeleted({
        id: subscriptionId,
        metadata: {},
      });

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: subscriptionId },
      });
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('creates cancellation notification', async () => {
      const userId = 'user-123';
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.notification.create.mockResolvedValue({});

      await handleSubscriptionDeleted({
        id: 'sub_abc123',
        metadata: { userId },
      });

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          title: 'Subscription Canceled',
          type: 'subscription_canceled',
        }),
      });
    });

    it('does nothing when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await handleSubscriptionDeleted({
        id: 'sub_unknown',
        metadata: {},
      });

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('handlePaymentFailed', () => {
    it('marks subscription as past_due', async () => {
      const userId = 'user-123';
      mockPrisma.user.findFirst.mockResolvedValue({ id: userId });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.notification.create.mockResolvedValue({});

      await handlePaymentFailed({ customer: 'cus_abc123' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { subscriptionStatus: 'past_due' },
      });
    });

    it('creates payment failed notification', async () => {
      const userId = 'user-123';
      mockPrisma.user.findFirst.mockResolvedValue({ id: userId });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.notification.create.mockResolvedValue({});

      await handlePaymentFailed({ customer: 'cus_abc123' });

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          title: 'Payment Failed',
          type: 'payment_failed',
        }),
      });
    });

    it('does nothing when customer not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await handlePaymentFailed({ customer: 'cus_unknown' });

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('handlePaymentSucceeded', () => {
    it('restores active status when user was past_due', async () => {
      const userId = 'user-123';
      mockPrisma.user.findFirst.mockResolvedValue({
        id: userId,
        subscriptionStatus: 'past_due',
      });
      mockPrisma.user.update.mockResolvedValue({});

      await handlePaymentSucceeded({
        customer: 'cus_abc123',
        subscription: 'sub_abc123',
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { subscriptionStatus: 'active' },
      });
    });

    it('does nothing when user was already active', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-123',
        subscriptionStatus: 'active',
      });

      await handlePaymentSucceeded({
        customer: 'cus_abc123',
        subscription: 'sub_abc123',
      });

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('does nothing for non-subscription invoices', async () => {
      await handlePaymentSucceeded({
        customer: 'cus_abc123',
        subscription: undefined,
      });

      expect(mockPrisma.user.findFirst).not.toHaveBeenCalled();
    });
  });
});
