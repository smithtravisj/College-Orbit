import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Add v1.4.3
  const version = await prisma.appVersion.upsert({
    where: { version: 'v1.4.3' },
    update: {
      changes: [
        'Fix Google Calendar sync: assignments due at 11:59 PM now correctly export as all-day events',
        'Fix Google Calendar sync exporting items to wrong date due to UTC timezone conversion',
        'Fix Google Calendar sync creating duplicate events in College Orbit when exporting classes',
        'Prevent re-importing previously exported deadlines, exams, and work items from Google Calendar',
        'Fix oversized select dropdowns on mobile devices',
        'Remove beta badge from Google Calendar Sync',
      ],
    },
    create: {
      version: 'v1.4.3',
      isBetaOnly: false,
      releasedAt: new Date(),
      changes: [
        'Fix Google Calendar sync: assignments due at 11:59 PM now correctly export as all-day events',
        'Fix Google Calendar sync exporting items to wrong date due to UTC timezone conversion',
        'Fix Google Calendar sync creating duplicate events in College Orbit when exporting classes',
        'Prevent re-importing previously exported deadlines, exams, and work items from Google Calendar',
        'Fix oversized select dropdowns on mobile devices',
        'Remove beta badge from Google Calendar Sync',
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
