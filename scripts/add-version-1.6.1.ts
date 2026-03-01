import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Add v1.6.1
  const version = await prisma.appVersion.upsert({
    where: { version: 'v1.6.1' },
    update: {
      changes: [
        '"Working On" badge now shows in modal headers alongside "Completed"',
        'Badges flow inline with titles instead of wrapping to a new line',
        'Cleaner timeline cards',
      ],
    },
    create: {
      version: 'v1.6.1',
      isBetaOnly: false,
      releasedAt: new Date(),
      changes: [
        '"Working On" badge now shows in modal headers alongside "Completed"',
        'Badges flow inline with titles instead of wrapping to a new line',
        'Cleaner timeline cards',
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
