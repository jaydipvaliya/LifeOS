import type { ReminderDto } from '@lifeos/shared-types';
import type { CreateReminderInput } from '@lifeos/validation';
import { NotFoundError } from '../../shared/errors';
import type { IReminderQueue } from './reminder-queue';
import type { IRemindersRepository, ReminderRecord } from './reminders.types';

function toReminderDto(record: ReminderRecord): ReminderDto {
  return {
    id: record.id,
    eventId: record.eventId,
    taskId: record.taskId,
    documentId: record.documentId,
    title: record.title,
    remindAt: record.remindAt.toISOString(),
    channel: record.channel,
    status: record.status,
    sentAt: record.sentAt ? record.sentAt.toISOString() : null,
    snoozedUntil: record.snoozedUntil ? record.snoozedUntil.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
  };
}

export class RemindersService {
  constructor(
    private readonly repository: IRemindersRepository,
    private readonly queue: IReminderQueue,
  ) {}

  async list(userId: string): Promise<ReminderDto[]> {
    const rows = await this.repository.listForUser(userId);
    return rows.map(toReminderDto);
  }

  async create(userId: string, input: CreateReminderInput): Promise<ReminderDto> {
    const created = await this.repository.createForUser(userId, input);
    const jobId = await this.queue.scheduleReminder({
      reminderId: created.id,
      userId,
      title: created.title,
      remindAt: created.remindAt,
    });
    const withJob = await this.repository.attachJobId(created.id, jobId);
    return toReminderDto(withJob);
  }

  async snooze(userId: string, reminderId: string, snoozedUntilIso: string): Promise<ReminderDto> {
    const existing = await this.repository.findOwnedById(reminderId, userId);
    if (!existing) throw new NotFoundError('Reminder not found');

    if (existing.jobId) {
      await this.queue.cancelReminder(existing.jobId);
    }

    const nextDate = new Date(snoozedUntilIso);
    const nextJobId = await this.queue.scheduleReminder({
      reminderId: existing.id,
      userId,
      title: existing.title,
      remindAt: nextDate,
    });

    const updated = await this.repository.snoozeForUser(reminderId, userId, nextDate, nextJobId);
    if (!updated) throw new NotFoundError('Reminder not found');
    return toReminderDto(updated);
  }

  async delete(userId: string, reminderId: string): Promise<{ deleted: true }> {
    const deleted = await this.repository.deleteForUser(reminderId, userId);
    if (!deleted) throw new NotFoundError('Reminder not found');
    if (deleted.jobId) {
      await this.queue.cancelReminder(deleted.jobId);
    }
    return { deleted: true };
  }
}
