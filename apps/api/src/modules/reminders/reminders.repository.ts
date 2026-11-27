import type { CreateReminderInput } from '@lifeos/validation';
import type { PrismaClient } from '@prisma/client';
import type { IRemindersRepository, ReminderRecord } from './reminders.types';

export class PrismaRemindersRepository implements IRemindersRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listForUser(userId: string): Promise<ReminderRecord[]> {
    return this.prisma.reminder.findMany({
      where: { userId, status: { not: 'cancelled' } },
      orderBy: { remindAt: 'asc' },
    });
  }

  async findOwnedById(reminderId: string, userId: string): Promise<ReminderRecord | null> {
    return this.prisma.reminder.findFirst({ where: { id: reminderId, userId } });
  }

  async createForUser(userId: string, input: CreateReminderInput): Promise<ReminderRecord> {
    return this.prisma.reminder.create({
      data: {
        userId,
        title: input.title,
        remindAt: new Date(input.remindAt),
        channel: input.channel,
        eventId: input.eventId ?? null,
        taskId: input.taskId ?? null,
        documentId: input.documentId ?? null,
      },
    });
  }

  async attachJobId(reminderId: string, jobId: string): Promise<ReminderRecord> {
    return this.prisma.reminder.update({
      where: { id: reminderId },
      data: { jobId },
    });
  }

  async snoozeForUser(
    reminderId: string,
    userId: string,
    snoozedUntil: Date,
    newJobId: string,
  ): Promise<ReminderRecord | null> {
    const existing = await this.prisma.reminder.findFirst({ where: { id: reminderId, userId } });
    if (!existing) return null;

    return this.prisma.reminder.update({
      where: { id: reminderId },
      data: {
        status: 'snoozed',
        snoozedUntil,
        remindAt: snoozedUntil,
        jobId: newJobId,
      },
    });
  }

  async deleteForUser(reminderId: string, userId: string): Promise<ReminderRecord | null> {
    const existing = await this.prisma.reminder.findFirst({ where: { id: reminderId, userId } });
    if (!existing) return null;
    await this.prisma.reminder.delete({ where: { id: reminderId } });
    return existing;
  }

  async getDispatchContext(
    userId: string,
  ): Promise<{ pushTokens: string[]; hideSensitiveDetails: boolean }> {
    const [devices, pref] = await Promise.all([
      this.prisma.device.findMany({
        where: { userId, revokedAt: null, pushToken: { not: null } },
        select: { pushToken: true },
      }),
      this.prisma.notificationPreference.findUnique({
        where: { userId },
        select: { pushEnabled: true, privacyHideSensitiveContent: true },
      }),
    ]);

    const hideSensitiveDetails = pref?.privacyHideSensitiveContent ?? true;
    if (pref?.pushEnabled === false) {
      return { pushTokens: [], hideSensitiveDetails };
    }

    const pushTokens = Array.from(
      new Set(
        devices
          .map((device) => device.pushToken)
          .filter((token): token is string => typeof token === 'string' && token.length > 0),
      ),
    );
    return { pushTokens, hideSensitiveDetails };
  }
}
