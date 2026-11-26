import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { DEFAULT_DOCUMENT_CATEGORIES } from '@lifeos/config';
import type {
  DashboardDataDto,
  DocumentAccessEventDto,
  DocumentVersionDto,
} from '@lifeos/shared-types';
import type { DocumentListQuery, UpdateDocumentInput } from '@lifeos/validation';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import type { RequestMeta } from '../src/modules/auth/auth.types';
import { TokenService } from '../src/modules/auth/token.service';
import type {
  CategoryRecord,
  ICategoriesRepository,
} from '../src/modules/categories/categories.types';
import type { IDashboardRepository } from '../src/modules/dashboard/dashboard.types';
import type {
  CreatePendingDocumentParams,
  DocumentDetailRecord,
  DocumentRecord,
  IDocumentsRepository,
} from '../src/modules/documents/documents.types';
import { LocalPrivateStorageService } from '../src/modules/storage/local-storage.service';
import { ConflictError } from '../src/shared/errors';

class InMemoryVaultStore
  implements ICategoriesRepository, IDocumentsRepository, IDashboardRepository
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
  public versions = new Map<string, DocumentVersionDto[]>();
  public audits = new Map<string, DocumentAccessEventDto[]>();

  async listForUser(userId: string): Promise<CategoryRecord[]> {
    return this.categories
      .filter((c) => c.isSystem || c.userId === userId)
      .map((c) => ({
        ...c,
        documentCount: Array.from(this.documents.values()).filter(
          (d) => d.userId === userId && d.categoryId === c.id && !d.deletedAt && !d.isArchived,
        ).length,
      }));
  }

  async findAccessibleById(categoryId: string, userId: string): Promise<CategoryRecord | null> {
    return (
      this.categories.find((c) => c.id === categoryId && (c.isSystem || c.userId === userId)) ??
      null
    );
  }

  async createCustomCategory(params: {
    userId: string;
    slug: string;
    name: string;
    iconName?: string | null;
  }): Promise<CategoryRecord> {
    const duplicate = this.categories.find(
      (c) => c.slug === params.slug && (c.isSystem || c.userId === params.userId),
    );
    if (duplicate) {
      throw new ConflictError('A category with this name already exists');
    }
    const created: CategoryRecord = {
      id: randomUUID(),
      userId: params.userId,
      slug: params.slug,
      name: params.name,
      isSystem: false,
      iconName: params.iconName ?? null,
      documentCount: 0,
    };
    this.categories.push(created);
    return created;
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
    await this.recordAccessAudit(
      record.id,
      params.userId,
      'document.upload_initiated',
      params.meta,
    );
    return record;
  }

  async findOwnedById(documentId: string, userId: string): Promise<DocumentRecord | null> {
    const doc = this.documents.get(documentId);
    if (!doc || doc.userId !== userId || doc.deletedAt !== null) return null;
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
      versions: this.versions.get(doc.id) ?? [],
      accessHistory: this.audits.get(doc.id) ?? [],
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
    doc.updatedAt = new Date();

    const list = this.versions.get(doc.id) ?? [];
    list.unshift({
      id: randomUUID(),
      versionNumber: doc.version,
      mimeType: doc.mimeType,
      fileSizeBytes: params.fileSizeBytes,
      checksumSha256: params.checksumSha256,
      createdAt: new Date().toISOString(),
    });
    this.versions.set(doc.id, list);
    await this.recordAccessAudit(doc.id, params.userId, 'document.uploaded', params.meta);
    return doc;
  }

  async listOwned(
    userId: string,
    query: DocumentListQuery,
  ): Promise<{ items: DocumentRecord[]; total: number }> {
    const all = Array.from(this.documents.values()).filter((d) => {
      if (d.userId !== userId || d.deletedAt !== null) return false;
      if (d.isArchived !== (query.archived ?? false)) return false;
      if (query.categoryId && d.categoryId !== query.categoryId) return false;
      if (query.tag && !d.tags.includes(query.tag)) return false;
      if (query.search) {
        const needle = query.search.toLowerCase();
        const match =
          d.title.toLowerCase().includes(needle) ||
          d.originalFilename.toLowerCase().includes(needle) ||
          d.tags.some((t) => t.includes(needle));
        if (!match) return false;
      }
      return true;
    });

    const start = (query.page - 1) * query.limit;
    return {
      items: all.slice(start, start + query.limit),
      total: all.length,
    };
  }

  async updateOwnedMetadata(
    documentId: string,
    userId: string,
    input: UpdateDocumentInput,
    meta: RequestMeta,
  ): Promise<DocumentRecord | null> {
    const doc = await this.findOwnedById(documentId, userId);
    if (!doc) return null;
    if (input.title !== undefined) doc.title = input.title;
    if (input.categoryId !== undefined) {
      doc.categoryId = input.categoryId;
      doc.category = this.categories.find((c) => c.id === input.categoryId)!;
    }
    if (input.tags !== undefined) doc.tags = input.tags;
    if (input.expiryDate !== undefined) {
      doc.expiryDate = input.expiryDate ? new Date(input.expiryDate) : null;
    }
    doc.updatedAt = new Date();
    await this.recordAccessAudit(doc.id, userId, 'document.metadata_updated', meta);
    return doc;
  }

  async setArchivedState(
    documentId: string,
    userId: string,
    archived: boolean,
    meta: RequestMeta,
  ): Promise<DocumentRecord | null> {
    const doc = await this.findOwnedById(documentId, userId);
    if (!doc) return null;
    doc.isArchived = archived;
    doc.archivedAt = archived ? new Date() : null;
    doc.updatedAt = new Date();
    await this.recordAccessAudit(
      doc.id,
      userId,
      archived ? 'document.archived' : 'document.restored',
      meta,
    );
    return doc;
  }

  async softDeleteOwned(
    documentId: string,
    userId: string,
    meta: RequestMeta,
  ): Promise<DocumentRecord | null> {
    const doc = await this.findOwnedById(documentId, userId);
    if (!doc) return null;
    doc.deletedAt = new Date();
    await this.recordAccessAudit(doc.id, userId, 'document.deleted', meta);
    return doc;
  }

  async recordAccessAudit(
    documentId: string,
    _userId: string,
    action: string,
    meta: RequestMeta,
  ): Promise<void> {
    const logs = this.audits.get(documentId) ?? [];
    logs.unshift({
      id: randomUUID(),
      action,
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent ?? null,
      createdAt: new Date().toISOString(),
    });
    this.audits.set(documentId, logs);
  }

  async getDashboardData(userId: string): Promise<DashboardDataDto> {
    const userDocs = Array.from(this.documents.values()).filter(
      (d) => d.userId === userId && d.deletedAt === null && !d.isArchived,
    );
    return {
      generatedAt: new Date().toISOString(),
      summaryCounts: {
        totalDocuments: userDocs.length,
        expiringDocumentsSoon: userDocs.filter((d) => d.expiryDate !== null).length,
        pendingTasksToday: 0,
        upcomingDeadlinesCount: 0,
        activeAssetsCount: 0,
        activeSubscriptionsCount: 0,
      },
      upcomingEvent: null,
      todaysTasks: [],
      upcomingDeadlines: [],
      expiringDocuments: [],
      recentDocuments: userDocs.map((d) => ({
        id: d.id,
        title: d.title,
        category: {
          id: d.category.id,
          slug: d.category.slug,
          name: d.category.name,
          isSystem: d.category.isSystem,
          iconName: d.category.iconName,
        },
        originalFilename: d.originalFilename,
        mimeType: d.mimeType,
        fileSizeBytes: d.fileSizeBytes,
        expiryDate: d.expiryDate ? d.expiryDate.toISOString().slice(0, 10) : null,
        processingStatus: d.processingStatus,
        tags: d.tags,
        isArchived: d.isArchived,
        version: d.version,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
      warrantyReminders: [],
      subscriptionRenewals: [],
      weeklyActivity: [],
      insights: [],
    };
  }
}

describe('Categories, Document Vault, Private Storage & Dashboard API', () => {
  const tempDir = path.join(os.tmpdir(), `lifeos-test-storage-${Date.now()}`);
  const tokenService = new TokenService();
  const userAId = randomUUID();
  const userBId = randomUUID();
  const tokenA = tokenService.signAccessToken({
    userId: userAId,
    email: 'usera@lifeos.app',
    deviceId: null,
  }).accessToken;
  const tokenB = tokenService.signAccessToken({
    userId: userBId,
    email: 'userb@lifeos.app',
    deviceId: null,
  }).accessToken;

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('lists 11 system categories and creates custom user-scoped categories', async () => {
    const store = new InMemoryVaultStore();
    const localStorage = new LocalPrivateStorageService(
      tempDir,
      'test-signing-secret-32-chars!!',
      'http://127.0.0.1:4000',
    );
    const app = createApp({
      categoriesRepository: store,
      documentsRepository: store,
      dashboardRepository: store,
      storageService: localStorage,
      localStorageService: localStorage,
      tokenService,
    });

    const listRes = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.categories).toHaveLength(11);

    const createRes = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'University Housing' });
    expect(createRes.status).toBe(201);
    expect(createRes.body.data.category.slug).toBe('university-housing');

    const userBList = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(userBList.body.data.categories).toHaveLength(11);
  });

  it('completes private upload with magic-byte validation, enforces ownership, and aggregates dashboard', async () => {
    const store = new InMemoryVaultStore();
    const localStorage = new LocalPrivateStorageService(
      tempDir,
      'test-signing-secret-32-chars!!',
      'http://127.0.0.1:4000',
    );
    const app = createApp({
      categoriesRepository: store,
      documentsRepository: store,
      dashboardRepository: store,
      storageService: localStorage,
      localStorageService: localStorage,
      tokenService,
    });

    const receiptsCategory = store.categories.find((c) => c.slug === 'purchase-receipts')!;
    const pdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');

    const initRes = await request(app)
      .post('/api/v1/documents/upload-init')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'MacBook Air Receipt',
        categoryId: receiptsCategory.id,
        originalFilename: 'macbook-receipt.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: pdfBuffer.length,
        tags: ['Laptop', 'Apple'],
      });

    expect(initRes.status).toBe(201);
    const { documentId, uploadUrl } = initRes.body.data;
    const uploadPath = new URL(uploadUrl).pathname + new URL(uploadUrl).search;

    // Reject spoofed non-PDF payload.
    const badBinary = await request(app)
      .put(uploadPath)
      .set('Content-Type', 'application/pdf')
      .send(Buffer.from('not-a-real-pdf-binary'));
    expect(badBinary.status).toBe(400);

    // Upload valid PDF binary.
    const goodBinary = await request(app)
      .put(uploadPath)
      .set('Content-Type', 'application/pdf')
      .send(pdfBuffer);
    expect(goodBinary.status).toBe(200);

    const completeRes = await request(app)
      .post(`/api/v1/documents/${documentId}/upload-complete`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({});
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.document.processingStatus).toBe('uploaded');

    // Cross-user access must be denied.
    const userBGet = await request(app)
      .get(`/api/v1/documents/${documentId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(userBGet.status).toBe(404);

    // Owner detail, search, signed download, archive, restore, and dashboard.
    const searchRes = await request(app)
      .get('/api/v1/documents?search=MacBook')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.documents).toHaveLength(1);

    const dlUrlRes = await request(app)
      .get(`/api/v1/documents/${documentId}/download-url`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(dlUrlRes.status).toBe(200);
    const dlPath =
      new URL(dlUrlRes.body.data.downloadUrl).pathname +
      new URL(dlUrlRes.body.data.downloadUrl).search;
    const dlFileRes = await request(app).get(dlPath);
    expect(dlFileRes.status).toBe(200);
    expect(Buffer.from(dlFileRes.body).subarray(0, 5).toString('ascii')).toBe('%PDF-');

    const detailRes = await request(app)
      .get(`/api/v1/documents/${documentId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.document.versions).toHaveLength(1);
    expect(detailRes.body.data.document.accessHistory.length).toBeGreaterThanOrEqual(3);

    const dashRes = await request(app)
      .get('/api/v1/dashboard')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(dashRes.status).toBe(200);
    expect(dashRes.body.data.summaryCounts.totalDocuments).toBe(1);

    const archiveRes = await request(app)
      .post(`/api/v1/documents/${documentId}/archive`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(archiveRes.status).toBe(200);
    expect(archiveRes.body.data.document.isArchived).toBe(true);

    const delRes = await request(app)
      .delete(`/api/v1/documents/${documentId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(delRes.status).toBe(200);
  });
});
