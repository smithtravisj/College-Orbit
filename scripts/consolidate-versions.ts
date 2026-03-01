import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Delete all existing versions
  const deleted = await prisma.appVersion.deleteMany({});
  console.log(`Deleted ${deleted.count} existing versions`);

  // Create condensed versions
  const versions = [
    {
      version: 'v1.0.0',
      isBetaOnly: false,
      releasedAt: new Date('2026-01-24'),
      changes: [
        'Course management with meeting times, locations, and quick links',
        'Unified work system for tasks, assignments, readings, and projects',
        'Calendar with month, week, and day views plus iCal export',
        'Exam tracker with dates, times, locations, and reminders',
        'Rich text notes with folders and course organization',
        'GPA calculator with grade tracking and what-if projections',
        'Canvas LMS integration for syncing courses, assignments, and grades',
        'Timeline dashboard showing your day and week at a glance',
        'Flashcards with spaced repetition for studying',
        'Progress system with XP, achievements, and streaks',
        'Pomodoro timer, word counter, and other productivity tools',
        'University themes with school colors and dark/light modes',
        'Colorblind accessibility options',
        'Recurring tasks, assignments, and exams',
        'File attachments and external links on all items',
        'Push notifications and email reminders',
      ],
    },
    {
      version: 'v1.0.1',
      isBetaOnly: false,
      releasedAt: new Date('2026-02-04'),
      changes: [
        'Flashcard study modes: classic, type answer, and match',
      ],
    },
    {
      version: 'v1.0.2',
      isBetaOnly: false,
      releasedAt: new Date('2026-02-05'),
      changes: [
        'Fix tools visibility settings not saving properly',
        'Fix double v in version display',
        'Rename Canvas Badges to LMS Integration Badges in settings',
      ],
    },
    {
      version: 'v1.1.0',
      isBetaOnly: false,
      releasedAt: new Date('2026-02-07'),
      changes: [
        '20+ visual themes including Cartoon, Cyberpunk, Lo-fi, Sakura, Winter, and more',
        'Pomodoro mini player that follows you across pages',
        'Pet companions with 12 animated pixel art animals',
        'Daily challenges with 3 randomized tasks per day and sweep bonus XP',
      ],
    },
    {
      version: 'v1.1.1',
      isBetaOnly: false,
      releasedAt: new Date('2026-02-08'),
      changes: [
        'Fix recurring task start date timezone offset',
        'Fix random theme background not loading on first visit',
        'Fix level up toast not showing during flashcard reviews',
        'Recurring instances now generate 6 months ahead',
      ],
    },
    {
      version: 'v1.2.0',
      isBetaOnly: false,
      releasedAt: new Date('2026-02-20'),
      changes: [
        'Orbi AI assistant with chat, work breakdown, note summarization, and flashcard generation',
        'Google Calendar sync',
        'Ambient focus sounds',
        'Dynamic accent text contrast across all pages',
        'File converter with image, PDF, and Office file compression',
        'Flashcard UI improvements: 3D flip animation, mastery progress bars',
      ],
    },
    {
      version: 'v1.2.1',
      isBetaOnly: false,
      releasedAt: new Date('2026-02-22'),
      changes: [
        'Orbi AI bug fixes and improvements',
        'Fix oversized select dropdowns on mobile devices',
        'Google Calendar sync is no longer in beta',
      ],
    },
    {
      version: 'v1.3.0',
      isBetaOnly: false,
      releasedAt: new Date('2026-02-28'),
      changes: [
        'Recipes: save, organize, and manage recipes with AI-powered extraction from URLs',
        'Calendar: new Agenda view for a chronological list of events',
        'Calendar: right-click context menus and recurring calendar events',
        'Recurring exam support with weekly, monthly, and custom recurrence',
        'Quick Add: now supports creating calendar events',
        'Course preview modal with structured detail view',
        'Animated modal transitions across all modals',
        'Bug fixes and UI improvements',
      ],
    },
    {
      version: 'v1.3.1',
      isBetaOnly: false,
      releasedAt: new Date('2026-03-01'),
      changes: [
        'Search: use -term to exclude items from results (e.g. "canvas -homework")',
        'Search: now matches tags, type, file names, and working on status',
        'Bulk edit: added "Working On" action for work items',
        'Tags: click the tag input to browse all available tags',
      ],
    },
  ];

  for (const v of versions) {
    const created = await prisma.appVersion.create({ data: v });
    console.log(`Created ${created.version} (${created.releasedAt.toISOString().split('T')[0]})`);
  }

  console.log(`\nDone! Created ${versions.length} consolidated versions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
