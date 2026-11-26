import { z } from 'zod';
import { isoDateSchema, paginationQuerySchema, uuidSchema } from './common';

export const allowedDocumentMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
] as const;

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, 'Category name must be at least 2 characters').max(60),
  iconName: z.string().trim().max(48).optional(),
});

export const documentUploadInitSchema = z.object({
  title: z.string().trim().min(1, 'Document title is required').max(180),
  categoryId: uuidSchema,
  originalFilename: z.string().trim().min(1).max(255),
  mimeType: z.enum(allowedDocumentMimeTypes, {
    errorMap: () => ({ message: 'Unsupported file type. Upload PDF, JPEG, PNG, WEBP, or HEIC.' }),
  }),
  fileSizeBytes: z
    .number()
    .int()
    .positive()
    .max(15 * 1024 * 1024, 'Maximum file size is 15 MB'),
  expiryDate: isoDateSchema.nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(32)).max(12).default([]),
});

export const documentUploadCompleteSchema = z.object({
  checksumSha256: z.string().trim().length(64).optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().trim().min(1).max(180).optional(),
  categoryId: uuidSchema.optional(),
  expiryDate: isoDateSchema.nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(32)).max(12).optional(),
});

export const documentListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(120).optional(),
  categoryId: uuidSchema.optional(),
  archived: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  expiringWithinDays: z.coerce.number().int().min(1).max(365).optional(),
  tag: z.string().trim().max(32).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type DocumentUploadInitInput = z.infer<typeof documentUploadInitSchema>;
export type DocumentUploadCompleteInput = z.infer<typeof documentUploadCompleteSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type DocumentListQuery = z.infer<typeof documentListQuerySchema>;
