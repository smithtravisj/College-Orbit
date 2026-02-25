import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Add v1.5.2
  const version = await prisma.appVersion.upsert({
    where: { version: 'v1.5.2' },
    update: {
      changes: [
        'Orbi AI: fix timezone handling so tasks without a time appear as all-day deadlines',
        'Orbi AI: strip course name from task titles when course is already linked',
      ],
    },
    create: {
      version: 'v1.5.2',
      isBetaOnly: false,
      releasedAt: new Date(),
      changes: [
        'Orbi AI: fix timezone handling so tasks without a time appear as all-day deadlines',
        'Orbi AI: strip course name from task titles when course is already linked',
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
