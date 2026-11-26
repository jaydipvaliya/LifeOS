import type { NotificationDto, NotificationPreferenceDto } from '@lifeos/shared-types';
import type { UpdateNotificationPreferenceInput } from '@lifeos/validation';
import { NotFoundError } from '../../shared/errors';
import type {
  INotificationsRepository,
  NotificationPreferenceRecord,
  NotificationRecord,
} from './notifications.types';

function toNotificationDto(record: NotificationRecord): NotificationDto {
  return {
    id: record.id,
    reminderId: record.reminderId,
    type: record.type,
    title: record.title,
    body: record.body,
    readAt: record.readAt ? record.readAt.toISOString() : null,
    snoozedUntil: record.snoozedUntil ? record.snoozedUntil.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
  };
}

function toPreferenceDto(record: NotificationPreferenceRecord): NotificationPreferenceDto {
  return {
    pushEnabled: record.pushEnabled,
    emailEnabled: record.emailEnabled,
    documentExpiryDaysBefore: record.documentExpiryDaysBefore,
    warrantyExpiryDaysBefore: record.warrantyExpiryDaysBefore,
    subscriptionRenewalDaysBefore: record.subscriptionRenewalDaysBefore,
    quietHoursStart: record.quietHoursStart,
    quietHoursEnd: record.quietHoursEnd,
    privacyHideSensitiveContent: record.privacyHideSensitiveContent,
  };
}

export class NotificationsService {
  constructor(private readonly repository: INotificationsRepository) {}

  async list(userId: string): Promise<NotificationDto[]> {
    const rows = await this.repository.listForUser(userId);
    return rows.map(toNotificationDto);
  }

  async markAsRead(userId: string, notificationId: string): Promise<NotificationDto> {
    const updated = await this.repository.markAsRead(notificationId, userId);
    if (!updated) throw new NotFoundError('Notification not found');
    return toNotificationDto(updated);
  }

  async snooze(
    userId: string,
    notificationId: string,
    snoozedUntilIso: string,
  ): Promise<NotificationDto> {
    const updated = await this.repository.snoozeNotification(
      notificationId,
      userId,
      new Date(snoozedUntilIso),
    );
    if (!updated) throw new NotFoundError('Notification not found');
    return toNotificationDto(updated);
  }

  async getPreferences(userId: string): Promise<NotificationPreferenceDto> {
    const pref = await this.repository.getPreferences(userId);
    return toPreferenceDto(pref);
  }

  async updatePreferences(
    userId: string,
    input: UpdateNotificationPreferenceInput,
  ): Promise<NotificationPreferenceDto> {
    const updated = await this.repository.updatePreferences(userId, input);
    return toPreferenceDto(updated);
  }
}
