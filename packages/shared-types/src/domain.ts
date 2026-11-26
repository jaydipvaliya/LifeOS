export type UserMode = 'student' | 'professional' | 'transitioning';

export type DocumentProcessingStatus =
  | 'pending_upload'
  | 'uploaded'
  | 'ocr_processing'
  | 'ai_extracting'
  | 'needs_review'
  | 'verified'
  | 'failed';

export type VerificationStatus = 'unverified' | 'confirmed' | 'edited' | 'rejected';

export interface ExtractionField<T = string | number | null> {
  value: T;
  confidence: number;
  sourceLocation?: string | null;
  verificationStatus: VerificationStatus;
}

export type DocumentTypeClassification =
  | 'purchase_invoice'
  | 'academic_certificate'
  | 'insurance_policy'
  | 'identity_document'
  | 'medical_record'
  | 'financial_statement'
  | 'travel_booking'
  | 'property_document'
  | 'employment_record'
  | 'other';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'snoozed' | 'cancelled';

export type EventCategory =
  | 'document_expiry'
  | 'warranty_expiry'
  | 'subscription_renewal'
  | 'payment_due'
  | 'academic_deadline'
  | 'appointment'
  | 'custom';

export type SubscriptionFrequency = 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom';

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

export type AssetCategory =
  | 'laptop'
  | 'smartphone'
  | 'tablet'
  | 'headphones'
  | 'electronics'
  | 'furniture'
  | 'appliances'
  | 'other';

export type SyncOperationType = 'create' | 'update' | 'delete';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'conflict' | 'failed';

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  mode: UserMode;
  emailVerified: boolean;
  createdAt: string;
}
