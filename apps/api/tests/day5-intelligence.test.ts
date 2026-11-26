import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { DEFAULT_DOCUMENT_CATEGORIES } from '@lifeos/config';
import type {
  AiConversationDetailDto,
  AiConversationSummaryDto,
  AiMessageDto,
  AssistantCitationDto,
  DocumentAccessEventDto,
  DocumentExtractionDto,
  DocumentVersionDto,
  SyncBatchOperationResultDto,
  UniversalSearchResponseDto,
} from '@lifeos/shared-types';
import type {
  ConfirmExtractionInput,
  DocumentListQuery,
  SyncOperationItemInput,
  UpdateDocumentInput,
} from '@lifeos/validation';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import type { AssistantContextItem } from '../src/modules/ai/ai-provider';
import type { RequestMeta } from '../src/modules/auth/auth.types';
import { TokenService } from '../src/modules/auth/token.service';
import type {
  CategoryRecord,
  ICategoriesRepository,
} from '../src/modules/categories/categories.types';
import type {
  CreatePendingDocumentParams,
  DocumentDetailRecord,
  DocumentRecord,
  IDocumentsRepository,
} from '../src/modules/documents/documents.types';
import type {
  ExtractionStructuredBlob,
  IIntelligenceRepository,
  SaveExtractionParams,
} from '../src/modules/intelligence/extraction.types';
import { LocalPrivateStorageService } from '../src/modules/storage/local-storage.service';

