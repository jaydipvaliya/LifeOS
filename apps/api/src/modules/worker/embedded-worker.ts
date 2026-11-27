import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { prisma } from '../../config/prisma';
import { createAiProvider } from '../ai/ai-provider';
import { LocalOcrService } from '../ai/ocr-service';
import { PrismaDocumentsRepository } from '../documents/documents.repository';
import { DOCUMENT_EXTRACTION_QUEUE_NAME } from '../intelligence/extraction.queue';
import { ExtractionService } from '../intelligence/extraction.service';
import { PrismaIntelligenceRepository } from '../intelligence/intelligence.repository';
import { REMINDER_QUEUE_NAME } from '../reminders/reminder-queue';
import { createStorageService } from '../storage';

interface EmbeddedWorkerHandle {
  close(): Promise<void>;
}

/**
 * Starts in-process BullMQ workers when RUN_EMBEDDED_WORKER=true (used on single-service free tiers).
 */
export function startEmbeddedWorkers(): EmbeddedWorkerHandle | null {
  if (!env.RUN_EMBEDDED_WORKER || !env.REDIS_URL || env.NODE_ENV === 'test') {
    return null;
  }

  const connection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
  connection.on('error', (err) => {
    logger.error({ err }, 'Embedded BullMQ Redis connection error');
  });

  const storage = createStorageService();
  const extractionService = new ExtractionService(
    new PrismaDocumentsRepository(prisma),
    new PrismaIntelligenceRepository(prisma),
    storage.storageService,
    new LocalOcrService(),
    createAiProvider(),
  );

  const extractionWorker = new Worker<{ documentId: string; userId: string }>(
    DOCUMENT_EXTRACTION_QUEUE_NAME,
    async (job) => {
      await extractionService.analyzeDocument(job.data.userId, job.data.documentId);
      return { documentId: job.data.documentId, status: 'extracted' };
    },
    { connection, concurrency: 2 },
  );
  extractionWorker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, 'Embedded extraction worker job failed');
  });

  const reminderWorker = new Worker<{
    reminderId: string;
    userId: string;
    title: string;
    hideSensitiveDetails?: boolean;
    pushTokens?: string[];
  }>(
    REMINDER_QUEUE_NAME,
    async (job) => {
      const privacyMasked = job.data.hideSensitiveDetails ?? true;
      const body = privacyMasked
        ? 'You have an upcoming responsibility that needs your attention.'
        : job.data.title;
      const tokens = (job.data.pushTokens ?? []).filter(
        (t) => t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['),
      );
      if (tokens.length === 0) {
        return { dispatchedCount: 0, privacyMasked };
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      if (env.EXPO_ACCESS_TOKEN) {
        headers.Authorization = `Bearer ${env.EXPO_ACCESS_TOKEN}`;
      }

      const messages = tokens.map((to) => ({
        to,
        sound: 'default',
        title: 'LifeOS Reminder',
        body,
        channelId: 'lifeos-reminders',
        data: { reminderId: job.data.reminderId },
      }));

      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers,
        body: JSON.stringify(messages),
      });
      if (!res.ok) {
        logger.warn(
          { status: res.status },
          'Expo Push Service returned non-2xx in embedded worker',
        );
      }
      return { dispatchedCount: res.ok ? tokens.length : 0, privacyMasked };
    },
    { connection, concurrency: 3 },
  );
  reminderWorker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, 'Embedded reminder worker job failed');
  });

  logger.info('Embedded BullMQ workers started inside API process');

  return {
    async close() {
      await Promise.all([extractionWorker.close(), reminderWorker.close()]);
      await connection.quit();
    },
  };
}
