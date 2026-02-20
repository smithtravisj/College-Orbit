import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Add v1.4.5
  const version = await prisma.appVersion.upsert({
    where: { version: 'v1.4.5' },
    update: {
      changes: [
        'Flashcard 3D flip animation when revealing answers',
        'Mastery progress bars on deck list with percentage indicators',
        'Simplified study buttons: Study (due) and Review All',
        'Delete confirmation dialog for decks',
        'Bigger, better rating buttons with 2x2 mobile grid and press feedback',
        'Save & Add Another button for faster card creation',
        'Full text wrapping on card list items',
        'Loading skeleton when opening a deck',
        'Improved empty state for flashcard decks',
        'New decks auto-open after creation for immediate card adding',
      ],
    },
    create: {
      version: 'v1.4.5',
      isBetaOnly: false,
      releasedAt: new Date(),
      changes: [
        'Flashcard 3D flip animation when revealing answers',
        'Mastery progress bars on deck list with percentage indicators',
        'Simplified study buttons: Study (due) and Review All',
        'Delete confirmation dialog for decks',
        'Bigger, better rating buttons with 2x2 mobile grid and press feedback',
        'Save & Add Another button for faster card creation',
        'Full text wrapping on card list items',
        'Loading skeleton when opening a deck',
        'Improved empty state for flashcard decks',
        'New decks auto-open after creation for immediate card adding',
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
