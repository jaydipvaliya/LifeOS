import { z } from 'zod';
import { isoDateSchema, paginationQuerySchema, uuidSchema } from './common';

export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);
export const taskStatusSchema = z.enum([
  'pending',
  'in_progress',
  'completed',
  'snoozed',
  'cancelled',
]);

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required').max(180),
  notes: z.string().trim().max(2000).nullable().optional(),
  priority: taskPrioritySchema.default('medium'),
  category: z.string().trim().max(60).nullable().optional(),
  dueAt: z.string().datetime({ offset: true }).nullable().optional(),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().trim().max(160).nullable().optional(),
  sourceDocumentId: uuidSchema.nullable().optional(),
  linkedEventId: uuidSchema.nullable().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: taskStatusSchema.optional(),
});

export const taskListQuerySchema = paginationQuerySchema.extend({
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  overdueOnly: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  search: z.string().trim().max(120).optional(),
  sortBy: z.enum(['dueAt', 'priority', 'createdAt']).default('dueAt'),
});

export const snoozeSchema = z.object({
  snoozedUntil: z.string().datetime({ offset: true }),
});

export const eventCategorySchema = z.enum([
  'document_expiry',
  'warranty_expiry',
  'subscription_renewal',
  'payment_due',
  'academic_deadline',
  'appointment',
  'custom',
]);

export const createEventSchema = z.object({
  title: z.string().trim().min(1, 'Event title is required').max(180),
  description: z.string().trim().max(2000).nullable().optional(),
  category: eventCategorySchema.default('custom'),
  startAt: z.string().datetime({ offset: true }),
  endAt: z.string().datetime({ offset: true }).nullable().optional(),
  allDay: z.boolean().default(false),
  timezone: z.string().trim().min(2).max(64).default('Asia/Kolkata'),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().trim().max(160).nullable().optional(),
  sourceDocumentId: uuidSchema.nullable().optional(),
  sourceAssetId: uuidSchema.nullable().optional(),
  sourceSubscriptionId: uuidSchema.nullable().optional(),
});

export const updateEventSchema = createEventSchema.partial();

export const eventListQuerySchema = paginationQuerySchema.extend({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  category: eventCategorySchema.optional(),
  search: z.string().trim().max(120).optional(),
  includeCompleted: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export const createReminderSchema = z.object({
  title: z.string().trim().min(1, 'Reminder title is required').max(180),
  remindAt: z.string().datetime({ offset: true }),
  channel: z.enum(['push', 'email', 'in_app']).default('push'),
  eventId: uuidSchema.nullable().optional(),
  taskId: uuidSchema.nullable().optional(),
  documentId: uuidSchema.nullable().optional(),
});

export const assetCategorySchema = z.enum([
  'laptop',
  'smartphone',
  'tablet',
  'headphones',
  'electronics',
  'furniture',
  'appliances',
  'other',
]);

export const createAssetSchema = z.object({
  name: z.string().trim().min(1, 'Asset name is required').max(160),
  category: assetCategorySchema.default('electronics'),
  brand: z.string().trim().max(100).nullable().optional(),
  model: z.string().trim().max(120).nullable().optional(),
  serialNumber: z.string().trim().max(120).nullable().optional(),
  purchaseDate: isoDateSchema.nullable().optional(),
  purchasePrice: z.coerce.number().nonnegative().max(100000000).nullable().optional(),
  currency: z.string().trim().length(3).default('INR'),
  warrantyStartDate: isoDateSchema.nullable().optional(),
  warrantyExpirationDate: isoDateSchema.nullable().optional(),
  serviceInfo: z.string().trim().max(2000).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  linkedDocumentIds: z.array(uuidSchema).max(10).default([]),
});

export const updateAssetSchema = createAssetSchema.partial();

export const linkAssetDocumentSchema = z.object({
  documentId: uuidSchema,
  relationType: z.string().trim().min(1).max(48).default('invoice'),
});

export const createAssetRepairSchema = z.object({
  repairDate: isoDateSchema,
  providerName: z.string().trim().max(120).nullable().optional(),
  issueSummary: z.string().trim().min(1, 'Issue summary is required').max(500),
  cost: z.coerce.number().nonnegative().max(10000000).nullable().optional(),
  currency: z.string().trim().length(3).default('INR'),
  notes: z.string().trim().max(2000).nullable().optional(),
});

export const subscriptionFrequencySchema = z.enum([
  'weekly',
  'monthly',
  'quarterly',
  'annual',
  'custom',
]);
export const subscriptionStatusSchema = z.enum(['active', 'paused', 'cancelled']);

export const createSubscriptionSchema = z.object({
  name: z.string().trim().min(1, 'Subscription name is required').max(160),
  provider: z.string().trim().min(1, 'Provider is required').max(120),
  amount: z.coerce.number().positive('Amount must be greater than 0').max(10000000),
  currency: z.string().trim().length(3).default('INR'),
  frequency: subscriptionFrequencySchema.default('monthly'),
  startDate: isoDateSchema,
  nextRenewalDate: isoDateSchema,
  paymentMethodLabel: z.string().trim().max(80).nullable().optional(),
  cancellationInfo: z.string().trim().max(1000).nullable().optional(),
});

export const updateSubscriptionSchema = createSubscriptionSchema.partial().extend({
  status: subscriptionStatusSchema.optional(),
});

export const updateNotificationPreferenceSchema = z.object({
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  documentExpiryDaysBefore: z.number().int().min(1).max(180).optional(),
  warrantyExpiryDaysBefore: z.number().int().min(1).max(180).optional(),
  subscriptionRenewalDaysBefore: z.number().int().min(1).max(60).optional(),
  quietHoursStart: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  quietHoursEnd: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  privacyHideSensitiveContent: z.boolean().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskListQuery = z.infer<typeof taskListQuerySchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventListQuery = z.infer<typeof eventListQuerySchema>;
export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type CreateAssetRepairInput = z.infer<typeof createAssetRepairSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type UpdateNotificationPreferenceInput = z.infer<typeof updateNotificationPreferenceSchema>;
