import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: {
      emailVerified: null,
    },
    data: {
      emailVerified: new Date(),
    },
  });

  console.log(`Marked ${result.count} existing users as verified`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
