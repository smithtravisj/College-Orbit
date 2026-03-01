import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Add v1.6.2
  const version = await prisma.appVersion.upsert({
    where: { version: 'v1.6.2' },
    update: {
      changes: [
        'Search: use -term to exclude items from results (e.g. "canvas -homework")',
        'Search: now matches tags, type, file names, and working on status',
        'Bulk edit: added "Working On" action for work items',
        'Tags: click the tag input to browse all available tags',
      ],
    },
    create: {
      version: 'v1.6.2',
      isBetaOnly: false,
      releasedAt: new Date(),
      changes: [
        'Search: use -term to exclude items from results (e.g. "canvas -homework")',
        'Search: now matches tags, type, file names, and working on status',
        'Bulk edit: added "Working On" action for work items',
        'Tags: click the tag input to browse all available tags',
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
