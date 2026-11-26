import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export const DOCUMENT_EXTRACTION_QUEUE_NAME = 'lifeos.document.extraction';

export interface EnqueueExtractionPayload {
  documentId: string;
  userId: string;
}

export interface IExtractionQueue {
  enqueueExtraction(payload: EnqueueExtractionPayload): Promise<string>;
}

export class NoopExtractionQueue implements IExtractionQueue {
  async enqueueExtraction(payload: EnqueueExtractionPayload): Promise<string> {
    return `local-extraction-${payload.documentId}`;
  }
}

export class BullMqExtractionQueue implements IExtractionQueue {
  private readonly queue: Queue;
  private readonly connection: IORedis;

  constructor(redisUrl: string) {
    this.connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
    this.queue = new Queue(DOCUMENT_EXTRACTION_QUEUE_NAME, {
      connection: this.connection,
    });
  }

  async enqueueExtraction(payload: EnqueueExtractionPayload): Promise<string> {
    try {
      const job = await this.queue.add('extract-document', payload, {
        jobId: `extract-${payload.documentId}-${Date.now()}`,
        removeOnComplete: 500,
        removeOnFail: 500,
      });
      return job.id ?? payload.documentId;
    } catch (err) {
      logger.warn({ err, documentId: payload.documentId }, 'Failed to enqueue extraction job');
      return `fallback-${payload.documentId}`;
    }
  }
}

export function createExtractionQueue(): IExtractionQueue {
  if (env.REDIS_URL && env.NODE_ENV !== 'test') {
    return new BullMqExtractionQueue(env.REDIS_URL);
  }
  return new NoopExtractionQueue();
}
