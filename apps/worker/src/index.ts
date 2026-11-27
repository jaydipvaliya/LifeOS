import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { workerEnv } from './config/env';
import { logger } from './config/logger';
import { processExtractionJob } from './processors/extraction.processor';
import { processReminderJob } from './processors/reminder.processor';
import { QUEUE_NAMES } from './queues/queue-names';

const activeWorkers: Worker[] = [];
let redisConnection: IORedis | null = null;

function bootstrap(): void {
  const shouldConnectRedis =
    process.env.WORKER_CONNECT_REDIS === 'true' || workerEnv.NODE_ENV === 'production';

  if (shouldConnectRedis) {
    redisConnection = new IORedis(workerEnv.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
    redisConnection.on('error', (err) => {
      logger.error({ err }, 'Worker Redis connection error');
    });

    const reminderWorker = new Worker(QUEUE_NAMES.REMINDER_DISPATCH, processReminderJob, {
      connection: redisConnection,
      concurrency: 5,
    });

    reminderWorker.on('failed', (job, err) => {
      logger.error({ err, jobId: job?.id }, 'Reminder job failed');
    });

    const extractionWorker = new Worker(QUEUE_NAMES.DOCUMENT_EXTRACTION, processExtractionJob, {
      connection: redisConnection,
      concurrency: 3,
    });

    extractionWorker.on('failed', (job, err) => {
      logger.error({ err, jobId: job?.id }, 'Extraction job failed');
    });

    activeWorkers.push(reminderWorker, extractionWorker);
  }

  logger.info(
    {
      env: workerEnv.NODE_ENV,
      queues: Object.values(QUEUE_NAMES),
      redisWorkersStarted: activeWorkers.length,
    },
    'LifeOS background worker initialized',
  );
}

bootstrap();

let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info({ signal }, 'Worker received shutdown signal');

  const forceTimer = setTimeout(() => {
    logger.error('Worker forced shutdown after 10s grace period expired');
    process.exit(1);
  }, 10_000);
  forceTimer.unref();

  await Promise.all(activeWorkers.map((w) => w.close()));
  if (redisConnection) {
    await redisConnection.quit();
  }
  process.exit(0);
}

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled Promise Rejection in worker process');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught Exception in worker process');
  void shutdown('uncaughtException');
});

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
