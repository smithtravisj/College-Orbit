import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { stripe, PRICE_IDS } from '@/lib/stripe';
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

    const { plan } = await req.json();

    if (!plan || !['monthly', 'yearly', 'semester'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    const priceId = plan === 'monthly'
      ? PRICE_IDS.monthly
      : plan === 'yearly'
        ? PRICE_IDS.yearly
        : PRICE_IDS.semester;

    // Get user to check for existing Stripe customer
    const user = await prisma.user.findUnique({
      where: { id: token.id },
      select: { email: true, stripeCustomerId: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let customerId = user.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: token.id },
      });
      customerId = customer.id;

      // Save customer ID to database
      await prisma.user.update({
        where: { id: token.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session - semester is one-time payment, others are subscriptions
    const isSemester = plan === 'semester';

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: isSemester ? 'payment' : 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL}/settings?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL}/pricing?canceled=true`,
      metadata: {
        userId: token.id,
        plan,
      },
      ...(isSemester ? {
        // For one-time payments, create an invoice so it shows in customer portal
        invoice_creation: {
          enabled: true,
        },
      } : {
        subscription_data: {
          metadata: {
            userId: token.id,
            plan,
          },
        },
      }),
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
});
