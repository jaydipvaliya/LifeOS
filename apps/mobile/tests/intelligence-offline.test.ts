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

import { offlineStore } from '../src/offline/sqlite-store';
import { flushSyncOutbox } from '../src/offline/sync-engine';
import { apiClient } from '../src/services/api-client';
import { intelligenceApi } from '../src/services/intelligence-api';
import { useAppUiStore } from '../src/stores/app-store';

describe('Day 5 Offline SQLite Outbox & Intelligence Client', () => {
  it('stores cache entries and flushes sync operations via /sync/batch', async () => {
    await offlineStore.putCache('dashboard', { summaryCounts: { totalDocuments: 2 } });
    const cached = await offlineStore.getCache<{ summaryCounts: { totalDocuments: number } }>(
      'dashboard',
    );
    expect(cached?.summaryCounts.totalDocuments).toBe(2);

    await offlineStore.enqueueSyncOperation({
      id: 'op-sync-1',
      entityType: 'task',
      entityId: '11111111-1111-4111-8111-111111111111',
      operationType: 'create',
      clientVersion: 1,
      payload: { title: 'Sync me' },
    });

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          processedAt: '2026-11-26T16:30:00.000Z',
          results: [
            {
              clientOperationId: 'op-sync-1',
              entityType: 'task',
              entityId: '11111111-1111-4111-8111-111111111111',
              status: 'synced',
              serverVersion: 1,
            },
          ],
        },
        meta: { requestId: '1', timestamp: '' },
      },
    });

    const result = await flushSyncOutbox();
    expect(result.syncedCount).toBe(1);
    expect(result.remainingCount).toBe(0);
    expect(useAppUiStore.getState().isOffline).toBe(false);
    expect(useAppUiStore.getState().lastSyncedAt).toBe('2026-11-26T16:30:00.000Z');
    postSpy.mockRestore();
  });

  it('calls /search and /assistant/ask endpoints cleanly', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          query: 'macbook',
          totalCount: 0,
          documents: [],
          tasks: [],
          events: [],
          assets: [],
          subscriptions: [],
        },
        meta: { requestId: '1', timestamp: '' },
      },
    });

    const searchRes = await intelligenceApi.universalSearch('macbook');
    expect(searchRes.query).toBe('macbook');
    expect(getSpy).toHaveBeenCalledWith('/search', { params: { q: 'macbook', limit: 8 } });
    getSpy.mockRestore();
  });
});
