import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendSubscriptionStartedEmail, sendReferralSuccessEmail } from '@/lib/email';
import { log } from '@/lib/logger';
import Stripe from 'stripe';

// Disable body parsing, we need the raw body for webhook signature verification
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    log.error('Webhook signature verification failed', err);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      default:
        log.webhook('stripe', event.type, { handled: false });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    log.error('Error processing webhook', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) {
    log.error('No userId in checkout session metadata', null, { sessionId: session.id });
    return;
  }

  const plan = (session.metadata?.plan || 'monthly') as 'monthly' | 'yearly' | 'semester';

  // Handle semester one-time payment differently
  if (plan === 'semester') {
    // Calculate expiration 4 months from now
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 4);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: 'premium',
        subscriptionStatus: 'active',
        stripeSubscriptionId: null, // No recurring subscription
        subscriptionPlan: plan,
        subscriptionExpiresAt: expiresAt,
      },
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId,
        title: 'Welcome to Premium!',
        message: `Your semester pass is now active! Enjoy unlimited access to all features until ${expiresAt.toLocaleDateString()}.`,
        type: 'subscription_active',
      },
    });

    // Send welcome email
    try {
      await sendSubscriptionStartedEmail({
        email: user.email,
        name: user.name,
        plan,
      });
    } catch (emailError) {
      log.error('Failed to send subscription started email', emailError, { userId, plan });
    }

    log.subscription('semester_purchased', userId, { expiresAt: expiresAt.toISOString() });

    // Process referral reward if applicable
    await processReferralReward(userId);
    return;
  }

  // Handle recurring subscriptions (monthly/yearly)
  const subscriptionId = session.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: 'premium',
      subscriptionStatus: 'active',
      stripeSubscriptionId: subscription.id,
      subscriptionPlan: plan,
      subscriptionExpiresAt: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000),
    },
  });

  // Create notification for user
  await prisma.notification.create({
    data: {
      userId,
      title: 'Welcome to Premium!',
      message: `Your ${plan} subscription is now active. Enjoy unlimited access to all features!`,
      type: 'subscription_active',
    },
  });

  // Send welcome email
  try {
    await sendSubscriptionStartedEmail({
      email: user.email,
      name: user.name,
      plan,
    });
  } catch (emailError) {
    log.error('Failed to send subscription started email', emailError, { userId, plan });
  }

  log.subscription('subscribed', userId, { plan });

  // Process referral reward if applicable
  await processReferralReward(userId);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    // Try to find user by subscription ID
    const user = await prisma.user.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });
    if (!user) {
      log.error('No user found for subscription', null, { subscriptionId: subscription.id });
      return;
    }
    await updateUserSubscription(user.id, subscription);
    return;
  }

  await updateUserSubscription(userId, subscription);
}

async function updateUserSubscription(userId: string, subscription: Stripe.Subscription) {
  const status = subscription.status;
  const plan = subscription.metadata?.plan || 'monthly';

  let subscriptionTier: string;
  let subscriptionStatus: string;

  switch (status) {
    case 'active':
    case 'trialing':
      subscriptionTier = 'premium';
      subscriptionStatus = 'active';
      break;
    case 'past_due':
      subscriptionTier = 'premium'; // Still give access during grace period
      subscriptionStatus = 'past_due';
      break;
    case 'canceled':
    case 'unpaid':
      subscriptionTier = 'free';
      subscriptionStatus = 'canceled';
      break;
    default:
      subscriptionTier = 'free';
      subscriptionStatus = 'none';
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier,
      subscriptionStatus,
      subscriptionPlan: plan,
      subscriptionExpiresAt: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000),
    },
  });

  log.subscription('updated', userId, { subscriptionTier, subscriptionStatus, plan });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  // Find user by subscription ID if not in metadata
  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : await prisma.user.findFirst({ where: { stripeSubscriptionId: subscription.id } });

  if (!user) {
    log.error('No user found for deleted subscription', null, { subscriptionId: subscription.id });
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionTier: 'free',
      subscriptionStatus: 'canceled',
      stripeSubscriptionId: null,
      subscriptionPlan: null,
      subscriptionExpiresAt: null,
    },
  });

  // Create notification for user
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: 'Subscription Canceled',
      message: 'Your Premium subscription has been canceled. Your data is safe - you can resubscribe anytime to regain access.',
      type: 'subscription_canceled',
    },
  });

  log.subscription('canceled', user.id);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    log.error('No user found for customer (payment failed)', null, { customerId });
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'past_due',
    },
  });

  // Create notification for user
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: 'Payment Failed',
      message: 'We couldn\'t process your payment. Please update your payment method to continue your Premium subscription.',
      type: 'payment_failed',
    },
  });

  log.subscription('payment_failed', user.id);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = (invoice as unknown as { subscription: string | null }).subscription;

  if (!subscriptionId) return; // Not a subscription invoice

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    log.error('No user found for customer (payment succeeded)', null, { customerId });
    return;
  }

  // Only update if they were in past_due status
  if (user.subscriptionStatus === 'past_due') {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'active',
      },
    });

    log.subscription('payment_succeeded', user.id, { restoredFromPastDue: true });
  }
}

/**
 * Process referral reward when a referred user converts to premium
 * Awards 1 month of premium to the referrer
 */
