import type {
  AiConversationDetailDto,
  AiConversationSummaryDto,
  ApiSuccessResponse,
  AskLifeAssistantResponseDto,
  DocumentExtractionDto,
  ExtractionConfirmationResultDto,
  UniversalSearchResponseDto,
} from '@lifeos/shared-types';
import type { AskAssistantInput, ConfirmExtractionInput } from '@lifeos/validation';
import { apiClient } from './api-client';

export const intelligenceApi = {
  async getDocumentExtraction(documentId: string): Promise<DocumentExtractionDto> {
    const res = await apiClient.get<ApiSuccessResponse<{ extraction: DocumentExtractionDto }>>(
      `/documents/${documentId}/extraction`,
    );
    return res.data.data.extraction;
  },

  async analyzeDocument(documentId: string): Promise<DocumentExtractionDto> {
    const res = await apiClient.post<ApiSuccessResponse<{ extraction: DocumentExtractionDto }>>(
      `/documents/${documentId}/extraction/analyze`,
    );
    return res.data.data.extraction;
  },

  async confirmExtraction(
    documentId: string,
    input: ConfirmExtractionInput,
  ): Promise<ExtractionConfirmationResultDto> {
    const res = await apiClient.post<ApiSuccessResponse<ExtractionConfirmationResultDto>>(
      `/documents/${documentId}/extraction/confirm`,
      input,
    );
    return res.data.data;
  },

  async universalSearch(q: string, limit = 8): Promise<UniversalSearchResponseDto> {
    const res = await apiClient.get<ApiSuccessResponse<UniversalSearchResponseDto>>('/search', {
      params: { q, limit },
    });
    return res.data.data;
  },

  async listConversations(): Promise<AiConversationSummaryDto[]> {
    const res = await apiClient.get<
      ApiSuccessResponse<{ conversations: AiConversationSummaryDto[] }>
    >('/assistant/conversations');
    return res.data.data.conversations;
  },

  async getConversationDetail(id: string): Promise<AiConversationDetailDto> {
    const res = await apiClient.get<ApiSuccessResponse<{ conversation: AiConversationDetailDto }>>(
      `/assistant/conversations/${id}`,
    );
    return res.data.data.conversation;
  },

  async askAssistant(input: AskAssistantInput): Promise<AskLifeAssistantResponseDto> {
    const res = await apiClient.post<ApiSuccessResponse<AskLifeAssistantResponseDto>>(
      '/assistant/ask',
      input,
    );
    return res.data.data;
  },
};
