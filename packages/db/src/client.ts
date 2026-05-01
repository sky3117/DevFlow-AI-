import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development (hot reload).
// This pattern is safe for long-running Node.js processes only —
// avoid in serverless environments where instances may not be reused.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
