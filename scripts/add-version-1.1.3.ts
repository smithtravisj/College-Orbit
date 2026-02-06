import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const version = await prisma.appVersion.upsert({
    where: { version: '1.1.3' },
    update: {},
    create: {
      version: '1.1.3',
      isBetaOnly: false,
      changes: [
        {
          type: 'feature',
          title: 'Spotify Integration',
          description: 'Connect your Spotify account to see what\'s playing and control playback from anywhere in College Orbit (Premium feature, coming soon)',
        },
        {
          type: 'improvement',
          title: 'Pomodoro Mini Player',
          description: 'Improved mini player behavior - X button now resets timer, dismissed state persists across refresh and resets on new session',
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
