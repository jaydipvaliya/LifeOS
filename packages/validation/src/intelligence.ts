import { z } from 'zod';
import { isoDateSchema, uuidSchema } from './common';
import { verificationStatusSchema } from './extraction';
import { assetCategorySchema, eventCategorySchema } from './life';

export const confirmedFieldInputSchema = z.object({
  key: z.string().trim().min(1).max(64),
  label: z.string().trim().min(1).max(80),
  value: z.union([z.string().max(400), z.number()]).nullable(),
  verificationStatus: verificationStatusSchema,
});

export const confirmExtractionSchema = z.object({
  title: z.string().trim().min(1).max(180).optional(),
  expiryDate: isoDateSchema.nullable().optional(),
  fields: z.array(confirmedFieldInputSchema).max(30),
  createAsset: z
    .object({
      enabled: z.boolean(),
      name: z.string().trim().min(1).max(160),
      category: assetCategorySchema.default('electronics'),
      brand: z.string().trim().max(100).nullable().optional(),
      purchaseDate: isoDateSchema.nullable().optional(),
      purchasePrice: z.coerce.number().nonnegative().nullable().optional(),
      currency: z.string().trim().length(3).default('INR'),
      serialNumber: z.string().trim().max(120).nullable().optional(),
      warrantyExpirationDate: isoDateSchema.nullable().optional(),
    })
    .optional(),
  createEvent: z
    .object({
      enabled: z.boolean(),
      title: z.string().trim().min(1).max(180),
      category: eventCategorySchema.default('document_expiry'),
      startDate: isoDateSchema,
    })
    .optional(),
  createReminder: z
    .object({
      enabled: z.boolean(),
      title: z.string().trim().min(1).max(180),
      remindDate: isoDateSchema,
    })
    .optional(),
});

export const universalSearchQuerySchema = z.object({
  q: z.string().trim().min(1, 'Search query is required').max(120),
  limit: z.coerce.number().int().min(1).max(25).default(8),
});

export const askAssistantSchema = z.object({
  conversationId: uuidSchema.nullable().optional(),
  question: z.string().trim().min(1, 'Please enter a question').max(1000),
  documentId: uuidSchema.nullable().optional(),
});

export const syncEntityTypeSchema = z.enum(['task', 'document', 'asset']);
export const syncOperationKindSchema = z.enum(['create', 'update', 'delete']);

export const syncOperationItemSchema = z.object({
  clientOperationId: z.string().trim().min(1).max(80),
  entityType: syncEntityTypeSchema,
  entityId: uuidSchema,
  operationType: syncOperationKindSchema,
  clientVersion: z.number().int().min(0).default(1),
  payload: z.record(z.unknown()),
});

export const syncBatchSchema = z.object({
  deviceId: uuidSchema.nullable().optional(),
  operations: z.array(syncOperationItemSchema).min(1).max(50),
});

export type ConfirmExtractionInput = z.infer<typeof confirmExtractionSchema>;
export type UniversalSearchQuery = z.infer<typeof universalSearchQuerySchema>;
export type AskAssistantInput = z.infer<typeof askAssistantSchema>;
export type SyncOperationItemInput = z.infer<typeof syncOperationItemSchema>;
export type SyncBatchInput = z.infer<typeof syncBatchSchema>;
