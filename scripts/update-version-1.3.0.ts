import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const version = await prisma.appVersion.update({
    where: { version: 'v1.3.0' },
    data: {
      changes: [
        'Added 20+ visual themes including Cartoon, Cyberpunk, Lo-fi, Jungle, Glassmorphism, Steampunk, Skeuomorphism, Noir, Sakura, Winter, Halloween, and more — each with custom backgrounds, animations, and interactive touches',
        'Every theme now has unique hover effects, button animations, nav bar interactions, and styling that set each theme apart',
      ],
    },
  });

  console.log('Updated version:', version);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
