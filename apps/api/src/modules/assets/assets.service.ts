import type { AssetDetailDto, AssetDto, AssetRepairDto } from '@lifeos/shared-types';
import type {
  CreateAssetInput,
  CreateAssetRepairInput,
  UpdateAssetInput,
} from '@lifeos/validation';
import { NotFoundError } from '../../shared/errors';
import type {
  AssetDetailRecord,
  AssetRecord,
  AssetRepairRecord,
  IAssetsRepository,
} from './assets.types';

function toAssetDto(record: AssetRecord): AssetDto {
  return {
    id: record.id,
    name: record.name,
    category: record.category,
    brand: record.brand,
    model: record.model,
    serialNumber: record.serialNumber,
    purchaseDate: record.purchaseDate ? record.purchaseDate.toISOString().slice(0, 10) : null,
    purchasePrice: record.purchasePrice,
    currency: record.currency,
    warrantyStartDate: record.warrantyStartDate
      ? record.warrantyStartDate.toISOString().slice(0, 10)
      : null,
    warrantyExpirationDate: record.warrantyExpirationDate
      ? record.warrantyExpirationDate.toISOString().slice(0, 10)
      : null,
    serviceInfo: record.serviceInfo,
    notes: record.notes,
    linkedDocuments: record.linkedDocuments,
    repairsCount: record.repairsCount,
    version: record.version,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toRepairDto(record: AssetRepairRecord): AssetRepairDto {
  return {
    id: record.id,
    assetId: record.assetId,
    repairDate: record.repairDate.toISOString().slice(0, 10),
    providerName: record.providerName,
    issueSummary: record.issueSummary,
    cost: record.cost,
    currency: record.currency,
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
  };
}

function toDetailDto(record: AssetDetailRecord): AssetDetailDto {
  return {
    ...toAssetDto(record),
    repairs: record.repairs.map(toRepairDto),
  };
}

export class AssetsService {
  constructor(private readonly repository: IAssetsRepository) {}

  async list(userId: string, search?: string): Promise<AssetDto[]> {
    const rows = await this.repository.listForUser(userId, search);
    return rows.map(toAssetDto);
  }

  async getDetail(userId: string, assetId: string): Promise<AssetDetailDto> {
    const detail = await this.repository.findOwnedDetailById(assetId, userId);
    if (!detail) throw new NotFoundError('Asset not found');
    return toDetailDto(detail);
  }

  async create(userId: string, input: CreateAssetInput): Promise<AssetDto> {
    const created = await this.repository.createForUser(userId, input);
    return toAssetDto(created);
  }

  async update(userId: string, assetId: string, input: UpdateAssetInput): Promise<AssetDto> {
    const updated = await this.repository.updateForUser(assetId, userId, input);
    if (!updated) throw new NotFoundError('Asset not found');
    return toAssetDto(updated);
  }

  async linkDocument(
    userId: string,
    assetId: string,
    documentId: string,
    relationType: string,
  ): Promise<AssetDto> {
    const updated = await this.repository.linkDocument(assetId, userId, documentId, relationType);
    if (!updated) throw new NotFoundError('Asset not found');
    return toAssetDto(updated);
  }

  async addRepair(
    userId: string,
    assetId: string,
    input: CreateAssetRepairInput,
  ): Promise<AssetRepairDto> {
    const created = await this.repository.addRepair(assetId, userId, input);
    if (!created) throw new NotFoundError('Asset not found');
    return toRepairDto(created);
  }

  async delete(userId: string, assetId: string): Promise<{ deleted: true }> {
    const deleted = await this.repository.deleteForUser(assetId, userId);
    if (!deleted) throw new NotFoundError('Asset not found');
    return { deleted: true };
  }
}
