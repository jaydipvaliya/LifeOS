import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { logger } from './logger';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
          ]
        : [{ emit: 'event', level: 'error' }],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function checkDatabaseConnection(): Promise<
  'connected' | 'disconnected' | 'unconfigured'
> {
  if (!env.DATABASE_URL) {
    return 'unconfigured';
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    return 'connected';
  } catch (err) {
    logger.warn({ err }, 'PostgreSQL health check failed');
    return 'disconnected';
  }
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
