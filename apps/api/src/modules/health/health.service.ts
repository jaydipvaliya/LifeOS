import type { HealthStatus } from '@lifeos/shared-types';
import { env } from '../../config/env';
import { checkDatabaseConnection } from '../../config/prisma';

export class HealthService {
  async getHealthStatus(): Promise<HealthStatus> {
    const dbStatus = await checkDatabaseConnection();

    return {
      status: dbStatus === 'disconnected' ? 'degraded' : 'ok',
      service: '@lifeos/api',
      version: '0.1.0',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: {
        database: dbStatus,
        redis: env.REDIS_URL ? 'configured' : 'unconfigured',
        storage: env.S3_BUCKET ? 'configured' : 'unconfigured',
      },
    };
  }
}
