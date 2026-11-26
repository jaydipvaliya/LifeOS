import type { EventCategory } from '@lifeos/shared-types';
import type { CreateEventInput, EventListQuery, UpdateEventInput } from '@lifeos/validation';

export interface EventRecord {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  category: EventCategory;
  startAt: Date;
  endAt: Date | null;
  allDay: boolean;
  timezone: string;
  isRecurring: boolean;
  recurrenceRule: string | null;
  sourceDocumentId: string | null;
  sourceAssetId: string | null;
  sourceSubscriptionId: string | null;
  completedAt: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventsRepository {
  listForUser(
    userId: string,
    query: EventListQuery,
  ): Promise<{ items: EventRecord[]; total: number }>;
  createForUser(userId: string, input: CreateEventInput): Promise<EventRecord>;
  updateForUser(
    eventId: string,
    userId: string,
    input: UpdateEventInput,
  ): Promise<EventRecord | null>;
  completeForUser(eventId: string, userId: string): Promise<EventRecord | null>;
  deleteForUser(eventId: string, userId: string): Promise<boolean>;
}