async function processReferralReward(refereeId: string) {
  try {
    // Find the pending referral for this user
    const referral = await prisma.referral.findUnique({
      where: { refereeId },
      include: {
        referrer: {
          select: {
            id: true,
            email: true,
            name: true,
            subscriptionTier: true,
            subscriptionStatus: true,
            subscriptionPlan: true,
            trialEndsAt: true,
            subscriptionExpiresAt: true,
            lifetimePremium: true,
            stripeCustomerId: true,
            stripeSubscriptionId: true,
          },
        },
      },
    });

    // No referral found or already processed
    if (!referral || referral.status !== 'pending') {
      return;
    }

    const referrer = referral.referrer;

    // Don't reward if referrer has lifetime premium (already unlimited)
    // But still mark as completed for tracking
    if (referrer.lifetimePremium) {
      await prisma.referral.update({
        where: { id: referral.id },
        data: {
          status: 'completed',
          rewardedAt: new Date(),
        },
      });
      log.subscription('referral_completed_lifetime', referrer.id, { refereeId });
      return;
    }

    // Calculate reward based on referrer's current status
    const now = new Date();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    let updateData: {
      subscriptionTier?: string;
      subscriptionStatus?: string;
      trialEndsAt?: Date;
      subscriptionExpiresAt?: Date;
    } = {};
    let appliedStripeCredit = false;

    if (referrer.subscriptionTier === 'premium' && referrer.stripeSubscriptionId && referrer.stripeCustomerId &&
        referrer.subscriptionStatus === 'active' && referrer.subscriptionPlan !== 'semester') {
      // Active recurring subscriber: credit their next invoice via Stripe
      try {
        const upcomingInvoice = await stripe.invoices.createPreview({
          customer: referrer.stripeCustomerId,
        });
        const creditAmount = upcomingInvoice.amount_due; // in cents

        if (creditAmount > 0) {
          await stripe.customers.createBalanceTransaction(referrer.stripeCustomerId, {
            amount: -creditAmount, // negative = credit
            currency: upcomingInvoice.currency,
            description: 'Referral reward: 1 month free for referring a friend',
          });
          appliedStripeCredit = true;
          log.subscription('referral_stripe_credit', referrer.id, { refereeId, creditAmount });
        }
      } catch (stripeError) {
        log.error('Failed to apply Stripe credit for referral, falling back to expiry extension', stripeError, { referrerId: referrer.id });
        // Fall back to extending subscription expiry
        if (referrer.subscriptionExpiresAt) {
          const newExpiry = new Date(referrer.subscriptionExpiresAt.getTime() + thirtyDays);
          updateData.subscriptionExpiresAt = newExpiry;
        }
      }
    } else if (referrer.subscriptionTier === 'trial' && referrer.trialEndsAt) {
      // Extend trial by 30 days
      const newTrialEnd = new Date(referrer.trialEndsAt.getTime() + thirtyDays);
      updateData.trialEndsAt = newTrialEnd;
    } else if (referrer.subscriptionTier === 'premium' && referrer.subscriptionExpiresAt) {
      // Non-recurring premium (semester) or canceled: extend expiry
      const newExpiry = new Date(referrer.subscriptionExpiresAt.getTime() + thirtyDays);
      updateData.subscriptionExpiresAt = newExpiry;
    } else if (referrer.subscriptionTier === 'free') {
      // Grant new 30-day trial
      const newTrialEnd = new Date(now.getTime() + thirtyDays);
      updateData = {
        subscriptionTier: 'trial',
        subscriptionStatus: 'trialing',
        trialEndsAt: newTrialEnd,
      };
    } else if (!appliedStripeCredit) {
      // Fallback: extend/set subscription expiry
      const baseDate = referrer.subscriptionExpiresAt || now;
      const newExpiry = new Date(Math.max(baseDate.getTime(), now.getTime()) + thirtyDays);
      updateData.subscriptionExpiresAt = newExpiry;
    }

    // Update referrer (if needed) and mark referral as completed
    const transactions = [];
    if (Object.keys(updateData).length > 0) {
      transactions.push(
        prisma.user.update({
          where: { id: referrer.id },
          data: updateData,
        })
      );
    }
    transactions.push(
      prisma.referral.update({
        where: { id: referral.id },
        data: {
          status: 'completed',
          rewardedAt: new Date(),
        },
      })
    );
    await prisma.$transaction(transactions);

    // Create notification for referrer
    await prisma.notification.create({
      data: {
        userId: referrer.id,
        title: 'Referral Reward!',
        message: 'Your friend subscribed to premium! You\'ve earned 1 month of free premium.',
        type: 'referral_reward',
      },
    });

    // Send success email to referrer
    try {
      await sendReferralSuccessEmail({
        email: referrer.email,
        name: referrer.name,
        monthsEarned: 1,
      });
    } catch (emailError) {
      log.error('Failed to send referral success email', emailError, { referrerId: referrer.id });
    }

    log.subscription('referral_rewarded', referrer.id, { refereeId, rewardMonths: 1 });
  } catch (error) {
    log.error('Failed to process referral reward', error, { refereeId });
    // Don't throw - referral reward failure shouldn't affect the main checkout flow
  }
}
