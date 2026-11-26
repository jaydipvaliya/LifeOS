import type { CreateTaskInput, TaskListQuery, UpdateTaskInput } from '@lifeos/validation';
import type { Prisma, PrismaClient } from '@prisma/client';
import { NotFoundError } from '../../shared/errors';
import type { ITasksRepository, TaskRecord } from './tasks.types';

function mapTaskRow(
  row: Prisma.TaskGetPayload<{
    include: {
      sourceDocument: { select: { title: true } };
      linkedEvent: { select: { title: true } };
    };
  }>,
): TaskRecord {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    notes: row.notes,
    priority: row.priority,
    status: row.status,
    category: row.category,
    dueAt: row.dueAt,
    snoozedUntil: row.snoozedUntil,
    completedAt: row.completedAt,
    isRecurring: row.isRecurring,
    recurrenceRule: row.recurrenceRule,
    sourceDocumentId: row.sourceDocumentId,
    sourceDocumentTitle: row.sourceDocument?.title ?? null,
    linkedEventId: row.linkedEventId,
    linkedEventTitle: row.linkedEvent?.title ?? null,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaTasksRepository implements ITasksRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private async verifyLinks(
    userId: string,
    sourceDocumentId?: string | null,
    linkedEventId?: string | null,
  ): Promise<void> {
    if (sourceDocumentId) {
      const doc = await this.prisma.document.findFirst({
        where: { id: sourceDocumentId, userId, deletedAt: null },
        select: { id: true },
      });
      if (!doc) throw new NotFoundError('Linked source document not found');
    }
    if (linkedEventId) {
      const evt = await this.prisma.event.findFirst({
        where: { id: linkedEventId, userId },
        select: { id: true },
      });
      if (!evt) throw new NotFoundError('Linked calendar event not found');
    }
  }

  async listForUser(
    userId: string,
    query: TaskListQuery,
  ): Promise<{ items: TaskRecord[]; total: number }> {
    const now = new Date();
    const where: Prisma.TaskWhereInput = {
      userId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.overdueOnly
        ? {
            status: { in: ['pending', 'in_progress', 'snoozed'] },
            dueAt: { lt: now },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { notes: { contains: query.search, mode: 'insensitive' } },
              { category: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.TaskOrderByWithRelationInput[] =
      query.sortBy === 'priority'
        ? [{ priority: 'desc' }, { dueAt: 'asc' }]
        : query.sortBy === 'createdAt'
          ? [{ createdAt: 'desc' }]
          : [{ dueAt: 'asc' }, { priority: 'desc' }];

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        include: {
          sourceDocument: { select: { title: true } },
          linkedEvent: { select: { title: true } },
        },
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      items: rows.map(mapTaskRow),
      total,
    };
  }

  async findOwnedById(taskId: string, userId: string): Promise<TaskRecord | null> {
    const row = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
      include: {
        sourceDocument: { select: { title: true } },
        linkedEvent: { select: { title: true } },
      },
    });
    return row ? mapTaskRow(row) : null;
  }

  async createForUser(userId: string, input: CreateTaskInput): Promise<TaskRecord> {
    await this.verifyLinks(userId, input.sourceDocumentId, input.linkedEventId);

    const created = await this.prisma.task.create({
      data: {
        userId,
        title: input.title,
        notes: input.notes ?? null,
        priority: input.priority,
        category: input.category ?? null,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
        isRecurring: input.isRecurring,
        recurrenceRule: input.recurrenceRule ?? null,
        sourceDocumentId: input.sourceDocumentId ?? null,
        linkedEventId: input.linkedEventId ?? null,
      },
      include: {
        sourceDocument: { select: { title: true } },
        linkedEvent: { select: { title: true } },
      },
    });

    return mapTaskRow(created);
  }

  async updateForUser(
    taskId: string,
    userId: string,
    input: UpdateTaskInput,
  ): Promise<TaskRecord | null> {
    const existing = await this.prisma.task.findFirst({ where: { id: taskId, userId } });
    if (!existing) return null;

    await this.verifyLinks(userId, input.sourceDocumentId, input.linkedEventId);

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.dueAt !== undefined ? { dueAt: input.dueAt ? new Date(input.dueAt) : null } : {}),
        ...(input.isRecurring !== undefined ? { isRecurring: input.isRecurring } : {}),
        ...(input.recurrenceRule !== undefined ? { recurrenceRule: input.recurrenceRule } : {}),
        ...(input.sourceDocumentId !== undefined
          ? { sourceDocumentId: input.sourceDocumentId }
          : {}),
        ...(input.linkedEventId !== undefined ? { linkedEventId: input.linkedEventId } : {}),
        version: { increment: 1 },
      },
      include: {
        sourceDocument: { select: { title: true } },
        linkedEvent: { select: { title: true } },
      },
    });

    return mapTaskRow(updated);
  }

  async completeForUser(taskId: string, userId: string): Promise<TaskRecord | null> {
    const existing = await this.prisma.task.findFirst({ where: { id: taskId, userId } });
    if (!existing) return null;

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        version: { increment: 1 },
      },
      include: {
        sourceDocument: { select: { title: true } },
        linkedEvent: { select: { title: true } },
      },
    });

    return mapTaskRow(updated);
  }

  async snoozeForUser(
    taskId: string,
    userId: string,
    snoozedUntil: Date,
  ): Promise<TaskRecord | null> {
    const existing = await this.prisma.task.findFirst({ where: { id: taskId, userId } });
    if (!existing) return null;

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'snoozed',
        snoozedUntil,
        dueAt: snoozedUntil,
        version: { increment: 1 },
      },
      include: {
        sourceDocument: { select: { title: true } },
        linkedEvent: { select: { title: true } },
      },
    });

    return mapTaskRow(updated);
  }

  async deleteForUser(taskId: string, userId: string): Promise<boolean> {
    const existing = await this.prisma.task.findFirst({ where: { id: taskId, userId } });
    if (!existing) return false;
    await this.prisma.task.delete({ where: { id: taskId } });
    return true;
  }
}
