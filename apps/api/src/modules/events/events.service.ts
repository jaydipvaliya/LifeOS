import type { EventDto, PaginationMeta } from '@lifeos/shared-types';
import type { CreateEventInput, EventListQuery, UpdateEventInput } from '@lifeos/validation';
import { NotFoundError } from '../../shared/errors';
import type { EventRecord, IEventsRepository } from './events.types';

function toEventDto(record: EventRecord): EventDto {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    category: record.category,
    startAt: record.startAt.toISOString(),
    endAt: record.endAt ? record.endAt.toISOString() : null,
    allDay: record.allDay,
    timezone: record.timezone,
    isRecurring: record.isRecurring,
    recurrenceRule: record.recurrenceRule,
    sourceDocumentId: record.sourceDocumentId,
    sourceAssetId: record.sourceAssetId,
    sourceSubscriptionId: record.sourceSubscriptionId,
    completedAt: record.completedAt ? record.completedAt.toISOString() : null,
    version: record.version,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class EventsService {
  constructor(private readonly repository: IEventsRepository) {}

  async list(
    userId: string,
    query: EventListQuery,
  ): Promise<{ events: EventDto[]; pagination: PaginationMeta }> {
    const { items, total } = await this.repository.listForUser(userId, query);
    const totalPages = Math.max(1, Math.ceil(total / query.limit));
    return {
      events: items.map(toEventDto),
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

  async create(userId: string, input: CreateEventInput): Promise<EventDto> {
    const created = await this.repository.createForUser(userId, input);
    return toEventDto(created);
  }

  async update(userId: string, eventId: string, input: UpdateEventInput): Promise<EventDto> {
    const updated = await this.repository.updateForUser(eventId, userId, input);
    if (!updated) throw new NotFoundError('Event not found');
    return toEventDto(updated);
  }

  async complete(userId: string, eventId: string): Promise<EventDto> {
    const updated = await this.repository.completeForUser(eventId, userId);
    if (!updated) throw new NotFoundError('Event not found');
    return toEventDto(updated);
  }

  async delete(userId: string, eventId: string): Promise<{ deleted: true }> {
    const deleted = await this.repository.deleteForUser(eventId, userId);
    if (!deleted) throw new NotFoundError('Event not found');
    return { deleted: true };
  }
}
