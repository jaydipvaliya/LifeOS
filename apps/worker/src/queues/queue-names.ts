export const QUEUE_NAMES = {
  DOCUMENT_EXTRACTION: 'lifeos.document.extraction',
  REMINDER_DISPATCH: 'lifeos.reminder.dispatch',
  NOTIFICATION_PUSH: 'lifeos.notification.push',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
