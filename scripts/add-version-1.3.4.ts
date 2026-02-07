import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const version = await prisma.appVersion.upsert({
    where: { version: '1.3.4' },
    update: {},
    create: {
      version: '1.3.4',
      isBetaOnly: false,
      releasedAt: new Date('2026-02-06T20:19:00'),
      changes: [
        'New daily challenges system — complete 3 randomized challenges each day for XP rewards',
        'Sweep bonus: earn +25 XP for completing all 3 daily challenges',
        'Word counter tool improvements',
      ],
    },
  });

  console.log('Created version:', version);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
