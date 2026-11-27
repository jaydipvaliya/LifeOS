import type { HealthStatus } from '@lifeos/shared-types';
import IORedis from 'ioredis';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { checkDatabaseConnection } from '../../config/prisma';

async function checkRedisConnection(): Promise<
  'configured' | 'connected' | 'disconnected' | 'unconfigured'
> {
  if (!env.REDIS_URL) {
    return 'unconfigured';
  }
  if (env.NODE_ENV === 'test') {
    return 'configured';
  }

  const client = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    connectTimeout: 1500,
    lazyConnect: true,
    retryStrategy: () => null,
  });

  try {
    await client.connect();
    const pong = await client.ping();
    return pong === 'PONG' ? 'connected' : 'disconnected';
  } catch (err) {
    logger.warn({ err }, 'Redis readiness ping failed');
    return 'disconnected';
  } finally {
    client.disconnect();
  }
}

export class HealthService {
  async getHealthStatus(): Promise<HealthStatus> {
    const [dbStatus, redisStatus] = await Promise.all([
      checkDatabaseConnection(),
      checkRedisConnection(),
    ]);

    const isDegraded = dbStatus === 'disconnected' || redisStatus === 'disconnected';

    return {
      status: isDegraded ? 'degraded' : 'ok',
      service: '@lifeos/api',
      version: '0.1.0',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: {
        database: dbStatus,
        redis: redisStatus,
        storage: env.STORAGE_DRIVER === 'local' || env.S3_BUCKET ? 'configured' : 'unconfigured',
      },
    };
  }
}
