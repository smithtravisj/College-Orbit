import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Add v1.5.1
  const version = await prisma.appVersion.upsert({
    where: { version: 'v1.5.1' },
    update: {
      changes: [
        'Recipes: per-ingredient add-to-grocery buttons and mobile UX improvements',
      ],
    },
    create: {
      version: 'v1.5.1',
      isBetaOnly: false,
      releasedAt: new Date(),
      changes: [
        'Recipes: per-ingredient add-to-grocery buttons and mobile UX improvements',
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
