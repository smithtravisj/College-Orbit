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
        'Three new study modes: classic flashcards, type answer, and match',
        'Flashcard settings for cards per session, daily goals, shuffle, and more',
        'Edit and delete cards directly during study sessions',
        'Flashcards added to tools visibility settings',
        'Fix release notes sorting when versions share the same date',
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
        'Unique hover effects, button animations, and nav bar interactions per theme',
        'Random daily theme option with frosted translucent cards for select themes',
        'Spotify integration for now playing display',
        'Pomodoro mini player that follows you across pages',
        'Pet companions with 12 animated pixel art animals',
        'Daily challenges with 3 randomized tasks per day and sweep bonus XP',
        'Word counter tool improvements',
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
        'Orbi AI conversation memory, flashcard and grade awareness, and suggested follow-up actions',
        'Google Calendar sync',
        'Ambient focus sounds',
        'Dynamic accent text contrast and accent-aware tab colors across all pages',
        'Solid panel backgrounds for modals and toasts to prevent transparency bleed-through',
        'File converter with image, PDF, and Office file compression (three compression levels)',
        'Flashcard UI improvements: 3D flip animation, mastery progress bars',
      ],
    },
    {
      version: 'v1.2.1',
      isBetaOnly: false,
      releasedAt: new Date('2026-02-22'),
      changes: [
        'Fix Orbi timezone handling so tasks without a time appear as all-day deadlines',
        'Fix Orbi stripping course names from task titles when course is already linked',
        'Fix Orbi mobile keyboard and localStorage quota errors',
        'Fix AI chat creating duplicate items instead of updating existing ones',
        'Fix oversized select dropdowns on mobile devices',
        'Google Calendar sync is no longer in beta',
      ],
    },
    {
      version: 'v1.3.0',
      isBetaOnly: false,
      releasedAt: new Date('2026-02-27'),
      changes: [
        'Recipes: save, organize, and manage recipes with AI-powered extraction from URLs',
        'Per-ingredient add-to-grocery buttons and mobile UX improvements',
        'Dashboard event preview modal with inline editing',
        'Extension: completing work items now awards XP and updates streaks',
        'Fix Google Calendar sync timeout and performance',
        'Fix grade tracker column layout overflow',
      ],
    },
    {
      version: 'v1.3.1',
      isBetaOnly: false,
      releasedAt: new Date('2026-02-28'),
      changes: [
        'Calendar: new Agenda view for a chronological list of events',
        'Calendar: right-click context menus for quick actions',
        'Calendar: recurring calendar events with daily, weekly, monthly, and custom patterns',
        'Quick Add: now supports creating calendar events',
        'Recurring exam support with weekly, monthly, and custom recurrence',
        'Timeline: context menu, refresh button, and quick add button in header',
        'Animated modal transitions across all modals',
        'Course preview modal with structured detail view',
        'Duplicate title detection when creating work items and exams',
        '"Working On" badge in modal headers alongside "Completed"',
        'UI polish: excluded dates redesigned, compact tag pills, consistent modal styling',
      ],
    },
    {
      version: 'v1.3.2',
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
