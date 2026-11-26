export const API_VERSION = 'v1' as const;
export const API_PREFIX = `/api/${API_VERSION}` as const;

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100,
} as const;

export const UPLOAD_LIMITS = {
  maxFileSizeBytes: 15 * 1024 * 1024, // 15 MB
  signedUrlExpirySeconds: 300, // 5 minutes
  allowedMimeTypes: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
  ] as const,
} as const;

export const DEFAULT_DOCUMENT_CATEGORIES = [
  { slug: 'identity', name: 'Identity', isSystem: true },
  { slug: 'education', name: 'Education', isSystem: true },
  { slug: 'employment', name: 'Employment', isSystem: true },
  { slug: 'financial', name: 'Financial', isSystem: true },
  { slug: 'insurance', name: 'Insurance', isSystem: true },
  { slug: 'medical', name: 'Medical', isSystem: true },
  { slug: 'travel', name: 'Travel', isSystem: true },
  { slug: 'property', name: 'Property', isSystem: true },
  { slug: 'purchase-receipts', name: 'Purchase Receipts', isSystem: true },
  { slug: 'certificates', name: 'Certificates', isSystem: true },
  { slug: 'other', name: 'Other', isSystem: true },
] as const;

export const DEFAULT_ASSET_CATEGORIES = [
  'laptop',
  'smartphone',
  'tablet',
  'headphones',
  'electronics',
  'furniture',
  'appliances',
  'other',
] as const;

export const TOKEN_POLICY = {
  accessTokenTtlMinutes: 15,
  refreshTokenTtlDays: 30,
} as const;
