import type { UpdateNotificationPreferenceInput } from '@lifeos/validation';

export interface NotificationRecord {
  id: string;
  userId: string;
  reminderId: string | null;
  type: string;
  title: string;
  body: string;
  readAt: Date | null;
  snoozedUntil: Date | null;
  createdAt: Date;
}

export interface NotificationPreferenceRecord {
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  documentExpiryDaysBefore: number;
  warrantyExpiryDaysBefore: number;
  subscriptionRenewalDaysBefore: number;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  privacyHideSensitiveContent: boolean;
}

export interface INotificationsRepository {
  listForUser(userId: string): Promise<NotificationRecord[]>;
  markAsRead(notificationId: string, userId: string): Promise<NotificationRecord | null>;
  snoozeNotification(
    notificationId: string,
    userId: string,
    snoozedUntil: Date,
  ): Promise<NotificationRecord | null>;
  getPreferences(userId: string): Promise<NotificationPreferenceRecord>;
  updatePreferences(
    userId: string,
    input: UpdateNotificationPreferenceInput,
  ): Promise<NotificationPreferenceRecord>;
}
