import type { PaginationMeta, TaskDto } from '@lifeos/shared-types';
import type { CreateTaskInput, TaskListQuery, UpdateTaskInput } from '@lifeos/validation';
import { NotFoundError } from '../../shared/errors';
import type { ITasksRepository, TaskRecord } from './tasks.types';

function toTaskDto(record: TaskRecord): TaskDto {
  const isOverdue =
    record.dueAt !== null &&
    record.status !== 'completed' &&
    record.status !== 'cancelled' &&
    record.dueAt.getTime() < Date.now();

  return {
    id: record.id,
    title: record.title,
    notes: record.notes,
    priority: record.priority,
    status: record.status,
    category: record.category,
    dueAt: record.dueAt ? record.dueAt.toISOString() : null,
    snoozedUntil: record.snoozedUntil ? record.snoozedUntil.toISOString() : null,
    completedAt: record.completedAt ? record.completedAt.toISOString() : null,
    isRecurring: record.isRecurring,
    recurrenceRule: record.recurrenceRule,
    sourceDocumentId: record.sourceDocumentId,
    sourceDocumentTitle: record.sourceDocumentTitle,
    linkedEventId: record.linkedEventId,
    linkedEventTitle: record.linkedEventTitle,
    isOverdue,
    version: record.version,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class TasksService {
  constructor(private readonly repository: ITasksRepository) {}

  async list(
    userId: string,
    query: TaskListQuery,
  ): Promise<{ tasks: TaskDto[]; pagination: PaginationMeta }> {
    const { items, total } = await this.repository.listForUser(userId, query);
    const totalPages = Math.max(1, Math.ceil(total / query.limit));
    return {
      tasks: items.map(toTaskDto),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      },
    };
  }

  async create(userId: string, input: CreateTaskInput): Promise<TaskDto> {
    const created = await this.repository.createForUser(userId, input);
    return toTaskDto(created);
  }

  async update(userId: string, taskId: string, input: UpdateTaskInput): Promise<TaskDto> {
    const updated = await this.repository.updateForUser(taskId, userId, input);
    if (!updated) throw new NotFoundError('Task not found');
    return toTaskDto(updated);
  }

  async complete(userId: string, taskId: string): Promise<TaskDto> {
    const updated = await this.repository.completeForUser(taskId, userId);
    if (!updated) throw new NotFoundError('Task not found');
    return toTaskDto(updated);
  }

  async snooze(userId: string, taskId: string, snoozedUntilIso: string): Promise<TaskDto> {
    const updated = await this.repository.snoozeForUser(taskId, userId, new Date(snoozedUntilIso));
    if (!updated) throw new NotFoundError('Task not found');
    return toTaskDto(updated);
  }

  async delete(userId: string, taskId: string): Promise<{ deleted: true }> {
    const deleted = await this.repository.deleteForUser(taskId, userId);
    if (!deleted) throw new NotFoundError('Task not found');
    return { deleted: true };
  }
}
