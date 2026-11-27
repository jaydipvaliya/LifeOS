import type { Job } from 'bullmq';
import { logger } from '../config/logger';

export interface ReminderJobPayload {
  reminderId: string;
  userId: string;
  title: string;
  hideSensitiveDetails?: boolean;
  pushTokens?: string[];
}

export interface ReminderDispatchResult {
  dispatchedCount: number;
  privacyMasked: boolean;
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

/**
 * Dispatches scheduled reminders via Expo Push Service while honoring lock-screen privacy masking.
 */
export async function dispatchReminderNotification(
  payload: ReminderJobPayload,
  jobId?: string,
  fetchFn?: typeof fetch,
): Promise<ReminderDispatchResult> {
  const privacyMasked = payload.hideSensitiveDetails ?? true;
  const formatted = formatPrivacySafeNotification(payload);
  const validTokens = (payload.pushTokens ?? []).filter(
    (t) => t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['),
  );

  let dispatchedCount = 0;

  if (validTokens.length > 0 && (fetchFn !== undefined || process.env.NODE_ENV !== 'test')) {
    const messages = validTokens.map((to) => ({
      to,
      sound: 'default',
      title: formatted.title,
      body: formatted.body,
      channelId: 'lifeos-reminders',
      data: { reminderId: payload.reminderId },
    }));

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (process.env.EXPO_ACCESS_TOKEN) {
      headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
    }

    const activeFetch = fetchFn ?? fetch;
    const res = await activeFetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers,
      body: JSON.stringify(messages),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      logger.warn(
        { status: res.status, errBody, reminderId: payload.reminderId },
        'Expo Push Service returned non-2xx status',
      );
    } else {
      dispatchedCount = validTokens.length;
    }
  }

  logger.info(
    {
      jobId,
      reminderId: payload.reminderId,
      userId: payload.userId,
      notificationTitle: formatted.title,
      privacyMasked,
      dispatchedCount,
    },
    'Processed scheduled reminder job',
  );

  return { dispatchedCount, privacyMasked };
}

export async function processReminderJob(
  job: Job<ReminderJobPayload>,
): Promise<ReminderDispatchResult> {
  return dispatchReminderNotification(job.data, job.id);
}
