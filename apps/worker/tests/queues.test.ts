import { describe, expect, it } from 'vitest';
import { QUEUE_NAMES } from '../src/queues/queue-names';

describe('Worker Foundation', () => {
  it('defines canonical BullMQ queue names', () => {
    expect(QUEUE_NAMES.DOCUMENT_EXTRACTION).toBe('lifeos.document.extraction');
    expect(QUEUE_NAMES.REMINDER_DISPATCH).toBe('lifeos.reminder.dispatch');
    expect(QUEUE_NAMES.NOTIFICATION_PUSH).toBe('lifeos.notification.push');
  });
});
