import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Add v1.4.3
  const version = await prisma.appVersion.upsert({
    where: { version: 'v1.4.3' },
    update: {
      changes: [
        'Google Calendar Sync is no longer in beta',
        'Fix oversized select dropdowns on mobile devices',
      ],
    },
    create: {
      version: 'v1.4.3',
      isBetaOnly: false,
      releasedAt: new Date(),
      changes: [
        'Google Calendar Sync is no longer in beta',
        'Fix oversized select dropdowns on mobile devices',
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
