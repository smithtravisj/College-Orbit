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
        'Recurring instances now generate 6 months out instead of 2 months',
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
