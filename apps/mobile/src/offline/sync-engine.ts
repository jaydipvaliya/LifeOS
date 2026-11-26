import type { ApiSuccessResponse, SyncBatchResponseDto } from '@lifeos/shared-types';
import { apiClient } from '../services/api-client';
import { useAppUiStore } from '../stores/app-store';
import { offlineStore } from './sqlite-store';

export async function flushSyncOutbox(): Promise<{
  syncedCount: number;
  conflictCount: number;
  remainingCount: number;
}> {
  const store = useAppUiStore.getState();
  const pending = await offlineStore.listPendingSyncOperations();
  if (pending.length === 0) {
    store.setPendingSyncCount(0);
    return { syncedCount: 0, conflictCount: 0, remainingCount: 0 };
  }

  try {
    const res = await apiClient.post<ApiSuccessResponse<SyncBatchResponseDto>>('/sync/batch', {
      operations: pending.map((op) => ({
        clientOperationId: op.id,
        entityType: op.entityType,
        entityId: op.entityId,
        operationType: op.operationType,
        clientVersion: op.clientVersion,
        payload: op.payload,
      })),
    });

    let syncedCount = 0;
    let conflictCount = 0;

    for (const result of res.data.data.results) {
      await offlineStore.updateSyncStatus(result.clientOperationId, result.status);
      if (result.status === 'synced') syncedCount += 1;
      if (result.status === 'conflict') conflictCount += 1;
    }

    const remainingCount = await offlineStore.countPendingSyncOperations();
    store.setOffline(false);
    store.setLastSyncedAt(res.data.data.processedAt);
    store.setPendingSyncCount(remainingCount);

    return { syncedCount, conflictCount, remainingCount };
  } catch {
    store.setOffline(true);
    store.setPendingSyncCount(pending.length);
    return { syncedCount: 0, conflictCount: 0, remainingCount: pending.length };
  }
}
