import type {
  DocumentAccessEventDto,
  DocumentProcessingStatus,
  DocumentVersionDto,
  LinkedSummaryItem,
} from '@lifeos/shared-types';
import type { DocumentListQuery, UpdateDocumentInput } from '@lifeos/validation';
import type { RequestMeta } from '../auth/auth.types';
import type { CategoryRecord } from '../categories/categories.types';

export interface DocumentRecord {
  id: string;
  userId: string;
  categoryId: string;
  category: CategoryRecord;
  title: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  storageKey: string;
  checksumSha256: string | null;
  expiryDate: Date | null;
  processingStatus: DocumentProcessingStatus;
  tags: string[];
  isArchived: boolean;
  archivedAt: Date | null;
  deletedAt: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentDetailRecord extends DocumentRecord {
  versions: DocumentVersionDto[];
  accessHistory: DocumentAccessEventDto[];
  extractedSummary: Record<string, unknown> | null;
  relatedEvents: LinkedSummaryItem[];
  relatedTasks: LinkedSummaryItem[];
  relatedAssets: LinkedSummaryItem[];
}

export interface CreatePendingDocumentParams {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  storageKey: string;
  expiryDate: Date | null;
  tags: string[];
  meta: RequestMeta;
}

export interface IDocumentsRepository {
  createPendingDocument(params: CreatePendingDocumentParams): Promise<DocumentRecord>;
  findOwnedById(documentId: string, userId: string): Promise<DocumentRecord | null>;
  findOwnedDetailById(documentId: string, userId: string): Promise<DocumentDetailRecord | null>;
  markUploadComplete(params: {
    documentId: string;
    userId: string;
    fileSizeBytes: number;
    checksumSha256: string | null;
    meta: RequestMeta;
  }): Promise<DocumentRecord>;
  listOwned(
    userId: string,
    query: DocumentListQuery,
  ): Promise<{ items: DocumentRecord[]; total: number }>;
  updateOwnedMetadata(
    documentId: string,
    userId: string,
    input: UpdateDocumentInput,
    meta: RequestMeta,
  ): Promise<DocumentRecord | null>;
  setArchivedState(
    documentId: string,
    userId: string,
    archived: boolean,
    meta: RequestMeta,
  ): Promise<DocumentRecord | null>;
  softDeleteOwned(
    documentId: string,
    userId: string,
    meta: RequestMeta,
  ): Promise<DocumentRecord | null>;
  recordAccessAudit(
    documentId: string,
    userId: string,
    action: string,
    meta: RequestMeta,
  ): Promise<void>;
}
