import { PrismaClient } from '@prisma/client';

// Use a global variable to store the Prisma instance to avoid creating multiple instances in development
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    errorFormat: 'minimal',
    // Optimize connection handling
    datasourceUrl: process.env.DATABASE_URL,
  });

// Keep the connection alive in development to avoid cold start delays
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Eagerly connect in production to reduce first-query latency
if (process.env.NODE_ENV === 'production') {
  prisma.$connect().catch(console.error);
}
