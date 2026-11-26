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
  const shouldConnectRedis = process.env.WORKER_CONNECT_REDIS === 'true';

  if (shouldConnectRedis) {
    redisConnection = new IORedis(workerEnv.REDIS_URL, {
      maxRetriesPerRequest: null,
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

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Worker received shutdown signal');
  await Promise.all(activeWorkers.map((w) => w.close()));
  if (redisConnection) {
    await redisConnection.quit();
  }
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
