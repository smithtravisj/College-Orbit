import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Add v1.5.0
  const version = await prisma.appVersion.upsert({
    where: { version: 'v1.5.0' },
    update: {
      changes: [
        'Recipes: save, organize, and edit recipes with step groups and ingredient management',
        'AI recipe extraction: paste a URL to auto-import recipes with grouped steps and ingredients',
        'Add recipe ingredients to your grocery list with one click',
        'Recipes now appear in global search, Orbi AI context, and data deletion',
        'Updated Terms of Service, Privacy Policy, and Help/FAQ pages for recipe features',
      ],
    },
    create: {
      version: 'v1.5.0',
      isBetaOnly: false,
      releasedAt: new Date(),
      changes: [
        'Recipes: save, organize, and edit recipes with step groups and ingredient management',
        'AI recipe extraction: paste a URL to auto-import recipes with grouped steps and ingredients',
        'Add recipe ingredients to your grocery list with one click',
        'Recipes now appear in global search, Orbi AI context, and data deletion',
        'Updated Terms of Service, Privacy Policy, and Help/FAQ pages for recipe features',
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
