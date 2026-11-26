import type {
  CreateAssetInput,
  CreateAssetRepairInput,
  UpdateAssetInput,
} from '@lifeos/validation';
import type { Prisma, PrismaClient } from '@prisma/client';
import { NotFoundError } from '../../shared/errors';
import type {
  AssetDetailRecord,
  AssetRecord,
  AssetRepairRecord,
  IAssetsRepository,
} from './assets.types';

type AssetWithDocs = Prisma.AssetGetPayload<{
  include: {
    assetDocuments: {
      include: {
        document: {
          select: { id: true; title: true; originalFilename: true; mimeType: true };
        };
      };
    };
    _count: { select: { repairs: true } };
  };
}>;

function mapAssetRow(row: AssetWithDocs): AssetRecord {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    category: row.category,
    brand: row.brand,
    model: row.model,
    serialNumber: row.serialNumber,
    purchaseDate: row.purchaseDate,
    purchasePrice: row.purchasePrice ? row.purchasePrice.toString() : null,
    currency: row.currency,
    warrantyStartDate: row.warrantyStartDate,
    warrantyExpirationDate: row.warrantyExpirationDate,
    serviceInfo: row.serviceInfo,
    notes: row.notes,
    linkedDocuments: row.assetDocuments.map((ad) => ({
      documentId: ad.document.id,
      title: ad.document.title,
      originalFilename: ad.document.originalFilename,
      mimeType: ad.document.mimeType,
      relationType: ad.relationType,
    })),
    repairsCount: row._count.repairs,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaAssetsRepository implements IAssetsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listForUser(userId: string, search?: string): Promise<AssetRecord[]> {
    const rows = await this.prisma.asset.findMany({
      where: {
        userId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { brand: { contains: search, mode: 'insensitive' } },
                { model: { contains: search, mode: 'insensitive' } },
                { serialNumber: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        assetDocuments: {
          include: {
            document: {
              select: { id: true, title: true, originalFilename: true, mimeType: true },
            },
          },
        },
        _count: { select: { repairs: true } },
      },
      orderBy: [{ warrantyExpirationDate: 'asc' }, { updatedAt: 'desc' }],
    });

    return rows.map(mapAssetRow);
  }

  async findOwnedDetailById(assetId: string, userId: string): Promise<AssetDetailRecord | null> {
    const row = await this.prisma.asset.findFirst({
      where: { id: assetId, userId },
      include: {
        assetDocuments: {
          include: {
            document: {
              select: { id: true, title: true, originalFilename: true, mimeType: true },
            },
          },
        },
        repairs: { orderBy: { repairDate: 'desc' } },
        _count: { select: { repairs: true } },
      },
    });

    if (!row) return null;

    return {
      ...mapAssetRow(row),
      repairs: row.repairs.map((r) => ({
        id: r.id,
        assetId: r.assetId,
        userId: r.userId,
        repairDate: r.repairDate,
        providerName: r.providerName,
        issueSummary: r.issueSummary,
        cost: r.cost ? r.cost.toString() : null,
        currency: r.currency,
        notes: r.notes,
        createdAt: r.createdAt,
      })),
    };
  }

  async createForUser(userId: string, input: CreateAssetInput): Promise<AssetRecord> {
    return this.prisma.$transaction(async (tx) => {
      if (input.linkedDocumentIds.length > 0) {
        const ownedCount = await tx.document.count({
          where: {
            id: { in: input.linkedDocumentIds },
            userId,
            deletedAt: null,
          },
        });
        if (ownedCount !== input.linkedDocumentIds.length) {
          throw new NotFoundError('One or more linked documents were not found');
        }
      }

      const created = await tx.asset.create({
        data: {
          userId,
          name: input.name,
          category: input.category,
          brand: input.brand ?? null,
          model: input.model ?? null,
          serialNumber: input.serialNumber ?? null,
          purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
          purchasePrice: input.purchasePrice ?? null,
          currency: input.currency.toUpperCase(),
          warrantyStartDate: input.warrantyStartDate ? new Date(input.warrantyStartDate) : null,
          warrantyExpirationDate: input.warrantyExpirationDate
            ? new Date(input.warrantyExpirationDate)
            : null,
          serviceInfo: input.serviceInfo ?? null,
          notes: input.notes ?? null,
          assetDocuments:
            input.linkedDocumentIds.length > 0
              ? {
                  create: input.linkedDocumentIds.map((documentId) => ({
                    documentId,
                    relationType: 'invoice',
                  })),
                }
              : undefined,
        },
        include: {
          assetDocuments: {
            include: {
              document: {
                select: { id: true, title: true, originalFilename: true, mimeType: true },
              },
            },
          },
          _count: { select: { repairs: true } },
        },
      });

      return mapAssetRow(created);
    });
  }

  async updateForUser(
    assetId: string,
    userId: string,
    input: UpdateAssetInput,
  ): Promise<AssetRecord | null> {
    const existing = await this.prisma.asset.findFirst({ where: { id: assetId, userId } });
    if (!existing) return null;

    const updated = await this.prisma.asset.update({
      where: { id: assetId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.brand !== undefined ? { brand: input.brand } : {}),
        ...(input.model !== undefined ? { model: input.model } : {}),
        ...(input.serialNumber !== undefined ? { serialNumber: input.serialNumber } : {}),
        ...(input.purchaseDate !== undefined
          ? { purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null }
          : {}),
        ...(input.purchasePrice !== undefined ? { purchasePrice: input.purchasePrice } : {}),
        ...(input.currency !== undefined ? { currency: input.currency.toUpperCase() } : {}),
        ...(input.warrantyStartDate !== undefined
          ? {
              warrantyStartDate: input.warrantyStartDate ? new Date(input.warrantyStartDate) : null,
            }
          : {}),
        ...(input.warrantyExpirationDate !== undefined
          ? {
              warrantyExpirationDate: input.warrantyExpirationDate
                ? new Date(input.warrantyExpirationDate)
                : null,
            }
          : {}),
        ...(input.serviceInfo !== undefined ? { serviceInfo: input.serviceInfo } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        version: { increment: 1 },
      },
      include: {
        assetDocuments: {
          include: {
            document: {
              select: { id: true, title: true, originalFilename: true, mimeType: true },
            },
          },
        },
        _count: { select: { repairs: true } },
      },
    });

    return mapAssetRow(updated);
  }

  async linkDocument(
    assetId: string,
    userId: string,
    documentId: string,
    relationType: string,
  ): Promise<AssetRecord | null> {
    const [asset, doc] = await Promise.all([
      this.prisma.asset.findFirst({ where: { id: assetId, userId } }),
      this.prisma.document.findFirst({ where: { id: documentId, userId, deletedAt: null } }),
    ]);

    if (!asset) return null;
    if (!doc) throw new NotFoundError('Document not found');

    await this.prisma.assetDocument.upsert({
      where: { assetId_documentId: { assetId, documentId } },
      create: { assetId, documentId, relationType },
      update: { relationType },
    });

    const refreshed = await this.prisma.asset.findUniqueOrThrow({
      where: { id: assetId },
      include: {
        assetDocuments: {
          include: {
            document: {
              select: { id: true, title: true, originalFilename: true, mimeType: true },
            },
          },
        },
        _count: { select: { repairs: true } },
      },
    });

    return mapAssetRow(refreshed);
  }

  async addRepair(
    assetId: string,
    userId: string,
    input: CreateAssetRepairInput,
  ): Promise<AssetRepairRecord | null> {
    const asset = await this.prisma.asset.findFirst({ where: { id: assetId, userId } });
    if (!asset) return null;

    const repair = await this.prisma.assetRepair.create({
      data: {
        assetId,
        userId,
        repairDate: new Date(input.repairDate),
        providerName: input.providerName ?? null,
        issueSummary: input.issueSummary,
        cost: input.cost ?? null,
        currency: input.currency.toUpperCase(),
        notes: input.notes ?? null,
      },
    });

    return {
      id: repair.id,
      assetId: repair.assetId,
      userId: repair.userId,
      repairDate: repair.repairDate,
      providerName: repair.providerName,
      issueSummary: repair.issueSummary,
      cost: repair.cost ? repair.cost.toString() : null,
      currency: repair.currency,
      notes: repair.notes,
      createdAt: repair.createdAt,
    };
  }

  async deleteForUser(assetId: string, userId: string): Promise<boolean> {
    const existing = await this.prisma.asset.findFirst({ where: { id: assetId, userId } });
    if (!existing) return false;
    await this.prisma.asset.delete({ where: { id: assetId } });
    return true;
  }
}
