import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { API_PREFIX } from '@lifeos/config';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../shared/errors';
import { validateFileSignature } from './file-signature';
import type {
  IStorageService,
  SignedDownloadRequest,
  SignedDownloadResult,
  SignedUploadRequest,
  SignedUploadResult,
  StoredObjectInfo,
} from './storage.types';

interface SignedStoragePayload {
  action: 'upload' | 'download';
  storageKey: string;
  mimeType: string;
  filename?: string;
  maxSizeBytes?: number;
  exp: number;
}

export class LocalPrivateStorageService implements IStorageService {
  private readonly rootDir: string;

  constructor(
    rootDir: string,
    private readonly signingSecret: string,
    private readonly publicBaseUrl: string,
  ) {
    this.rootDir = path.resolve(rootDir);
  }

  private resolveSafePath(storageKey: string): string {
    const normalized = path.normalize(storageKey).replace(/^(\.\.(\/|\\|$))+/, '');
    const resolved = path.resolve(this.rootDir, normalized);
    if (!resolved.startsWith(this.rootDir)) {
      throw new ForbiddenError('Invalid storage key');
    }
    return resolved;
  }

  private signPayload(payload: SignedStoragePayload): string {
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = createHmac('sha256', this.signingSecret).update(encoded).digest('base64url');
    return `${encoded}.${sig}`;
  }

  verifyToken(token: string, expectedAction: 'upload' | 'download'): SignedStoragePayload {
    const parts = token.split('.');
    if (parts.length !== 2) {
      throw new ForbiddenError('Malformed storage token');
    }
    const [encoded, sig] = parts as [string, string];
    const expectedSig = createHmac('sha256', this.signingSecret)
      .update(encoded)
      .digest('base64url');

    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      throw new ForbiddenError('Invalid storage token signature');
    }

    const parsed = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as SignedStoragePayload;
    if (parsed.action !== expectedAction) {
      throw new ForbiddenError('Storage token action mismatch');
    }
    if (Date.now() > parsed.exp) {
      throw new ForbiddenError('Storage token has expired');
    }
    return parsed;
  }

  async createSignedUploadUrl(params: SignedUploadRequest): Promise<SignedUploadResult> {
    const exp = Date.now() + params.expiresInSeconds * 1000;
    const token = this.signPayload({
      action: 'upload',
      storageKey: params.storageKey,
      mimeType: params.mimeType,
      maxSizeBytes: params.maxSizeBytes,
      exp,
    });

    const base = this.publicBaseUrl.replace(/\/+$/, '');
    return {
      uploadUrl: `${base}${API_PREFIX}/storage/upload?token=${encodeURIComponent(token)}`,
      method: 'PUT',
      headers: {
        'Content-Type': params.mimeType,
      },
      expiresAt: new Date(exp).toISOString(),
    };
  }

  async createSignedDownloadUrl(params: SignedDownloadRequest): Promise<SignedDownloadResult> {
    const exp = Date.now() + params.expiresInSeconds * 1000;
    const token = this.signPayload({
      action: 'download',
      storageKey: params.storageKey,
      mimeType: params.mimeType,
      filename: params.filename,
      exp,
    });

    const base = this.publicBaseUrl.replace(/\/+$/, '');
    return {
      downloadUrl: `${base}${API_PREFIX}/storage/download?token=${encodeURIComponent(token)}`,
      expiresAt: new Date(exp).toISOString(),
    };
  }

  async writeFromSignedUpload(
    token: string,
    body: Buffer,
  ): Promise<{ sizeBytes: number; checksumSha256: string }> {
    const payload = this.verifyToken(token, 'upload');
    if (payload.maxSizeBytes && body.length > payload.maxSizeBytes) {
      throw new BadRequestError('Uploaded file exceeds maximum allowed size');
    }
    if (!validateFileSignature(body, payload.mimeType)) {
      throw new BadRequestError('File binary signature does not match declared MIME type');
    }

    const filePath = this.resolveSafePath(payload.storageKey);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, body);

    const checksumSha256 = createHash('sha256').update(body).digest('hex');
    return {
      sizeBytes: body.length,
      checksumSha256,
    };
  }

  async readFromSignedDownload(
    token: string,
  ): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    const payload = this.verifyToken(token, 'download');
    const filePath = this.resolveSafePath(payload.storageKey);
    try {
      const buffer = await fs.readFile(filePath);
      return {
        buffer,
        mimeType: payload.mimeType,
        filename: payload.filename ?? 'document',
      };
    } catch {
      throw new NotFoundError('Stored document binary not found');
    }
  }

  async headObject(storageKey: string): Promise<StoredObjectInfo> {
    const filePath = this.resolveSafePath(storageKey);
    try {
      const data = await fs.readFile(filePath);
      return {
        exists: true,
        sizeBytes: data.length,
        checksumSha256: createHash('sha256').update(data).digest('hex'),
      };
    } catch {
      return { exists: false };
    }
  }

  async deleteObject(storageKey: string): Promise<void> {
    const filePath = this.resolveSafePath(storageKey);
    await fs.rm(filePath, { force: true });
  }
}
