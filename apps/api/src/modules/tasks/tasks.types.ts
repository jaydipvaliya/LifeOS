import type { TaskPriority, TaskStatus } from '@lifeos/shared-types';
import type { CreateTaskInput, TaskListQuery, UpdateTaskInput } from '@lifeos/validation';

export interface TaskRecord {
  id: string;
  userId: string;
  title: string;
  notes: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  category: string | null;
  dueAt: Date | null;
  snoozedUntil: Date | null;
  completedAt: Date | null;
  isRecurring: boolean;
  recurrenceRule: string | null;
  sourceDocumentId: string | null;
  sourceDocumentTitle: string | null;
  linkedEventId: string | null;
  linkedEventTitle: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITasksRepository {
  listForUser(
    userId: string,
    query: TaskListQuery,
  ): Promise<{ items: TaskRecord[]; total: number }>;
  findOwnedById(taskId: string, userId: string): Promise<TaskRecord | null>;
  createForUser(userId: string, input: CreateTaskInput): Promise<TaskRecord>;
  updateForUser(taskId: string, userId: string, input: UpdateTaskInput): Promise<TaskRecord | null>;
  completeForUser(taskId: string, userId: string): Promise<TaskRecord | null>;
  snoozeForUser(taskId: string, userId: string, snoozedUntil: Date): Promise<TaskRecord | null>;
  deleteForUser(taskId: string, userId: string): Promise<boolean>;
}
