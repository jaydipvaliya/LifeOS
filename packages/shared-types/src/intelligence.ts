import type { DocumentTypeClassification, VerificationStatus } from './domain';

export type ExtractionRecordStatus = 'pending' | 'completed' | 'verified' | 'failed';

export interface ExtractedFieldValue {
  key: string;
  label: string;
  value: string | number | null;
  confidence: number;
  sourceLocation: string | null;
  verificationStatus: VerificationStatus;
}

export interface SuggestedExtractionActions {
  assetSuggestion?: {
    name: string;
    category:
      | 'laptop'
      | 'smartphone'
      | 'tablet'
      | 'headphones'
      | 'electronics'
      | 'furniture'
      | 'appliances'
      | 'other';
    brand: string | null;
    purchaseDate: string | null;
    purchasePrice: number | null;
    currency: string;
    serialNumber: string | null;
    warrantyExpirationDate: string | null;
  } | null;
  eventSuggestion?: {
    title: string;
    category:
      | 'document_expiry'
      | 'warranty_expiry'
      | 'subscription_renewal'
      | 'payment_due'
      | 'academic_deadline'
      | 'appointment'
      | 'custom';
    startDate: string;
  } | null;
  reminderSuggestion?: {
    title: string;
    remindDate: string;
  } | null;
}

export interface DocumentExtractionDto {
  id: string;
  documentId: string;
  documentType: DocumentTypeClassification;
  suggestedTitle: string;
  suggestedCategorySlug: string;
  summary: string;
  providerName: string;
  modelName: string;
  rawTextPreview: string | null;
  fields: ExtractedFieldValue[];
  suggestedActions: SuggestedExtractionActions;
  confidenceScore: number | null;
  processingDurationMs: number | null;
  status: ExtractionRecordStatus;
  verifiedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractionConfirmationResultDto {
  extraction: DocumentExtractionDto;
  createdAssetId: string | null;
  createdEventId: string | null;
  createdReminderId: string | null;
}

export interface UniversalSearchHitDto {
  id: string;
  entityType: 'document' | 'task' | 'event' | 'asset' | 'subscription';
  title: string;
  subtitle: string;
  date: string | null;
  route: string;
}

export interface UniversalSearchResponseDto {
  query: string;
  totalCount: number;
  documents: UniversalSearchHitDto[];
  tasks: UniversalSearchHitDto[];
  events: UniversalSearchHitDto[];
  assets: UniversalSearchHitDto[];
  subscriptions: UniversalSearchHitDto[];
}

export interface AssistantCitationDto {
  entityType: 'document' | 'task' | 'event' | 'asset' | 'subscription';
  entityId: string;
  title: string;
  excerpt: string;
}

export interface AiMessageDto {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  citations: AssistantCitationDto[];
  createdAt: string;
}

export interface AiConversationSummaryDto {
  id: string;
  title: string;
  updatedAt: string;
  lastMessagePreview: string | null;
}

export interface AiConversationDetailDto {
  id: string;
  title: string;
  updatedAt: string;
  messages: AiMessageDto[];
}

export interface AskLifeAssistantResponseDto {
  conversationId: string;
  conversationTitle: string;
  userMessage: AiMessageDto;
  assistantMessage: AiMessageDto;
}

export interface SyncBatchOperationResultDto {
  clientOperationId: string;
  entityType: string;
  entityId: string;
  status: 'synced' | 'conflict' | 'failed';
  serverVersion?: number;
  errorMessage?: string;
}

export interface SyncBatchResponseDto {
  processedAt: string;
  results: SyncBatchOperationResultDto[];
}
