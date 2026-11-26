import { describe, expect, it } from 'vitest';
import {
  documentClassificationSchema,
  purchaseInvoiceExtractionSchema,
  registerSchema,
} from '../src';

describe('@lifeos/validation', () => {
  it('validates registration payload with privacy consent', () => {
    const valid = registerSchema.safeParse({
      email: 'Student@Example.com ',
      password: 'StrongPassword1',
      fullName: 'Aarav Mehta',
      mode: 'student',
      privacyConsentAccepted: true,
    });

    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.email).toBe('student@example.com');
    }
  });

  it('rejects registration when privacy consent is false', () => {
    const invalid = registerSchema.safeParse({
      email: 'student@example.com',
      password: 'StrongPassword1',
      fullName: 'Aarav Mehta',
      privacyConsentAccepted: false,
    });

    expect(invalid.success).toBe(false);
  });

  it('validates AI classification and structured purchase invoice extraction', () => {
    const classification = documentClassificationSchema.safeParse({
      documentType: 'purchase_invoice',
      confidence: 0.94,
      suggestedTitle: 'MacBook Air M3 Invoice',
      suggestedCategorySlug: 'purchase-receipts',
    });
    expect(classification.success).toBe(true);

    const invoice = purchaseInvoiceExtractionSchema.safeParse({
      productName: { value: 'MacBook Air 13', confidence: 0.97, verificationStatus: 'unverified' },
      purchaseDate: { value: '2026-10-15', confidence: 0.95, verificationStatus: 'unverified' },
      purchaseAmount: { value: 114900, confidence: 0.92, verificationStatus: 'unverified' },
      currency: { value: 'INR', confidence: 0.99, verificationStatus: 'unverified' },
      seller: { value: 'Apple Store India', confidence: 0.91, verificationStatus: 'unverified' },
      serialNumber: { value: null, confidence: 0, verificationStatus: 'unverified' },
      warrantyMonths: { value: 12, confidence: 0.88, verificationStatus: 'unverified' },
      warrantyExpirationDate: {
        value: '2027-10-15',
        confidence: 0.85,
        verificationStatus: 'unverified',
      },
    });
    expect(invoice.success).toBe(true);
  });
});