class InMemoryDay5Store
  implements ICategoriesRepository, IDocumentsRepository, IIntelligenceRepository
{
  public categories: CategoryRecord[] = DEFAULT_DOCUMENT_CATEGORIES.map((c) => ({
    id: randomUUID(),
    userId: null,
    slug: c.slug,
    name: c.name,
    isSystem: true,
    iconName: null,
    documentCount: 0,
  }));
  public documents = new Map<string, DocumentRecord>();
  public extractions = new Map<string, DocumentExtractionDto>();
  public assets = new Map<
    string,
    { id: string; userId: string; name: string; warranty?: string | null }
  >();
  public events = new Map<string, { id: string; userId: string; title: string; date: string }>();
  public tasks = new Map<
    string,
    { id: string; userId: string; title: string; status: string; version: number }
  >();
  public conversations = new Map<string, AiConversationDetailDto>();

  async listForUser(): Promise<CategoryRecord[]> {
    return this.categories;
  }

  async findAccessibleById(categoryId: string): Promise<CategoryRecord | null> {
    return this.categories.find((c) => c.id === categoryId) ?? null;
  }

  async createCustomCategory(): Promise<CategoryRecord> {
    throw new Error('Not needed in Day 5 test');
  }

  async createPendingDocument(params: CreatePendingDocumentParams): Promise<DocumentRecord> {
    const category = this.categories.find((c) => c.id === params.categoryId)!;
    const now = new Date();
    const record: DocumentRecord = {
      id: params.id,
      userId: params.userId,
      categoryId: params.categoryId,
      category,
      title: params.title,
      originalFilename: params.originalFilename,
      mimeType: params.mimeType,
      fileSizeBytes: params.fileSizeBytes,
      storageKey: params.storageKey,
      checksumSha256: null,
      expiryDate: params.expiryDate,
      processingStatus: 'pending_upload',
      tags: params.tags,
      isArchived: false,
      archivedAt: null,
      deletedAt: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.documents.set(record.id, record);
    return record;
  }

  async findOwnedById(documentId: string, userId: string): Promise<DocumentRecord | null> {
    const doc = this.documents.get(documentId);
    if (!doc || doc.userId !== userId || doc.deletedAt) return null;
    return doc;
  }

  async findOwnedDetailById(
    documentId: string,
    userId: string,
  ): Promise<DocumentDetailRecord | null> {
    const doc = await this.findOwnedById(documentId, userId);
    if (!doc) return null;
    return {
      ...doc,
      versions: [] as DocumentVersionDto[],
      accessHistory: [] as DocumentAccessEventDto[],
      extractedSummary: null,
      relatedEvents: [],
      relatedTasks: [],
      relatedAssets: [],
    };
  }

  async markUploadComplete(params: {
    documentId: string;
    userId: string;
    fileSizeBytes: number;
    checksumSha256: string | null;
    meta: RequestMeta;
  }): Promise<DocumentRecord> {
    const doc = this.documents.get(params.documentId)!;
    doc.processingStatus = 'uploaded';
    doc.fileSizeBytes = params.fileSizeBytes;
    doc.checksumSha256 = params.checksumSha256;
    return doc;
  }

  async listOwned(userId: string, _query: DocumentListQuery) {
    const items = Array.from(this.documents.values()).filter((d) => d.userId === userId);
    return { items, total: items.length };
  }

  async updateOwnedMetadata(_id: string, _uid: string, _input: UpdateDocumentInput) {
    return null;
  }

  async setArchivedState() {
    return null;
  }

  async softDeleteOwned() {
    return null;
  }

  async recordAccessAudit() {}

  async saveExtractionResult(params: SaveExtractionParams): Promise<DocumentExtractionDto> {
    const now = new Date().toISOString();
    const dto: DocumentExtractionDto = {
      id: randomUUID(),
      documentId: params.documentId,
      documentType: params.documentType,
      suggestedTitle: params.payload.suggestedTitle,
      suggestedCategorySlug: params.payload.suggestedCategorySlug,
      summary: params.payload.summary,
      providerName: params.providerName,
      modelName: params.modelName,
      rawTextPreview: params.rawText.slice(0, 600),
      fields: params.payload.fields,
      suggestedActions: params.payload.suggestedActions,
      confidenceScore: params.confidenceScore,
      processingDurationMs: params.processingDurationMs,
      status: params.status,
      verifiedAt: null,
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
    };
    this.extractions.set(params.documentId, dto);
    const doc = this.documents.get(params.documentId);
    if (doc) doc.processingStatus = 'needs_review';
    return dto;
  }

  async findLatestExtraction(
    documentId: string,
    userId: string,
  ): Promise<DocumentExtractionDto | null> {
    const doc = await this.findOwnedById(documentId, userId);
    if (!doc) return null;
    return this.extractions.get(documentId) ?? null;
  }

  async confirmExtractionAndCreateActions(params: {
    userId: string;
    documentId: string;
    extractionId: string;
    input: ConfirmExtractionInput;
    existingPayload: ExtractionStructuredBlob;
    meta: RequestMeta;
  }) {
    const existing = this.extractions.get(params.documentId)!;
    const now = new Date().toISOString();
    const verified: DocumentExtractionDto = {
      ...existing,
      status: 'verified',
      verifiedAt: now,
      fields: params.input.fields.map((f) => ({
        key: f.key,
        label: f.label,
        value: f.value,
        confidence: 1,
        sourceLocation: 'User verified',
        verificationStatus: f.verificationStatus,
      })),
    };
    this.extractions.set(params.documentId, verified);
    const doc = this.documents.get(params.documentId);
    if (doc) {
      doc.processingStatus = 'verified';
      if (params.input.title) doc.title = params.input.title;
    }

    let createdAssetId: string | null = null;
    if (params.input.createAsset?.enabled) {
      createdAssetId = randomUUID();
      this.assets.set(createdAssetId, {
        id: createdAssetId,
        userId: params.userId,
        name: params.input.createAsset.name,
        warranty: params.input.createAsset.warrantyExpirationDate ?? null,
      });
    }

    let createdEventId: string | null = null;
    if (params.input.createEvent?.enabled) {
      createdEventId = randomUUID();
      this.events.set(createdEventId, {
        id: createdEventId,
        userId: params.userId,
        title: params.input.createEvent.title,
        date: params.input.createEvent.startDate,
      });
    }

    const createdReminderId = params.input.createReminder?.enabled ? randomUUID() : null;

    return {
      extraction: verified,
      createdAssetId,
      createdEventId,
      createdReminderId,
    };
  }

  async universalSearch(
    userId: string,
    query: string,
    limit: number,
  ): Promise<UniversalSearchResponseDto> {
    const q = query.toLowerCase();
    const docs = Array.from(this.documents.values())
      .filter((d) => d.userId === userId && d.title.toLowerCase().includes(q))
      .slice(0, limit)
      .map((d) => ({
        id: d.id,
        entityType: 'document' as const,
        title: d.title,
        subtitle: d.category.name,
        date: null,
        route: `/(app)/documents/${d.id}`,
      }));

    const assets = Array.from(this.assets.values())
      .filter((a) => a.userId === userId && a.name.toLowerCase().includes(q))
      .slice(0, limit)
      .map((a) => ({
        id: a.id,
        entityType: 'asset' as const,
        title: a.name,
        subtitle: 'laptop',
        date: a.warranty ?? null,
        route: `/(app)/assets/${a.id}`,
      }));

    const events = Array.from(this.events.values())
      .filter((e) => e.userId === userId && e.title.toLowerCase().includes(q))
      .slice(0, limit)
      .map((e) => ({
        id: e.id,
        entityType: 'event' as const,
        title: e.title,
        subtitle: 'warranty expiry',
        date: e.date,
        route: '/(app)/(tabs)/calendar',
      }));

    return {
      query,
      totalCount: docs.length + assets.length + events.length,
      documents: docs,
      tasks: [],
      events,
      assets,
      subscriptions: [],
    };
  }

  async gatherAssistantContext(userId: string): Promise<AssistantContextItem[]> {
    const items: AssistantContextItem[] = [];
    for (const d of this.documents.values()) {
      if (d.userId === userId) {
        items.push({
          entityType: 'document',
          entityId: d.id,
          title: d.title,
          details: `Category ${d.category.name}`,
        });
      }
    }
    for (const a of this.assets.values()) {
      if (a.userId === userId) {
        items.push({
          entityType: 'asset',
          entityId: a.id,
          title: a.name,
          details: a.warranty ? `Warranty expires ${a.warranty}` : 'Tracked asset',
        });
      }
    }
    return items;
  }

  async listConversations(): Promise<AiConversationSummaryDto[]> {
    return Array.from(this.conversations.values()).map((c) => ({
      id: c.id,
      title: c.title,
      updatedAt: c.updatedAt,
      lastMessagePreview: c.messages.at(-1)?.content ?? null,
    }));
  }

  async getConversationDetail(
    _userId: string,
    conversationId: string,
  ): Promise<AiConversationDetailDto | null> {
    return this.conversations.get(conversationId) ?? null;
  }

  async appendConversationTurn(params: {
    userId: string;
    conversationId?: string | null;
    question: string;
    answer: string;
    citations: AssistantCitationDto[];
  }) {
    const id = params.conversationId ?? randomUUID();
    const now = new Date().toISOString();
    const existing = this.conversations.get(id) ?? {
      id,
      title: params.question.slice(0, 60),
      updatedAt: now,
      messages: [],
    };

    const userMessage: AiMessageDto = {
      id: randomUUID(),
      conversationId: id,
      role: 'user',
      content: params.question,
      citations: [],
      createdAt: now,
    };
    const assistantMessage: AiMessageDto = {
      id: randomUUID(),
      conversationId: id,
      role: 'assistant',
      content: params.answer,
      citations: params.citations,
      createdAt: now,
    };

    existing.messages.push(userMessage, assistantMessage);
    existing.updatedAt = now;
    this.conversations.set(id, existing);

    return {
      conversationId: id,
      conversationTitle: existing.title,
      userMessage,
      assistantMessage,
    };
  }

  async processSyncBatch(params: {
    userId: string;
    deviceId: string | null;
    operations: SyncOperationItemInput[];
  }): Promise<SyncBatchOperationResultDto[]> {
    return params.operations.map((op) => {
      if (op.operationType === 'create') {
        this.tasks.set(op.entityId, {
          id: op.entityId,
          userId: params.userId,
          title: String(op.payload.title ?? 'Task'),
          status: 'pending',
          version: 1,
        });
        return {
          clientOperationId: op.clientOperationId,
          entityType: op.entityType,
          entityId: op.entityId,
          status: 'synced',
          serverVersion: 1,
        };
      }
      const existing = this.tasks.get(op.entityId);
      if (existing && existing.version > op.clientVersion) {
        return {
          clientOperationId: op.clientOperationId,
          entityType: op.entityType,
          entityId: op.entityId,
          status: 'conflict',
          serverVersion: existing.version,
          errorMessage: 'Version conflict detected',
        };
      }
      if (existing) {
        existing.version += 1;
        return {
          clientOperationId: op.clientOperationId,
          entityType: op.entityType,
          entityId: op.entityId,
          status: 'synced',
          serverVersion: existing.version,
        };
      }
      return {
        clientOperationId: op.clientOperationId,
        entityType: op.entityType,
        entityId: op.entityId,
        status: 'failed',
        errorMessage: 'Not found',
      };
    });
  }

  async getPendingSyncCount(): Promise<number> {
    return 0;
  }
}

describe('Day 5 Life Intelligence, Search, Assistant & Sync APIs', () => {
  const tmpDir = path.join(os.tmpdir(), `lifeos-day5-${Date.now()}`);
  const store = new InMemoryDay5Store();
  const storageService = new LocalPrivateStorageService(
    tmpDir,
    'test-signing-secret-must-be-long-enough-1234',
    'http://127.0.0.1:4000',
  );
  const tokenService = new TokenService();
  const app = createApp({
    categoriesRepository: store,
    documentsRepository: store,
    intelligenceRepository: store,
    storageService,
    localStorageService: storageService,
    tokenService,
  });

  const user1Id = randomUUID();
  const user2Id = randomUUID();
  const token1 = tokenService.signAccessToken({
    userId: user1Id,
    email: 'owner@lifeos.dev',
    deviceId: null,
  }).accessToken;
  const token2 = tokenService.signAccessToken({
    userId: user2Id,
    email: 'other@lifeos.dev',
    deviceId: null,
  }).accessToken;

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('analyzes an uploaded invoice PDF, requires explicit confirmation, and creates asset/event/reminder', async () => {
    const receiptsCat = store.categories.find((c) => c.slug === 'purchase-receipts')!;
    const pdfBuffer = Buffer.from(
      '%PDF-1.4\n(MacBook Air M3 Invoice)\n(Serial: C02XYZ12345)\n(Amount: INR 114900)\n(24 months warranty)\n(2026-11-01)\n%%EOF',
    );

    const initRes = await request(app)
      .post('/api/v1/documents/upload-init')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        title: 'MacBook Air M3 Invoice',
        categoryId: receiptsCat.id,
        originalFilename: 'macbook-invoice.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: pdfBuffer.length,
        tags: ['laptop'],
      });
    expect(initRes.status).toBe(201);
    const { documentId, uploadUrl } = initRes.body.data;

    const uploadPath = new URL(uploadUrl).pathname + new URL(uploadUrl).search;
    await request(app)
      .put(uploadPath)
      .set('Content-Type', 'application/pdf')
      .send(pdfBuffer)
      .expect(200);

    await request(app)
      .post(`/api/v1/documents/${documentId}/upload-complete`)
      .set('Authorization', `Bearer ${token1}`)
      .send({})
      .expect(200);

    const analyzeRes = await request(app)
      .post(`/api/v1/documents/${documentId}/extraction/analyze`)
      .set('Authorization', `Bearer ${token1}`)
      .send({});

    expect(analyzeRes.status).toBe(200);
    expect(analyzeRes.body.data.extraction.documentType).toBe('purchase_invoice');
    expect(analyzeRes.body.data.extraction.status).toBe('completed');
    expect(store.assets.size).toBe(0);

    const confirmRes = await request(app)
      .post(`/api/v1/documents/${documentId}/extraction/confirm`)
      .set('Authorization', `Bearer ${token1}`)
      .send({
        title: 'MacBook Air M3 Invoice',
        fields: [
          {
            key: 'productName',
            label: 'Product Name',
            value: 'MacBook Air M3',
            verificationStatus: 'confirmed',
          },
        ],
        createAsset: {
          enabled: true,
          name: 'MacBook Air M3',
          category: 'laptop',
          purchasePrice: 114900,
          currency: 'INR',
          warrantyExpirationDate: '2028-11-01',
        },
        createEvent: {
          enabled: true,
          title: 'MacBook Air M3 warranty expires',
          category: 'warranty_expiry',
          startDate: '2028-11-01',
        },
        createReminder: {
          enabled: true,
          title: 'Check MacBook Air warranty',
          remindDate: '2028-10-18',
        },
      });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.createdAssetId).toBeTruthy();
    expect(confirmRes.body.data.createdEventId).toBeTruthy();
    expect(confirmRes.body.data.createdReminderId).toBeTruthy();
    expect(store.assets.size).toBe(1);

    const searchOwner = await request(app)
      .get('/api/v1/search?q=MacBook')
      .set('Authorization', `Bearer ${token1}`);
    expect(searchOwner.status).toBe(200);
    expect(searchOwner.body.data.totalCount).toBeGreaterThanOrEqual(3);

    const searchOther = await request(app)
      .get('/api/v1/search?q=MacBook')
      .set('Authorization', `Bearer ${token2}`);
    expect(searchOther.status).toBe(200);
    expect(searchOther.body.data.totalCount).toBe(0);

    const askRes = await request(app)
      .post('/api/v1/assistant/ask')
      .set('Authorization', `Bearer ${token1}`)
      .send({ question: 'When does my MacBook warranty expire?' });
    expect(askRes.status).toBe(200);
    expect(askRes.body.data.assistantMessage.content).toContain('MacBook');
    expect(askRes.body.data.assistantMessage.citations.length).toBeGreaterThan(0);
  });

  it('processes sync outbox batches with optimistic concurrency conflict detection', async () => {
    const taskId = randomUUID();
    const firstSync = await request(app)
      .post('/api/v1/sync/batch')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        operations: [
          {
            clientOperationId: 'op-1',
            entityType: 'task',
            entityId: taskId,
            operationType: 'create',
            clientVersion: 1,
            payload: { title: 'Offline created task' },
          },
        ],
      });
    expect(firstSync.status).toBe(200);
    expect(firstSync.body.data.results[0].status).toBe('synced');

    // Simulate newer server version
    store.tasks.get(taskId)!.version = 3;

    const staleUpdate = await request(app)
      .post('/api/v1/sync/batch')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        operations: [
          {
            clientOperationId: 'op-2',
            entityType: 'task',
            entityId: taskId,
            operationType: 'update',
            clientVersion: 1,
            payload: { title: 'Stale client edit' },
          },
        ],
      });
    expect(staleUpdate.status).toBe(200);
    expect(staleUpdate.body.data.results[0].status).toBe('conflict');
    expect(staleUpdate.body.data.results[0].serverVersion).toBe(3);
  });
});
