import { randomUUID } from 'node:crypto';
import path from 'node:path';

const MIME_EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
};

export function getExtensionForMime(mimeType: string): string {
  return MIME_EXTENSIONS[mimeType] ?? 'bin';
}

export function sanitizeOriginalFilename(filename: string): string {
  const base = path
    .basename(filename)
    .replace(/[^\w.\-() ]+/g, '_')
    .trim();
  return base.length > 0 ? base.slice(0, 200) : 'document';
}

export function buildSafeStorageKey(userId: string, documentId: string, mimeType: string): string {
  const ext = getExtensionForMime(mimeType);
  return `users/${userId}/documents/${documentId}/${randomUUID()}.${ext}`;
}

export function validateFileSignature(buffer: Buffer, declaredMime: string): boolean {
  if (buffer.length < 12) {
    return false;
  }

  switch (declaredMime) {
    case 'application/pdf':
      return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
    case 'image/jpeg':
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case 'image/png':
      return (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      );
    case 'image/webp':
      return (
        buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buffer.subarray(8, 12).toString('ascii') === 'WEBP'
      );
    case 'image/heic': {
      const boxType = buffer.subarray(4, 8).toString('ascii');
      const brand = buffer.subarray(8, 12).toString('ascii');
      return boxType === 'ftyp' && ['heic', 'heix', 'mif1', 'msf1', 'hevc'].includes(brand);
    }
    default:
      return false;
  }
}
