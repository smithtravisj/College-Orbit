import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Add v1.6.0
  const version = await prisma.appVersion.upsert({
    where: { version: 'v1.6.0' },
    update: {
      changes: [
        'Calendar: new Agenda view for a chronological list of events',
        'Calendar: right-click context menu for quick actions (complete, edit, delete)',
        'Calendar: recurring calendar events with daily, weekly, monthly, and custom patterns',
        'Quick Add: now supports creating calendar events (replaced Course type)',
        'Exams: recurring exam support with weekly, monthly, and custom recurrence',
        'Timeline: context menu, refresh button, and quick add button in header',
        'Modals: animated open/close transitions across all modals app-wide',
        'Courses: new course preview modal with structured detail view',
        'Duplicate title detection when creating work items and exams',
        'UI polish: excluded dates redesigned as scrollable list, compact tag pills, consistent modal styling',
        'Various bug fixes and improvements',
      ],
    },
    create: {
      version: 'v1.6.0',
      isBetaOnly: false,
      releasedAt: new Date(),
      changes: [
        'Calendar: new Agenda view for a chronological list of events',
        'Calendar: right-click context menu for quick actions (complete, edit, delete)',
        'Calendar: recurring calendar events with daily, weekly, monthly, and custom patterns',
        'Quick Add: now supports creating calendar events (replaced Course type)',
        'Exams: recurring exam support with weekly, monthly, and custom recurrence',
        'Timeline: context menu, refresh button, and quick add button in header',
        'Modals: animated open/close transitions across all modals app-wide',
        'Courses: new course preview modal with structured detail view',
        'Duplicate title detection when creating work items and exams',
        'UI polish: excluded dates redesigned as scrollable list, compact tag pills, consistent modal styling',
        'Various bug fixes and improvements',
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
