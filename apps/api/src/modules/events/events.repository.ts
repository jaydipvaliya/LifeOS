import type { CreateEventInput, EventListQuery, UpdateEventInput } from '@lifeos/validation';
import type { Prisma, PrismaClient } from '@prisma/client';
import { NotFoundError } from '../../shared/errors';
import type { EventRecord, IEventsRepository } from './events.types';

export class PrismaEventsRepository implements IEventsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private async verifyLinks(
    userId: string,
    input: {
      sourceDocumentId?: string | null;
      sourceAssetId?: string | null;
      sourceSubscriptionId?: string | null;
    },
  ): Promise<void> {
    if (input.sourceDocumentId) {
      const doc = await this.prisma.document.findFirst({
        where: { id: input.sourceDocumentId, userId, deletedAt: null },
        select: { id: true },
      });
      if (!doc) throw new NotFoundError('Linked document not found');
    }
    if (input.sourceAssetId) {
      const asset = await this.prisma.asset.findFirst({
        where: { id: input.sourceAssetId, userId },
        select: { id: true },
      });
      if (!asset) throw new NotFoundError('Linked asset not found');
    }
    if (input.sourceSubscriptionId) {
      const sub = await this.prisma.subscription.findFirst({
        where: { id: input.sourceSubscriptionId, userId },
        select: { id: true },
      });
      if (!sub) throw new NotFoundError('Linked subscription not found');
    }
  }

  async listForUser(
    userId: string,
    query: EventListQuery,
  ): Promise<{ items: EventRecord[]; total: number }> {
    const where: Prisma.EventWhereInput = {
      userId,
      ...(!query.includeCompleted ? { completedAt: null } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.from || query.to
        ? {
            startAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where,
        orderBy: { startAt: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.event.count({ where }),
    ]);

    return { items, total };
  }

  async createForUser(userId: string, input: CreateEventInput): Promise<EventRecord> {
    await this.verifyLinks(userId, input);
    return this.prisma.event.create({
      data: {
        userId,
        title: input.title,
        description: input.description ?? null,
        category: input.category,
        startAt: new Date(input.startAt),
        endAt: input.endAt ? new Date(input.endAt) : null,
        allDay: input.allDay,
        timezone: input.timezone,
        isRecurring: input.isRecurring,
        recurrenceRule: input.recurrenceRule ?? null,
        sourceDocumentId: input.sourceDocumentId ?? null,
        sourceAssetId: input.sourceAssetId ?? null,
        sourceSubscriptionId: input.sourceSubscriptionId ?? null,
      },
    });
  }

  async updateForUser(
    eventId: string,
    userId: string,
    input: UpdateEventInput,
  ): Promise<EventRecord | null> {
    const existing = await this.prisma.event.findFirst({ where: { id: eventId, userId } });
    if (!existing) return null;

    await this.verifyLinks(userId, input);

    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.startAt !== undefined ? { startAt: new Date(input.startAt) } : {}),
        ...(input.endAt !== undefined ? { endAt: input.endAt ? new Date(input.endAt) : null } : {}),
        ...(input.allDay !== undefined ? { allDay: input.allDay } : {}),
        ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
        ...(input.isRecurring !== undefined ? { isRecurring: input.isRecurring } : {}),
        ...(input.recurrenceRule !== undefined ? { recurrenceRule: input.recurrenceRule } : {}),
        version: { increment: 1 },
      },
    });
  }

  async completeForUser(eventId: string, userId: string): Promise<EventRecord | null> {
    const existing = await this.prisma.event.findFirst({ where: { id: eventId, userId } });
    if (!existing) return null;
    return this.prisma.event.update({
      where: { id: eventId },
      data: { completedAt: new Date(), version: { increment: 1 } },
    });
  }

  async deleteForUser(eventId: string, userId: string): Promise<boolean> {
    const existing = await this.prisma.event.findFirst({ where: { id: eventId, userId } });
    if (!existing) return false;
    await this.prisma.event.delete({ where: { id: eventId } });
    return true;
  }
}
