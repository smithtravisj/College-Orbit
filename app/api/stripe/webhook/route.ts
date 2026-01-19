import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendSubscriptionStartedEmail } from '@/lib/email';
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
    console.error('Webhook signature verification failed:', err);
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
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('No userId in checkout session metadata');
    return;
  }

  const subscriptionId = session.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const plan = (session.metadata?.plan || 'monthly') as 'monthly' | 'yearly';

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
    console.error('Failed to send subscription started email:', emailError);
  }

  console.log(`User ${userId} subscribed to ${plan} plan`);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    // Try to find user by subscription ID
    const user = await prisma.user.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });
    if (!user) {
      console.error('No user found for subscription:', subscription.id);
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

  console.log(`Updated subscription for user ${userId}: ${subscriptionTier}, ${subscriptionStatus}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  // Find user by subscription ID if not in metadata
  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : await prisma.user.findFirst({ where: { stripeSubscriptionId: subscription.id } });

  if (!user) {
    console.error('No user found for deleted subscription:', subscription.id);
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

  console.log(`Subscription canceled for user ${user.id}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error('No user found for customer:', customerId);
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

  console.log(`Payment failed for user ${user.id}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = (invoice as unknown as { subscription: string | null }).subscription;

  if (!subscriptionId) return; // Not a subscription invoice

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error('No user found for customer:', customerId);
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

    console.log(`Payment succeeded, restored access for user ${user.id}`);
  }
}
