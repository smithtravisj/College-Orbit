import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Add v1.5.0
  const version = await prisma.appVersion.upsert({
    where: { version: 'v1.5.0' },
    update: {
      changes: [
        'Recipes: save, organize, and manage recipes with AI-powered extraction from URLs',
      ],
    },
    create: {
      version: 'v1.5.0',
      isBetaOnly: false,
      releasedAt: new Date(),
      changes: [
        'Recipes: save, organize, and manage recipes with AI-powered extraction from URLs',
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
