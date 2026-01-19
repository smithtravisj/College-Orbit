import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { sendSubscriptionCancelledEmail } from '@/lib/email';
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
      select: { stripeSubscriptionId: true, email: true, name: true },
    });

    if (!user?.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    // Cancel at end of billing period (not immediately)
    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    const expiresAt = new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000);
    const expiresAtFormatted = expiresAt.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    // Update database status
    await prisma.user.update({
      where: { id: token.id },
      data: { subscriptionStatus: 'canceled', subscriptionExpiresAt: expiresAt },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: token.id,
        title: 'Subscription Canceled',
        message: 'Your Premium subscription has been canceled. You\'ll retain access until the end of your billing period.',
        type: 'subscription_canceled',
      },
    });

    // Send cancellation email
    try {
      await sendSubscriptionCancelledEmail({
        email: user.email,
        name: user.name,
        expiresAt: expiresAtFormatted,
      });
    } catch (emailError) {
      console.error('Failed to send subscription cancelled email:', emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
});
