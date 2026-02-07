import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const version = await prisma.appVersion.upsert({
    where: { version: 'v1.3.5' },
    update: {},
    create: {
      version: 'v1.3.5',
      isBetaOnly: false,
      releasedAt: new Date('2026-02-06T22:00:00'),
      changes: [
        'Fix recurring task start date being off by one day due to timezone parsing',
        'Fix random theme background not loading',
        'Fix recurring task deletion now removes all instances',
        'Fix next recurring instance no longer appears immediately after completing one',
        'Recurring instances now generate 6 months out instead of 2 months',
        'Faster recurring task creation with background processing',
        'Updated landing page, onboarding tour, FAQ, and search index for recent features',
        'Daily challenge reward data now included in export/import/delete',
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
