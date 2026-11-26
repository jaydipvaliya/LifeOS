import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

vi.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  setItemAsync: vi.fn(),
  getItemAsync: vi.fn(async () => null),
  deleteItemAsync: vi.fn(),
}));

import { apiClient } from '../src/services/api-client';
import { vaultApi } from '../src/services/vault-api';

describe('vaultApi client contracts', () => {
  it('calls /dashboard and /categories with expected endpoints', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { success: true, data: { categories: [] }, meta: { requestId: '1', timestamp: '' } },
    });

    const categories = await vaultApi.listCategories();
    expect(categories).toEqual([]);
    expect(getSpy).toHaveBeenCalledWith('/categories');

    getSpy.mockRestore();
  });

  it('calls /documents/upload-init when initiating uploads', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          documentId: 'doc-1',
          storageKey: 'users/u1/documents/doc-1/file.pdf',
          uploadUrl: 'http://127.0.0.1:4000/api/v1/storage/upload?token=abc',
          method: 'PUT',
          headers: { 'Content-Type': 'application/pdf' },
          expiresAt: '2026-11-26T10:00:00.000Z',
        },
        meta: { requestId: '1', timestamp: '' },
      },
    });

    const res = await vaultApi.initiateUpload({
      title: 'Test Invoice',
      categoryId: '11111111-1111-4111-8111-111111111111',
      originalFilename: 'invoice.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 1200,
      tags: ['laptop'],
    });

    expect(res.documentId).toBe('doc-1');
    expect(postSpy).toHaveBeenCalledWith(
      '/documents/upload-init',
      expect.objectContaining({ title: 'Test Invoice' }),
    );
    postSpy.mockRestore();
  });
});
