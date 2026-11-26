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
});
