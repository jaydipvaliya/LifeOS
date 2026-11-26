import type { ReminderChannel, ReminderStatus } from '@lifeos/shared-types';
import type { CreateReminderInput } from '@lifeos/validation';

export interface ReminderRecord {
  id: string;
  userId: string;
  eventId: string | null;
  taskId: string | null;
  documentId: string | null;
  title: string;
  remindAt: Date;
  channel: ReminderChannel;
  status: ReminderStatus;
  sentAt: Date | null;
  snoozedUntil: Date | null;
  jobId: string | null;
  createdAt: Date;
}

export interface IRemindersRepository {
  listForUser(userId: string): Promise<ReminderRecord[]>;
  findOwnedById(reminderId: string, userId: string): Promise<ReminderRecord | null>;
  createForUser(userId: string, input: CreateReminderInput): Promise<ReminderRecord>;
  attachJobId(reminderId: string, jobId: string): Promise<ReminderRecord>;
  snoozeForUser(
    reminderId: string,
    userId: string,
    snoozedUntil: Date,
    newJobId: string,
  ): Promise<ReminderRecord | null>;
  deleteForUser(reminderId: string, userId: string): Promise<ReminderRecord | null>;
}
