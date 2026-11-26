export interface SignedUploadRequest {
  storageKey: string;
  mimeType: string;
  maxSizeBytes: number;
  expiresInSeconds: number;
}

export interface SignedUploadResult {
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  expiresAt: string;
}

export interface SignedDownloadRequest {
  storageKey: string;
  filename: string;
  mimeType: string;
  expiresInSeconds: number;
}

export interface SignedDownloadResult {
  downloadUrl: string;
  expiresAt: string;
}

export interface StoredObjectInfo {
  exists: boolean;
  sizeBytes?: number;
  checksumSha256?: string;
}

export interface IStorageService {
  createSignedUploadUrl(params: SignedUploadRequest): Promise<SignedUploadResult>;
  createSignedDownloadUrl(params: SignedDownloadRequest): Promise<SignedDownloadResult>;
  headObject(storageKey: string): Promise<StoredObjectInfo>;
  getObjectBuffer?(storageKey: string): Promise<Buffer | null>;
  deleteObject(storageKey: string): Promise<void>;
}
