import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findUnique({
    where: { email: 'demo@collegeorbit.app' },
    select: { id: true, email: true, passwordHash: true }
  });

  if (!user) {
    console.log('User not found!');
    return;
  }

  console.log('User found:', user.email);
  console.log('Has password hash:', !!user.passwordHash);

  if (user.passwordHash) {
    const valid = await bcrypt.compare('demo1234', user.passwordHash);
    console.log('Password valid:', valid);
  }
}

check().finally(() => prisma.$disconnect());
