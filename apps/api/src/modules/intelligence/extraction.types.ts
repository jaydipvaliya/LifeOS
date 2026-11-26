import type {
  AiConversationDetailDto,
  AiConversationSummaryDto,
  AiMessageDto,
  AssistantCitationDto,
  DocumentExtractionDto,
  DocumentTypeClassification,
  ExtractedFieldValue,
  ExtractionRecordStatus,
  SuggestedExtractionActions,
  SyncBatchOperationResultDto,
  UniversalSearchResponseDto,
} from '@lifeos/shared-types';
import type { ConfirmExtractionInput, SyncOperationItemInput } from '@lifeos/validation';
import type { AssistantContextItem } from '../ai/ai-provider';
import type { RequestMeta } from '../auth/auth.types';

export interface ExtractionStructuredBlob {
  suggestedTitle: string;
  suggestedCategorySlug: string;
  summary: string;
  fields: ExtractedFieldValue[];
  suggestedActions: SuggestedExtractionActions;
}

export interface SaveExtractionParams {
  documentId: string;
  userId: string;
  documentType: DocumentTypeClassification;
  providerName: string;
  modelName: string;
  rawText: string;
  payload: ExtractionStructuredBlob;
  confidenceScore: number;
  processingDurationMs: number;
  status: ExtractionRecordStatus;
}

export interface IIntelligenceRepository {
  saveExtractionResult(params: SaveExtractionParams): Promise<DocumentExtractionDto>;
  findLatestExtraction(documentId: string, userId: string): Promise<DocumentExtractionDto | null>;
  confirmExtractionAndCreateActions(params: {
    userId: string;
    documentId: string;
    extractionId: string;
    input: ConfirmExtractionInput;
    existingPayload: ExtractionStructuredBlob;
    meta: RequestMeta;
  }): Promise<{
    extraction: DocumentExtractionDto;
    createdAssetId: string | null;
    createdEventId: string | null;
    createdReminderId: string | null;
  }>;

  universalSearch(
    userId: string,
    query: string,
    limit: number,
  ): Promise<UniversalSearchResponseDto>;

  gatherAssistantContext(
    userId: string,
    documentId?: string | null,
  ): Promise<AssistantContextItem[]>;
  listConversations(userId: string): Promise<AiConversationSummaryDto[]>;
  getConversationDetail(
    userId: string,
    conversationId: string,
  ): Promise<AiConversationDetailDto | null>;
  appendConversationTurn(params: {
    userId: string;
    conversationId?: string | null;
    question: string;
    answer: string;
    citations: AssistantCitationDto[];
  }): Promise<{
    conversationId: string;
    conversationTitle: string;
    userMessage: AiMessageDto;
    assistantMessage: AiMessageDto;
  }>;

  processSyncBatch(params: {
    userId: string;
    deviceId: string | null;
    operations: SyncOperationItemInput[];
  }): Promise<SyncBatchOperationResultDto[]>;
  getPendingSyncCount(userId: string): Promise<number>;
}
