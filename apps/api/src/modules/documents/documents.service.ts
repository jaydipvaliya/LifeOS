import { randomUUID } from 'node:crypto';
import { UPLOAD_LIMITS } from '@lifeos/config';
import type {
  DocumentDetailDto,
  DocumentListItemDto,
  PaginationMeta,
  SignedDownloadUrlResponse,
  UploadInitResponse,
} from '@lifeos/shared-types';
import type {
  DocumentListQuery,
  DocumentUploadCompleteInput,
  DocumentUploadInitInput,
  UpdateDocumentInput,
} from '@lifeos/validation';
import { BadRequestError, NotFoundError } from '../../shared/errors';
import type { RequestMeta } from '../auth/auth.types';
import type { ICategoriesRepository } from '../categories/categories.types';
import type { IExtractionQueue } from '../intelligence/extraction.queue';
import { buildSafeStorageKey, sanitizeOriginalFilename } from '../storage/file-signature';
import type { IStorageService } from '../storage/storage.types';
import type { DocumentDetailRecord, DocumentRecord, IDocumentsRepository } from './documents.types';

function toDocumentListItemDto(record: DocumentRecord): DocumentListItemDto {
  return {
    id: record.id,
    title: record.title,
    category: {
      id: record.category.id,
      slug: record.category.slug,
      name: record.category.name,
      isSystem: record.category.isSystem,
      iconName: record.category.iconName,
    },
    originalFilename: record.originalFilename,
    mimeType: record.mimeType,
    fileSizeBytes: record.fileSizeBytes,
    expiryDate: record.expiryDate ? record.expiryDate.toISOString().slice(0, 10) : null,
    processingStatus: record.processingStatus,
    tags: record.tags,
    isArchived: record.isArchived,
    version: record.version,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toDocumentDetailDto(record: DocumentDetailRecord): DocumentDetailDto {
  return {
    ...toDocumentListItemDto(record),
    archivedAt: record.archivedAt ? record.archivedAt.toISOString() : null,
    checksumSha256: record.checksumSha256,
    versions: record.versions,
    accessHistory: record.accessHistory,
    extractedSummary: record.extractedSummary,
    relatedEvents: record.relatedEvents,
    relatedTasks: record.relatedTasks,
    relatedAssets: record.relatedAssets,
  };
}

export class DocumentsService {
  constructor(
    private readonly documentsRepository: IDocumentsRepository,
    private readonly categoriesRepository: ICategoriesRepository,
    private readonly storageService: IStorageService,
    private readonly extractionQueue?: IExtractionQueue,
  ) {}

  async initiateUpload(
    userId: string,
    input: DocumentUploadInitInput,
    meta: RequestMeta,
  ): Promise<UploadInitResponse> {
    const category = await this.categoriesRepository.findAccessibleById(input.categoryId, userId);
    if (!category) {
      throw new NotFoundError('Selected document category was not found');
    }

    const documentId = randomUUID();
    const storageKey = buildSafeStorageKey(userId, documentId, input.mimeType);
    const cleanFilename = sanitizeOriginalFilename(input.originalFilename);

    await this.documentsRepository.createPendingDocument({
      id: documentId,
      userId,
      categoryId: category.id,
      title: input.title,
      originalFilename: cleanFilename,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      storageKey,
      expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
      tags: input.tags.map((t) => t.toLowerCase()),
      meta,
    });

    const signedUpload = await this.storageService.createSignedUploadUrl({
      storageKey,
      mimeType: input.mimeType,
      maxSizeBytes: UPLOAD_LIMITS.maxFileSizeBytes,
      expiresInSeconds: UPLOAD_LIMITS.signedUrlExpirySeconds,
    });

    return {
      documentId,
      storageKey,
      ...signedUpload,
    };
  }

  async completeUpload(
    userId: string,
    documentId: string,
    input: DocumentUploadCompleteInput,
    meta: RequestMeta,
  ): Promise<DocumentListItemDto> {
    const doc = await this.documentsRepository.findOwnedById(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document not found');
    }

    const stored = await this.storageService.headObject(doc.storageKey);
    if (!stored.exists) {
      throw new BadRequestError('Uploaded document file was not found in private storage');
    }

    const completed = await this.documentsRepository.markUploadComplete({
      documentId: doc.id,
      userId,
      fileSizeBytes: stored.sizeBytes ?? doc.fileSizeBytes,
      checksumSha256: input.checksumSha256 ?? stored.checksumSha256 ?? null,
      meta,
    });

    if (this.extractionQueue) {
      await this.extractionQueue.enqueueExtraction({
        documentId: doc.id,
        userId,
      });
    }

    return toDocumentListItemDto(completed);
  }

  async listDocuments(
    userId: string,
    query: DocumentListQuery,
  ): Promise<{ documents: DocumentListItemDto[]; pagination: PaginationMeta }> {
    const { items, total } = await this.documentsRepository.listOwned(userId, query);
    const totalPages = Math.max(1, Math.ceil(total / query.limit));

    return {
      documents: items.map(toDocumentListItemDto),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      },
    };
  }

  async getDocumentDetail(userId: string, documentId: string): Promise<DocumentDetailDto> {
    const detail = await this.documentsRepository.findOwnedDetailById(documentId, userId);
    if (!detail) {
      throw new NotFoundError('Document not found');
    }
    return toDocumentDetailDto(detail);
  }

  async updateMetadata(
    userId: string,
    documentId: string,
    input: UpdateDocumentInput,
    meta: RequestMeta,
  ): Promise<DocumentListItemDto> {
    if (input.categoryId) {
      const category = await this.categoriesRepository.findAccessibleById(input.categoryId, userId);
      if (!category) {
        throw new NotFoundError('Selected document category was not found');
      }
    }

    const normalizedInput: UpdateDocumentInput = {
      ...input,
      ...(input.tags ? { tags: input.tags.map((t) => t.toLowerCase()) } : {}),
    };

    const updated = await this.documentsRepository.updateOwnedMetadata(
      documentId,
      userId,
      normalizedInput,
      meta,
    );
    if (!updated) {
      throw new NotFoundError('Document not found');
    }
    return toDocumentListItemDto(updated);
  }

  async archiveDocument(
    userId: string,
    documentId: string,
    meta: RequestMeta,
  ): Promise<DocumentListItemDto> {
    const updated = await this.documentsRepository.setArchivedState(documentId, userId, true, meta);
    if (!updated) {
      throw new NotFoundError('Document not found');
    }
    return toDocumentListItemDto(updated);
  }

  async restoreDocument(
    userId: string,
    documentId: string,
    meta: RequestMeta,
  ): Promise<DocumentListItemDto> {
    const updated = await this.documentsRepository.setArchivedState(
      documentId,
      userId,
      false,
      meta,
    );
    if (!updated) {
      throw new NotFoundError('Document not found');
    }
    return toDocumentListItemDto(updated);
  }

  async deleteDocument(
    userId: string,
    documentId: string,
    meta: RequestMeta,
  ): Promise<{ deleted: true }> {
    const deleted = await this.documentsRepository.softDeleteOwned(documentId, userId, meta);
    if (!deleted) {
      throw new NotFoundError('Document not found');
    }
    await this.storageService.deleteObject(deleted.storageKey);
    return { deleted: true };
  }

  async getSignedDownloadUrl(
    userId: string,
    documentId: string,
    meta: RequestMeta,
  ): Promise<SignedDownloadUrlResponse> {
    const doc = await this.documentsRepository.findOwnedById(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document not found');
    }

    const signed = await this.storageService.createSignedDownloadUrl({
      storageKey: doc.storageKey,
      filename: doc.originalFilename,
      mimeType: doc.mimeType,
      expiresInSeconds: UPLOAD_LIMITS.signedUrlExpirySeconds,
    });

    await this.documentsRepository.recordAccessAudit(
      doc.id,
      userId,
      'document.download_url_issued',
      meta,
    );

    return signed;
  }
}
