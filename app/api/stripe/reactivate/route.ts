import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { withRateLimit } from '@/lib/withRateLimit';

export const POST = withRateLimit(async function (req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: token.id },
      select: { stripeSubscriptionId: true, subscriptionStatus: true },
    });

    if (!user?.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 });
    }

    // Check if subscription is actually canceled
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

    if (!subscription.cancel_at_period_end) {
      return NextResponse.json({ error: 'Subscription is already active' }, { status: 400 });
    }

    // Reactivate by removing the cancel_at_period_end flag
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    // Update database status
    await prisma.user.update({
      where: { id: token.id },
      data: { subscriptionStatus: 'active' },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: token.id,
        title: 'Subscription Reactivated',
        message: 'Welcome back! Your Premium subscription has been reactivated.',
        type: 'subscription_active',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reactivate subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to reactivate subscription' },
      { status: 500 }
    );
  }
});
