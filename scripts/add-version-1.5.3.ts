import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Add v1.5.3
  const version = await prisma.appVersion.upsert({
    where: { version: 'v1.5.3' },
    update: {
      changes: [
        'Dashboard: event preview modal now supports editing events inline',
        'Calendar: fix excluded dates not rendering when returned as ISO timestamps',
        'Grade Tracker: fix column layout overflow and default grade to blank placeholder',
        'Extension: completing work items now awards XP and updates streaks',
      ],
    },
    create: {
      version: 'v1.5.3',
      isBetaOnly: false,
      releasedAt: new Date(),
      changes: [
        'Dashboard: event preview modal now supports editing events inline',
        'Calendar: fix excluded dates not rendering when returned as ISO timestamps',
        'Grade Tracker: fix column layout overflow and default grade to blank placeholder',
        'Extension: completing work items now awards XP and updates streaks',
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
