import type { DocumentListQuery, UpdateDocumentInput } from '@lifeos/validation';
import type { Prisma, PrismaClient } from '@prisma/client';
import type { RequestMeta } from '../auth/auth.types';
import type {
  CreatePendingDocumentParams,
  DocumentDetailRecord,
  DocumentRecord,
  IDocumentsRepository,
} from './documents.types';

function mapDocumentRow(
  row: Prisma.DocumentGetPayload<{ include: { category: true } }>,
): DocumentRecord {
  return {
    id: row.id,
    userId: row.userId,
    categoryId: row.categoryId,
    category: {
      id: row.category.id,
      userId: row.category.userId,
      slug: row.category.slug,
      name: row.category.name,
      isSystem: row.category.isSystem,
      iconName: row.category.iconName,
      documentCount: 0,
    },
    title: row.title,
    originalFilename: row.originalFilename,
    mimeType: row.mimeType,
    fileSizeBytes: row.fileSizeBytes,
    storageKey: row.storageKey,
    checksumSha256: row.checksumSha256,
    expiryDate: row.expiryDate,
    processingStatus: row.processingStatus,
    tags: row.tags,
    isArchived: row.isArchived,
    archivedAt: row.archivedAt,
    deletedAt: row.deletedAt,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaDocumentsRepository implements IDocumentsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createPendingDocument(params: CreatePendingDocumentParams): Promise<DocumentRecord> {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.document.create({
        data: {
          id: params.id,
          userId: params.userId,
          categoryId: params.categoryId,
          title: params.title,
          originalFilename: params.originalFilename,
          mimeType: params.mimeType,
          fileSizeBytes: params.fileSizeBytes,
          storageKey: params.storageKey,
          expiryDate: params.expiryDate,
          tags: params.tags,
          processingStatus: 'pending_upload',
        },
        include: { category: true },
      });

      await tx.auditLog.create({
        data: {
          userId: params.userId,
          action: 'document.upload_initiated',
          resourceType: 'document',
          resourceId: created.id,
          ipAddress: params.meta.ipAddress,
          userAgent: params.meta.userAgent,
          metadata: { mimeType: params.mimeType, fileSizeBytes: params.fileSizeBytes },
        },
      });

      return mapDocumentRow(created);
    });
  }

  async findOwnedById(documentId: string, userId: string): Promise<DocumentRecord | null> {
    const row = await this.prisma.document.findFirst({
      where: { id: documentId, userId, deletedAt: null },
      include: { category: true },
    });
    return row ? mapDocumentRow(row) : null;
  }

  async findOwnedDetailById(
    documentId: string,
    userId: string,
  ): Promise<DocumentDetailRecord | null> {
    const row = await this.prisma.document.findFirst({
      where: { id: documentId, userId, deletedAt: null },
      include: {
        category: true,
        versions: { orderBy: { versionNumber: 'desc' } },
        extractedData: { orderBy: { createdAt: 'desc' }, take: 1 },
        events: { orderBy: { startAt: 'asc' }, take: 10 },
        tasks: { orderBy: { createdAt: 'desc' }, take: 10 },
        assetDocuments: { include: { asset: true }, take: 10 },
      },
    });

    if (!row) return null;

    const accessLogs = await this.prisma.auditLog.findMany({
      where: {
        userId,
        resourceType: 'document',
        resourceId: documentId,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const latestExtraction = row.extractedData[0];

    return {
      ...mapDocumentRow(row),
      versions: row.versions.map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        mimeType: v.mimeType,
        fileSizeBytes: v.fileSizeBytes,
        checksumSha256: v.checksumSha256,
        createdAt: v.createdAt.toISOString(),
      })),
      accessHistory: accessLogs.map((log) => ({
        id: log.id,
        action: log.action,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt.toISOString(),
      })),
      extractedSummary: latestExtraction
        ? (latestExtraction.structuredPayload as Record<string, unknown>)
        : null,
      relatedEvents: row.events.map((e) => ({
        id: e.id,
        title: e.title,
        subtitle: e.category,
        date: e.startAt.toISOString(),
      })),
      relatedTasks: row.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        subtitle: t.status,
        date: t.dueAt ? t.dueAt.toISOString() : null,
      })),
      relatedAssets: row.assetDocuments.map((ad) => ({
        id: ad.asset.id,
        title: ad.asset.name,
        subtitle: ad.asset.brand ?? ad.asset.category,
        date: ad.asset.warrantyExpirationDate
          ? ad.asset.warrantyExpirationDate.toISOString()
          : null,
      })),
    };
  }

  async markUploadComplete(params: {
    documentId: string;
    userId: string;
    fileSizeBytes: number;
    checksumSha256: string | null;
    meta: RequestMeta;
  }): Promise<DocumentRecord> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.document.findFirst({
        where: { id: params.documentId, userId: params.userId, deletedAt: null },
      });
      if (!existing) {
        throw new Error('Document not found during completion');
      }

      const updated = await tx.document.update({
        where: { id: existing.id },
        data: {
          processingStatus: 'uploaded',
          fileSizeBytes: params.fileSizeBytes,
          checksumSha256: params.checksumSha256,
        },
        include: { category: true },
      });

      await tx.documentVersion.upsert({
        where: {
          documentId_versionNumber: {
            documentId: existing.id,
            versionNumber: existing.version,
          },
        },
        create: {
          documentId: existing.id,
          versionNumber: existing.version,
          storageKey: existing.storageKey,
          mimeType: existing.mimeType,
          fileSizeBytes: params.fileSizeBytes,
          checksumSha256: params.checksumSha256,
        },
        update: {
          fileSizeBytes: params.fileSizeBytes,
          checksumSha256: params.checksumSha256,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: params.userId,
          action: 'document.uploaded',
          resourceType: 'document',
          resourceId: existing.id,
          ipAddress: params.meta.ipAddress,
          userAgent: params.meta.userAgent,
          metadata: { version: existing.version, fileSizeBytes: params.fileSizeBytes },
        },
      });

      return mapDocumentRow(updated);
    });
  }

  async listOwned(
    userId: string,
    query: DocumentListQuery,
  ): Promise<{ items: DocumentRecord[]; total: number }> {
    const where: Prisma.DocumentWhereInput = {
      userId,
      deletedAt: null,
      isArchived: query.archived ?? false,
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.tag ? { tags: { has: query.tag } } : {}),
      ...(query.expiringWithinDays
        ? {
            expiryDate: {
              gte: new Date(new Date().toISOString().slice(0, 10)),
              lte: new Date(Date.now() + query.expiringWithinDays * 86_400_000),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { originalFilename: { contains: query.search, mode: 'insensitive' } },
              { tags: { has: query.search.toLowerCase() } },
            ],
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.document.findMany({
        where,
        include: { category: true },
        orderBy: [{ updatedAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.document.count({ where }),
    ]);

    return {
      items: rows.map(mapDocumentRow),
      total,
    };
  }

  async updateOwnedMetadata(
    documentId: string,
    userId: string,
    input: UpdateDocumentInput,
    meta: RequestMeta,
  ): Promise<DocumentRecord | null> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.document.findFirst({
        where: { id: documentId, userId, deletedAt: null },
      });
      if (!existing) return null;

      const updated = await tx.document.update({
        where: { id: existing.id },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
          ...(input.tags !== undefined ? { tags: input.tags } : {}),
          ...(input.expiryDate !== undefined
            ? { expiryDate: input.expiryDate ? new Date(input.expiryDate) : null }
            : {}),
        },
        include: { category: true },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'document.metadata_updated',
          resourceType: 'document',
          resourceId: existing.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });

      return mapDocumentRow(updated);
    });
  }

  async setArchivedState(
    documentId: string,
    userId: string,
    archived: boolean,
    meta: RequestMeta,
  ): Promise<DocumentRecord | null> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.document.findFirst({
        where: { id: documentId, userId, deletedAt: null },
      });
      if (!existing) return null;

      const updated = await tx.document.update({
        where: { id: existing.id },
        data: {
          isArchived: archived,
          archivedAt: archived ? new Date() : null,
        },
        include: { category: true },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: archived ? 'document.archived' : 'document.restored',
          resourceType: 'document',
          resourceId: existing.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });

      return mapDocumentRow(updated);
    });
  }

  async softDeleteOwned(
    documentId: string,
    userId: string,
    meta: RequestMeta,
  ): Promise<DocumentRecord | null> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.document.findFirst({
        where: { id: documentId, userId, deletedAt: null },
      });
      if (!existing) return null;

      const updated = await tx.document.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() },
        include: { category: true },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'document.deleted',
          resourceType: 'document',
          resourceId: existing.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });

      return mapDocumentRow(updated);
    });
  }

  async recordAccessAudit(
    documentId: string,
    userId: string,
    action: string,
    meta: RequestMeta,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        resourceType: 'document',
        resourceId: documentId,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });
  }
}
