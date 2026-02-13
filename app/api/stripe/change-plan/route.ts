import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe, PRICE_IDS } from '@/lib/stripe';
import { sendPlanChangedEmail } from '@/lib/email';
import { withRateLimit } from '@/lib/withRateLimit';
import { getAuthUserId } from '@/lib/getAuthUserId';

export const POST = withRateLimit(async function (req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to continue' }, { status: 401 });
    }

    const { plan } = await req.json();

    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeSubscriptionId: true, subscriptionPlan: true, email: true, name: true },
    });

    if (!user?.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    if (user.subscriptionPlan === plan) {
      return NextResponse.json({ error: 'You are already on this plan' }, { status: 400 });
    }

    const priceId = plan === 'monthly' ? PRICE_IDS.monthly : PRICE_IDS.yearly;

    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

    // Update subscription to change at end of current period (no proration, no immediate charge)
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: priceId,
        },
      ],
      proration_behavior: 'none', // No immediate charge
      metadata: {
        ...subscription.metadata,
        plan,
      },
    });

    // Update database
    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionPlan: plan },
    });

    const effectiveDate = new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    // Send plan changed email
    try {
      await sendPlanChangedEmail({
        email: user.email,
        name: user.name,
        oldPlan: user.subscriptionPlan as 'monthly' | 'yearly',
        newPlan: plan as 'monthly' | 'yearly',
        effectiveDate,
      });
    } catch (emailError) {
      console.error('Failed to send plan changed email:', emailError);
    }

    return NextResponse.json({
      success: true,
      plan,
      effectiveDate,
      message: `Switched to ${plan} billing! Your new rate takes effect on ${effectiveDate}.`
    });
  } catch (error) {
    console.error('Change plan error:', error);
    return NextResponse.json(
      { error: 'Failed to change plan. Please try again or contact support.' },
      { status: 500 }
    );
  }
});
