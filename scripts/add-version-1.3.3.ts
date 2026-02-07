import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const version = await prisma.appVersion.upsert({
    where: { version: '1.3.3' },
    update: {},
    create: {
      version: '1.3.3',
      isBetaOnly: false,
      releasedAt: new Date('2026-02-06T19:15:00'),
      changes: [
        {
          type: 'feature',
          title: 'Random Daily Theme',
          description: 'New "Random" option in visual themes that gives you a different theme every day',
        },
        {
          type: 'improvement',
          title: 'Translucent Theme Cards',
          description: 'Aquarium, Cozy, Spring, and Sakura themes now have translucent frosted cards that let background animations peek through',
        },
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
