import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
  IStorageService,
  SignedDownloadRequest,
  SignedDownloadResult,
  SignedUploadRequest,
  SignedUploadResult,
  StoredObjectInfo,
} from './storage.types';

export interface S3StorageConfig {
  endpoint?: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
}

export class S3StorageService implements IStorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: S3StorageConfig) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async createSignedUploadUrl(params: SignedUploadRequest): Promise<SignedUploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: params.storageKey,
      ContentType: params.mimeType,
      ServerSideEncryption: 'AES256',
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: params.expiresInSeconds,
    });

    return {
      uploadUrl,
      method: 'PUT',
      headers: {
        'Content-Type': params.mimeType,
      },
      expiresAt: new Date(Date.now() + params.expiresInSeconds * 1000).toISOString(),
    };
  }

  async createSignedDownloadUrl(params: SignedDownloadRequest): Promise<SignedDownloadResult> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: params.storageKey,
      ResponseContentType: params.mimeType,
      ResponseContentDisposition: `inline; filename="${params.filename.replace(/"/g, '')}"`,
    });

    const downloadUrl = await getSignedUrl(this.client, command, {
      expiresIn: params.expiresInSeconds,
    });

    return {
      downloadUrl,
      expiresAt: new Date(Date.now() + params.expiresInSeconds * 1000).toISOString(),
    };
  }

  async headObject(storageKey: string): Promise<StoredObjectInfo> {
    try {
      const head = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
        }),
      );
      return {
        exists: true,
        sizeBytes: head.ContentLength,
      };
    } catch {
      return { exists: false };
    }
  }

  async getObjectBuffer(storageKey: string): Promise<Buffer | null> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
        }),
      );
      if (!response.Body) return null;
      const bytes = await response.Body.transformToByteArray();
      return Buffer.from(bytes);
    } catch {
      return null;
    }
  }

  async deleteObject(storageKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
      }),
    );
  }
}
