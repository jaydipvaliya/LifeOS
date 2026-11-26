import type { Job } from 'bullmq';
import { logger } from '../config/logger';

export interface ReminderJobPayload {
  reminderId: string;
  userId: string;
  title: string;
  hideSensitiveDetails?: boolean;
}

export function formatPrivacySafeNotification(payload: ReminderJobPayload): {
  title: string;
  body: string;
} {
  if (payload.hideSensitiveDetails ?? true) {
    return {
      title: 'LifeOS Reminder',
      body: 'You have an upcoming responsibility that needs your attention.',
    };
  }
  return {
    title: 'LifeOS Reminder',
    body: payload.title,
  };
}

export async function processReminderJob(job: Job<ReminderJobPayload>): Promise<void> {
  const formatted = formatPrivacySafeNotification(job.data);
  logger.info(
    {
      jobId: job.id,
      reminderId: job.data.reminderId,
      userId: job.data.userId,
      notificationTitle: formatted.title,
    },
    'Processed scheduled reminder job',
  );
}
