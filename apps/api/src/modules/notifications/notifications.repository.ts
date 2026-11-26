import type { UpdateNotificationPreferenceInput } from '@lifeos/validation';
import type { PrismaClient } from '@prisma/client';
import type {
  INotificationsRepository,
  NotificationPreferenceRecord,
  NotificationRecord,
} from './notifications.types';

export class PrismaNotificationsRepository implements INotificationsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listForUser(userId: string): Promise<NotificationRecord[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<NotificationRecord | null> {
    const existing = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!existing) return null;

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: existing.readAt ?? new Date() },
    });
  }

  async snoozeNotification(
    notificationId: string,
    userId: string,
    snoozedUntil: Date,
  ): Promise<NotificationRecord | null> {
    const existing = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!existing) return null;

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { snoozedUntil },
    });
  }

  async getPreferences(userId: string): Promise<NotificationPreferenceRecord> {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async updatePreferences(
    userId: string,
    input: UpdateNotificationPreferenceInput,
  ): Promise<NotificationPreferenceRecord> {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        pushEnabled: input.pushEnabled ?? true,
        emailEnabled: input.emailEnabled ?? true,
        documentExpiryDaysBefore: input.documentExpiryDaysBefore ?? 30,
        warrantyExpiryDaysBefore: input.warrantyExpiryDaysBefore ?? 14,
        subscriptionRenewalDaysBefore: input.subscriptionRenewalDaysBefore ?? 3,
        quietHoursStart: input.quietHoursStart ?? null,
        quietHoursEnd: input.quietHoursEnd ?? null,
        privacyHideSensitiveContent: input.privacyHideSensitiveContent ?? true,
      },
      update: {
        ...(input.pushEnabled !== undefined ? { pushEnabled: input.pushEnabled } : {}),
        ...(input.emailEnabled !== undefined ? { emailEnabled: input.emailEnabled } : {}),
        ...(input.documentExpiryDaysBefore !== undefined
          ? { documentExpiryDaysBefore: input.documentExpiryDaysBefore }
          : {}),
        ...(input.warrantyExpiryDaysBefore !== undefined
          ? { warrantyExpiryDaysBefore: input.warrantyExpiryDaysBefore }
          : {}),
        ...(input.subscriptionRenewalDaysBefore !== undefined
          ? { subscriptionRenewalDaysBefore: input.subscriptionRenewalDaysBefore }
          : {}),
        ...(input.quietHoursStart !== undefined ? { quietHoursStart: input.quietHoursStart } : {}),
        ...(input.quietHoursEnd !== undefined ? { quietHoursEnd: input.quietHoursEnd } : {}),
        ...(input.privacyHideSensitiveContent !== undefined
          ? { privacyHideSensitiveContent: input.privacyHideSensitiveContent }
          : {}),
      },
    });
  }
}
