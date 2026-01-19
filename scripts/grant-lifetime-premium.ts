import { prisma } from '../lib/prisma';

async function grantLifetimePremium(userIdOrEmail: string) {
  // Find user by ID or email
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: userIdOrEmail },
        { email: userIdOrEmail },
      ],
    },
  });

  if (!user) {
    console.error('User not found:', userIdOrEmail);
    process.exit(1);
  }

  console.log('Found user:', user.email, '(', user.id, ')');

  // Grant lifetime premium
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lifetimePremium: true,
      subscriptionTier: 'premium',
      subscriptionStatus: 'active',
    },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: 'Lifetime Premium Granted!',
      message: 'You have been granted lifetime Premium access by an admin. Enjoy all premium features forever!',
      type: 'subscription_active',
    },
  });

  console.log('✓ Granted lifetime premium to', user.email);
  console.log('✓ Created notification for user');
}

// Get user ID or email from command line argument
const userIdOrEmail = process.argv[2];

if (!userIdOrEmail) {
  console.error('Usage: npx tsx --env-file=.env.local scripts/grant-lifetime-premium.ts <userId or email>');
  process.exit(1);
}

grantLifetimePremium(userIdOrEmail)
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
