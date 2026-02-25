import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Add v1.4.5
  const version = await prisma.appVersion.upsert({
    where: { version: 'v1.4.5' },
    update: {
      changes: [
        'Flashcard UI improvements: 3D flip animation, mastery progress bars, streamlined study flow',
        'Fix Google Calendar sync timeout, performance, and duplicate events',
        'Fix Orbi mobile keyboard, localStorage quota errors, and OAuth redirects',
      ],
    },
    create: {
      version: 'v1.4.5',
      isBetaOnly: false,
      releasedAt: new Date(),
      changes: [
        'Flashcard UI improvements: 3D flip animation, mastery progress bars, streamlined study flow',
        'Fix Google Calendar sync timeout, performance, and duplicate events',
        'Fix Orbi mobile keyboard, localStorage quota errors, and OAuth redirects',
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
