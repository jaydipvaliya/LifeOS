import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export const REMINDER_QUEUE_NAME = 'lifeos.reminder.dispatch';

export interface EnqueueReminderPayload {
  reminderId: string;
  userId: string;
  title: string;
  remindAt: Date;
}

export interface IReminderQueue {
  scheduleReminder(payload: EnqueueReminderPayload): Promise<string>;
  cancelReminder(jobId: string): Promise<void>;
}

export class NoopReminderQueue implements IReminderQueue {
  async scheduleReminder(payload: EnqueueReminderPayload): Promise<string> {
    return `local-${payload.reminderId}`;
  }

  async cancelReminder(_jobId: string): Promise<void> {
    // No external Redis queue configured in test/local fallback mode.
  }
}

export class BullMqReminderQueue implements IReminderQueue {
  private readonly queue: Queue;
  private readonly connection: IORedis;

  constructor(redisUrl: string) {
    this.connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
    this.queue = new Queue(REMINDER_QUEUE_NAME, {
      connection: this.connection,
    });
  }

  async scheduleReminder(payload: EnqueueReminderPayload): Promise<string> {
    const delay = Math.max(0, payload.remindAt.getTime() - Date.now());
    const job = await this.queue.add(
      'dispatch-reminder',
      {
        reminderId: payload.reminderId,
        userId: payload.userId,
        title: payload.title,
      },
      {
        delay,
        jobId: `reminder-${payload.reminderId}-${payload.remindAt.getTime()}`,
        removeOnComplete: 500,
        removeOnFail: 500,
      },
    );
    return job.id ?? payload.reminderId;
  }

  async cancelReminder(jobId: string): Promise<void> {
    try {
      const job = await this.queue.getJob(jobId);
      if (job) {
        await job.remove();
      }
    } catch (err) {
      logger.warn({ err, jobId }, 'Failed to cancel BullMQ reminder job');
    }
  }
}

export function createReminderQueue(): IReminderQueue {
  if (env.REDIS_URL && env.NODE_ENV !== 'test') {
    return new BullMqReminderQueue(env.REDIS_URL);
  }
  return new NoopReminderQueue();
}
