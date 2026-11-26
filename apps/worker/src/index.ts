import { workerEnv } from './config/env';
import { logger } from './config/logger';
import { QUEUE_NAMES } from './queues/queue-names';

function bootstrap(): void {
  logger.info(
    {
      env: workerEnv.NODE_ENV,
      queues: Object.values(QUEUE_NAMES),
    },
    'LifeOS background worker foundation initialized (queue processors register in Day 4-5)',
  );
}

bootstrap();

function shutdown(signal: string): void {
  logger.info({ signal }, 'Worker received shutdown signal');
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
