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
import { lifeApi } from '../src/services/life-api';

describe('lifeApi client contracts', () => {
  it('lists tasks and subscriptions from v1 endpoints', async () => {
    const getSpy = vi
      .spyOn(apiClient, 'get')
      .mockResolvedValueOnce({
        data: { success: true, data: { tasks: [] }, meta: { requestId: '1', timestamp: '' } },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            subscriptions: [],
            summary: {
              currency: 'INR',
              activeCount: 0,
              cancelledCount: 0,
              monthlyEquivalentTotal: '0.00',
              annualEquivalentTotal: '0.00',
            },
          },
          meta: { requestId: '2', timestamp: '' },
        },
      });

    const tasks = await lifeApi.listTasks();
    const subs = await lifeApi.listSubscriptions();

    expect(tasks).toEqual([]);
    expect(subs.summary.annualEquivalentTotal).toBe('0.00');
    expect(getSpy).toHaveBeenCalledWith('/tasks', expect.any(Object));
    expect(getSpy).toHaveBeenCalledWith('/subscriptions', expect.any(Object));

    getSpy.mockRestore();
  });

  it('queues task create and completion mutations into offline outbox when network is unavailable', async () => {
    const { offlineStore } = await import('../src/offline/sqlite-store');
    const { useAppUiStore } = await import('../src/stores/app-store');

    const networkErr = Object.assign(new Error('Network Error'), { isAxiosError: true });
    const postSpy = vi.spyOn(apiClient, 'post').mockRejectedValue(networkErr);

    const created = await lifeApi.createTask({
      title: 'Offline Electricity Bill',
      priority: 'high',
      isRecurring: false,
    });
    expect(created.title).toBe('Offline Electricity Bill');
    expect(created.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    const completed = await lifeApi.completeTask(created.id);
    expect(completed.status).toBe('completed');

    const pending = await offlineStore.listPendingSyncOperations();
    expect(pending.some((op) => op.entityId === created.id && op.operationType === 'create')).toBe(
      true,
    );
    expect(pending.some((op) => op.entityId === created.id && op.operationType === 'update')).toBe(
      true,
    );
    expect(useAppUiStore.getState().isOffline).toBe(true);
    expect(useAppUiStore.getState().pendingSyncCount).toBeGreaterThanOrEqual(2);

    postSpy.mockRestore();
  });
});
