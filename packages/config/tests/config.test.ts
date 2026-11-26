import { describe, expect, it } from 'vitest';
import { API_PREFIX, DEFAULT_DOCUMENT_CATEGORIES, UPLOAD_LIMITS } from '../src';

describe('@lifeos/config', () => {
  it('uses /api/v1 prefix and 15MB upload cap', () => {
    expect(API_PREFIX).toBe('/api/v1');
    expect(UPLOAD_LIMITS.maxFileSizeBytes).toBe(15 * 1024 * 1024);
    expect(UPLOAD_LIMITS.allowedMimeTypes).toContain('application/pdf');
  });

  it('includes all 11 default document categories', () => {
    expect(DEFAULT_DOCUMENT_CATEGORIES).toHaveLength(11);
  });
});
