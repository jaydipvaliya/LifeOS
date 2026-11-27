import { describe, expect, it, vi } from 'vitest';
import {
  dispatchExtractionJob,
  processExtractionJob,
} from '../src/processors/extraction.processor';
import {
  dispatchReminderNotification,
  formatPrivacySafeNotification,
} from '../src/processors/reminder.processor';
import { QUEUE_NAMES } from '../src/queues/queue-names';

describe('Worker Foundation & Processors', () => {
  it('defines canonical BullMQ queue names', () => {
    expect(QUEUE_NAMES.DOCUMENT_EXTRACTION).toBe('lifeos.document.extraction');
    expect(QUEUE_NAMES.REMINDER_DISPATCH).toBe('lifeos.reminder.dispatch');
    expect(QUEUE_NAMES.NOTIFICATION_PUSH).toBe('lifeos.notification.push');
  });

  it('hides sensitive personal details in notifications by default', () => {
    const masked = formatPrivacySafeNotification({
      reminderId: 'rem-1',
      userId: 'user-1',
      title: 'Passport #A123456 expires tomorrow',
    });
    expect(masked.body).not.toContain('Passport');
    expect(masked.body).not.toContain('A123456');

    const unmasked = formatPrivacySafeNotification({
      reminderId: 'rem-1',
      userId: 'user-1',
      title: 'Renew laptop warranty',
      hideSensitiveDetails: false,
    });
    expect(unmasked.body).toBe('Renew laptop warranty');
  });

  it('processes document extraction jobs idempotently', async () => {
    const res = await processExtractionJob({
      id: 'job-ext-1',
      data: { documentId: 'doc-1', userId: 'user-1' },
    } as never);
    expect(res.documentId).toBe('doc-1');
    expect(res.status).toBe('queued_for_ai_review');
  });

  it('dispatches Expo push notifications for valid push tokens and respects privacy masking', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ data: [{ status: 'ok' }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const res = await dispatchReminderNotification(
      {
        reminderId: 'rem-42',
        userId: 'user-1',
        title: 'Renew Passport #Z999',
        hideSensitiveDetails: true,
        pushTokens: ['ExponentPushToken[abc123]', 'invalid-token', 'ExpoPushToken[xyz789]'],
      },
      'job-rem-1',
      fetchMock,
    );

    expect(res.dispatchedCount).toBe(2);
    expect(res.privacyMasked).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://exp.host/--/api/v2/push/send');
    const sentMessages = JSON.parse(String(init?.body)) as Array<{
      to: string;
      body: string;
      channelId: string;
    }>;
    expect(sentMessages).toHaveLength(2);
    expect(sentMessages[0].channelId).toBe('lifeos-reminders');
    expect(sentMessages[0].body).not.toContain('Passport');
  });

  it('invokes internal API extraction callback with hostport URL normalization and handles errors', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }));

    const okRes = await dispatchExtractionJob(
      { documentId: 'doc-99', userId: 'user-77' },
      'job-ext-99',
      fetchMock,
      { apiUrl: 'lifeos-api:4000', workerSecret: 'super-secret-token' },
    );

    expect(okRes.status).toBe('extracted');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [targetUrl, init] = fetchMock.mock.calls[0]!;
    expect(targetUrl).toBe('http://lifeos-api:4000/api/v1/internal/documents/doc-99/extract');
    expect((init?.headers as Record<string, string>)?.Authorization).toBe(
      'Bearer super-secret-token',
    );

    await expect(
      dispatchExtractionJob({ documentId: 'doc-99', userId: 'user-77' }, 'job-ext-100', fetchMock, {
        apiUrl: 'https://api.lifeos.app',
        workerSecret: 'wrong-secret',
      }),
    ).rejects.toThrow(/HTTP 401/);
  });
});
