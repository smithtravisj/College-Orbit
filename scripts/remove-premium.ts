import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.update({
    where: { email: 'byusurvivaltool.dispose286@passmail.net' },
    data: {
      subscriptionTier: 'free',
      subscriptionStatus: 'canceled',
      lifetimePremium: false,
      stripeSubscriptionId: null,
      subscriptionExpiresAt: null,
      subscriptionPlan: null,
    },
  });
  console.log('Updated user:', result.email);
  console.log('  subscriptionTier:', result.subscriptionTier);
  console.log('  subscriptionStatus:', result.subscriptionStatus);
  console.log('  lifetimePremium:', result.lifetimePremium);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
