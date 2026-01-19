import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

async function syncSubscriptions() {
  console.log('Starting subscription sync...\n');

  // Find all users with a stripeCustomerId
  const usersWithStripe = await prisma.user.findMany({
    where: {
      stripeCustomerId: { not: null },
    },
    select: {
      id: true,
      email: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      subscriptionTier: true,
      subscriptionStatus: true,
    },
  });

  console.log(`Found ${usersWithStripe.length} users with Stripe customer IDs\n`);

  for (const user of usersWithStripe) {
    console.log(`\nChecking user: ${user.email}`);
    console.log(`  Current tier: ${user.subscriptionTier}, status: ${user.subscriptionStatus}`);

    try {
      // Get subscriptions from Stripe
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId!,
        status: 'all',
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        console.log('  No subscriptions found in Stripe');
        continue;
      }

      const subscription = subscriptions.data[0];
      console.log(`  Stripe subscription status: ${subscription.status}`);

      let newTier: string;
      let newStatus: string;

      switch (subscription.status) {
        case 'active':
        case 'trialing':
          newTier = 'premium';
          newStatus = 'active';
          break;
        case 'past_due':
          newTier = 'premium';
          newStatus = 'past_due';
          break;
        case 'canceled':
        case 'unpaid':
          newTier = 'free';
          newStatus = 'canceled';
          break;
        default:
          newTier = 'free';
          newStatus = 'none';
      }

      // Always update to ensure expiry date and plan are correct
      const newPlan = subscription.items.data[0]?.price.recurring?.interval === 'year' ? 'yearly' : 'monthly';
      const newExpiresAt = new Date(subscription.current_period_end * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionTier: newTier,
          subscriptionStatus: newStatus,
          stripeSubscriptionId: subscription.id,
          subscriptionPlan: newPlan,
          subscriptionExpiresAt: newExpiresAt,
        },
      });
      console.log(`  ✓ Updated: tier=${newTier}, status=${newStatus}, plan=${newPlan}, expires=${newExpiresAt.toISOString()}`);
      console.log(`    Stripe period end: ${new Date(subscription.current_period_end * 1000).toISOString()}`);
    } catch (error) {
      console.error(`  Error checking user ${user.email}:`, error);
    }
  }

  // Also check for expired trials
  console.log('\n\nChecking for expired trials...');
  const expiredTrials = await prisma.user.findMany({
    where: {
      subscriptionTier: 'trial',
      trialEndsAt: { lt: new Date() },
    },
  });

  console.log(`Found ${expiredTrials.length} expired trials`);

  for (const user of expiredTrials) {
    // Check if they have an active Stripe subscription first
    if (user.stripeCustomerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        console.log(`  ${user.email}: Has active subscription, upgrading to premium`);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionTier: 'premium',
            subscriptionStatus: 'active',
          },
        });
        continue;
      }
    }

    console.log(`  ${user.email}: Trial expired, downgrading to free`);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: 'free',
        subscriptionStatus: 'none',
      },
    });
  }

  console.log('\n✓ Sync complete!');
}

syncSubscriptions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
