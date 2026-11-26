import type { HealthStatus } from '@lifeos/shared-types';
import { env } from '../../config/env';

export class HealthService {
  getHealthStatus(): HealthStatus {
    return {
      status: 'ok',
      service: '@lifeos/api',
      version: '0.1.0',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: {
        database: env.DATABASE_URL ? 'configured' : 'unconfigured',
        redis: env.REDIS_URL ? 'configured' : 'unconfigured',
        storage: env.S3_BUCKET ? 'configured' : 'unconfigured',
      },
    };
  }
}
