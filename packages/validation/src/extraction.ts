import { z } from 'zod';

export const verificationStatusSchema = z.enum(['unverified', 'confirmed', 'edited', 'rejected']);

export function createExtractionFieldSchema<T extends z.ZodTypeAny>(valueSchema: T) {
  return z.object({
    value: valueSchema.nullable(),
    confidence: z.number().min(0).max(1),
    sourceLocation: z.string().max(200).nullable().optional(),
    verificationStatus: verificationStatusSchema.default('unverified'),
  });
}

export const documentClassificationSchema = z.object({
  documentType: z.enum([
    'purchase_invoice',
    'academic_certificate',
    'insurance_policy',
    'identity_document',
    'medical_record',
    'financial_statement',
    'travel_booking',
    'property_document',
    'employment_record',
    'other',
  ]),
  confidence: z.number().min(0).max(1),
  suggestedTitle: z.string().trim().min(1).max(160),
  suggestedCategorySlug: z.string().trim().min(1).max(60),
});

export const purchaseInvoiceExtractionSchema = z.object({
  productName: createExtractionFieldSchema(z.string().trim().min(1)),
  purchaseDate: createExtractionFieldSchema(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  purchaseAmount: createExtractionFieldSchema(z.number().nonnegative()),
  currency: createExtractionFieldSchema(z.string().length(3)),
  seller: createExtractionFieldSchema(z.string().trim().min(1)),
  serialNumber: createExtractionFieldSchema(z.string().trim().min(1)),
  warrantyMonths: createExtractionFieldSchema(z.number().int().positive()),
  warrantyExpirationDate: createExtractionFieldSchema(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export const academicCertificateExtractionSchema = z.object({
  institution: createExtractionFieldSchema(z.string().trim().min(1)),
  studentName: createExtractionFieldSchema(z.string().trim().min(1)),
  certificateTitle: createExtractionFieldSchema(z.string().trim().min(1)),
  issueDate: createExtractionFieldSchema(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  credentialId: createExtractionFieldSchema(z.string().trim().min(1)),
});

export const insuranceExtractionSchema = z.object({
  policyProvider: createExtractionFieldSchema(z.string().trim().min(1)),
  policyNumber: createExtractionFieldSchema(z.string().trim().min(1)),
  startDate: createExtractionFieldSchema(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: createExtractionFieldSchema(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  premiumAmount: createExtractionFieldSchema(z.number().nonnegative()),
  currency: createExtractionFieldSchema(z.string().length(3)),
});
