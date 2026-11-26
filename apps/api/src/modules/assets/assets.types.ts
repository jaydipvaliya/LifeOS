import type { AssetCategory, AssetLinkedDocumentDto } from '@lifeos/shared-types';
import type {
  CreateAssetInput,
  CreateAssetRepairInput,
  UpdateAssetInput,
} from '@lifeos/validation';

export interface AssetRepairRecord {
  id: string;
  assetId: string;
  userId: string;
  repairDate: Date;
  providerName: string | null;
  issueSummary: string;
  cost: string | null;
  currency: string;
  notes: string | null;
  createdAt: Date;
}

export interface AssetRecord {
  id: string;
  userId: string;
  name: string;
  category: AssetCategory;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  purchaseDate: Date | null;
  purchasePrice: string | null;
  currency: string;
  warrantyStartDate: Date | null;
  warrantyExpirationDate: Date | null;
  serviceInfo: string | null;
  notes: string | null;
  linkedDocuments: AssetLinkedDocumentDto[];
  repairsCount: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetDetailRecord extends AssetRecord {
  repairs: AssetRepairRecord[];
}

export interface IAssetsRepository {
  listForUser(userId: string, search?: string): Promise<AssetRecord[]>;
  findOwnedDetailById(assetId: string, userId: string): Promise<AssetDetailRecord | null>;
  createForUser(userId: string, input: CreateAssetInput): Promise<AssetRecord>;
  updateForUser(
    assetId: string,
    userId: string,
    input: UpdateAssetInput,
  ): Promise<AssetRecord | null>;
  linkDocument(
    assetId: string,
    userId: string,
    documentId: string,
    relationType: string,
  ): Promise<AssetRecord | null>;
  addRepair(
    assetId: string,
    userId: string,
    input: CreateAssetRepairInput,
  ): Promise<AssetRepairRecord | null>;
  deleteForUser(assetId: string, userId: string): Promise<boolean>;
}
