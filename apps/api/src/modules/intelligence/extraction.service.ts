import type { DocumentExtractionDto, ExtractionConfirmationResultDto } from '@lifeos/shared-types';
import type { ConfirmExtractionInput } from '@lifeos/validation';
import { BadRequestError, NotFoundError } from '../../shared/errors';
import type { IAiProvider } from '../ai/ai-provider';
import type { IOcrService } from '../ai/ocr-service';
import type { RequestMeta } from '../auth/auth.types';
import type { IDocumentsRepository } from '../documents/documents.types';
import type { IStorageService } from '../storage/storage.types';
import type { IIntelligenceRepository } from './extraction.types';

export class ExtractionService {
  constructor(
    private readonly documentsRepository: IDocumentsRepository,
    private readonly intelligenceRepository: IIntelligenceRepository,
    private readonly storageService: IStorageService,
    private readonly ocrService: IOcrService,
    private readonly aiProvider: IAiProvider,
  ) {}

  async analyzeDocument(userId: string, documentId: string): Promise<DocumentExtractionDto> {
    const doc = await this.documentsRepository.findOwnedById(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document not found');
    }

    const startedAt = Date.now();
    const buffer = this.storageService.getObjectBuffer
      ? await this.storageService.getObjectBuffer(doc.storageKey)
      : null;

    const rawText = await this.ocrService.extractText({
      buffer,
      mimeType: doc.mimeType,
      title: doc.title,
      originalFilename: doc.originalFilename,
      tags: doc.tags,
      expiryDate: doc.expiryDate ? doc.expiryDate.toISOString().slice(0, 10) : null,
    });

    // Pass multimodal binary bytes for scanned images or PDFs (capped at 4MB base64 payload)
    const binaryData =
      buffer && buffer.length <= 4 * 1024 * 1024
        ? { mimeType: doc.mimeType, base64: buffer.toString('base64') }
        : null;

    const classification = await this.aiProvider.classifyDocument({
      text: rawText,
      title: doc.title,
      filename: doc.originalFilename,
      mimeType: doc.mimeType,
      binaryData,
    });

    const structured = await this.aiProvider.extractDocumentData({
      text: rawText,
      documentType: classification.documentType,
      title: doc.title,
      binaryData,
    });

    const durationMs = Math.max(1, Date.now() - startedAt);

    return this.intelligenceRepository.saveExtractionResult({
      documentId: doc.id,
      userId,
      documentType: classification.documentType,
      providerName: this.aiProvider.providerName,
      modelName: this.aiProvider.modelName,
      rawText,
      payload: {
        suggestedTitle: classification.suggestedTitle,
        suggestedCategorySlug: classification.suggestedCategorySlug,
        summary: structured.summary,
        fields: structured.fields,
        suggestedActions: structured.suggestedActions,
      },
      confidenceScore: structured.confidenceScore,
      processingDurationMs: durationMs,
      status: 'completed',
    });
  }

  async getLatestExtraction(userId: string, documentId: string): Promise<DocumentExtractionDto> {
    const doc = await this.documentsRepository.findOwnedById(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document not found');
    }
    const existing = await this.intelligenceRepository.findLatestExtraction(documentId, userId);
    if (existing) {
      return existing;
    }
    return this.analyzeDocument(userId, documentId);
  }

  async confirmExtraction(
    userId: string,
    documentId: string,
    input: ConfirmExtractionInput,
    meta: RequestMeta,
  ): Promise<ExtractionConfirmationResultDto> {
    const doc = await this.documentsRepository.findOwnedById(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document not found');
    }

    const latest = await this.intelligenceRepository.findLatestExtraction(documentId, userId);
    if (!latest) {
      throw new BadRequestError('Run document extraction before verifying fields');
    }

    return this.intelligenceRepository.confirmExtractionAndCreateActions({
      userId,
      documentId,
      extractionId: latest.id,
      input,
      existingPayload: {
        suggestedTitle: latest.suggestedTitle,
        suggestedCategorySlug: latest.suggestedCategorySlug,
        summary: latest.summary,
        fields: latest.fields,
        suggestedActions: latest.suggestedActions,
      },
      meta,
    });
  }
}
