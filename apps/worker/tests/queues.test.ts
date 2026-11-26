import { describe, expect, it } from 'vitest';
import { formatPrivacySafeNotification } from '../src/processors/reminder.processor';
import { QUEUE_NAMES } from '../src/queues/queue-names';

describe('Worker Foundation & Reminder Processor', () => {
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
});
