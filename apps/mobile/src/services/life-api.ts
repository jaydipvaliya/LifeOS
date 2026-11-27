import type {
  ApiSuccessResponse,
  AssetDetailDto,
  AssetDto,
  AssetRepairDto,
  EventDto,
  NotificationDto,
  NotificationPreferenceDto,
  ReminderDto,
  SubscriptionDto,
  SubscriptionSpendingSummary,
  SubscriptionStatus,
  TaskDto,
} from '@lifeos/shared-types';
import type {
  CreateAssetInput,
  CreateAssetRepairInput,
  CreateEventInput,
  CreateReminderInput,
  CreateSubscriptionInput,
  CreateTaskInput,
  UpdateNotificationPreferenceInput,
} from '@lifeos/validation';
import axios from 'axios';
import { offlineStore } from '../offline/sqlite-store';
import { useAppUiStore } from '../stores/app-store';
import { apiClient } from './api-client';

function isNetworkFailure(err: unknown): boolean {
  return axios.isAxiosError(err) && !err.response;
}

async function enqueueOfflineTaskMutation(params: {
  operationId: string;
  taskId: string;
  operationType: 'create' | 'update';
  payload: Record<string, unknown>;
}): Promise<void> {
  await offlineStore.enqueueSyncOperation({
    id: params.operationId,
    entityType: 'task',
    entityId: params.taskId,
    operationType: params.operationType,
    clientVersion: 1,
    payload: params.payload,
  });
  const pendingCount = await offlineStore.countPendingSyncOperations();
  const uiStore = useAppUiStore.getState();
  uiStore.setOffline(true);
  uiStore.setPendingSyncCount(pendingCount);
}

function createClientUuid(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const r = Math.floor(Math.random() * 16);
    const v = char === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const lifeApi = {
  // Tasks
  async listTasks(params?: {
    status?: string;
    overdueOnly?: boolean;
    search?: string;
  }): Promise<TaskDto[]> {
    const cacheKey = `tasks:${JSON.stringify(params ?? {})}`;
    try {
      const res = await apiClient.get<ApiSuccessResponse<{ tasks: TaskDto[] }>>('/tasks', {
        params: {
          ...params,
          overdueOnly: params?.overdueOnly !== undefined ? String(params.overdueOnly) : undefined,
          limit: 50,
        },
      });
      useAppUiStore.getState().setOffline(false);
      await offlineStore.putCache(cacheKey, res.data.data.tasks);
      return res.data.data.tasks;
    } catch (err) {
      const cached = await offlineStore.getCache<TaskDto[]>(cacheKey);
      if (cached) {
        useAppUiStore.getState().setOffline(true);
        return cached;
      }
      throw err;
    }
  },

  async createTask(input: CreateTaskInput): Promise<TaskDto> {
    try {
      const res = await apiClient.post<ApiSuccessResponse<{ task: TaskDto }>>('/tasks', input);
      useAppUiStore.getState().setOffline(false);
      return res.data.data.task;
    } catch (err) {
      if (!isNetworkFailure(err)) {
        throw err;
      }

      const now = new Date().toISOString();
      const taskId = createClientUuid();
      await enqueueOfflineTaskMutation({
        operationId: `op-${taskId}`,
        taskId,
        operationType: 'create',
        payload: {
          title: input.title,
          priority: input.priority ?? 'medium',
          ...(input.dueAt ? { dueAt: input.dueAt } : {}),
        },
      });

      return {
        id: taskId,
        title: input.title,
        notes: input.notes ?? null,
        priority: input.priority ?? 'medium',
        status: 'pending',
        category: input.category ?? null,
        dueAt: input.dueAt ?? null,
        snoozedUntil: null,
        completedAt: null,
        isRecurring: input.isRecurring ?? false,
        recurrenceRule: input.recurrenceRule ?? null,
        sourceDocumentId: input.sourceDocumentId ?? null,
        sourceDocumentTitle: null,
        linkedEventId: input.linkedEventId ?? null,
        linkedEventTitle: null,
        isOverdue: false,
        version: 1,
        createdAt: now,
        updatedAt: now,
      };
    }
  },

  async completeTask(id: string): Promise<TaskDto> {
    try {
      const res = await apiClient.post<ApiSuccessResponse<{ task: TaskDto }>>(
        `/tasks/${id}/complete`,
      );
      useAppUiStore.getState().setOffline(false);
      return res.data.data.task;
    } catch (err) {
      if (!isNetworkFailure(err)) {
        throw err;
      }

      const now = new Date().toISOString();
      await enqueueOfflineTaskMutation({
        operationId: `op-complete-${id}-${Date.now()}`,
        taskId: id,
        operationType: 'update',
        payload: { status: 'completed' },
      });

      return {
        id,
        title: 'Synced Task',
        notes: null,
        priority: 'medium',
        status: 'completed',
        category: null,
        dueAt: null,
        snoozedUntil: null,
        completedAt: now,
        isRecurring: false,
        recurrenceRule: null,
        sourceDocumentId: null,
        sourceDocumentTitle: null,
        linkedEventId: null,
        linkedEventTitle: null,
        isOverdue: false,
        version: 2,
        createdAt: now,
        updatedAt: now,
      };
    }
  },

  async snoozeTask(id: string, snoozedUntil: string): Promise<TaskDto> {
    const res = await apiClient.post<ApiSuccessResponse<{ task: TaskDto }>>(`/tasks/${id}/snooze`, {
      snoozedUntil,
    });
    return res.data.data.task;
  },

  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  },

  // Events
  async listEvents(params?: { search?: string }): Promise<EventDto[]> {
    const res = await apiClient.get<ApiSuccessResponse<{ events: EventDto[] }>>('/events', {
      params: { ...params, limit: 100 },
    });
    return res.data.data.events;
  },

  async createEvent(input: CreateEventInput): Promise<EventDto> {
    const res = await apiClient.post<ApiSuccessResponse<{ event: EventDto }>>('/events', input);
    return res.data.data.event;
  },

  async completeEvent(id: string): Promise<EventDto> {
    const res = await apiClient.post<ApiSuccessResponse<{ event: EventDto }>>(
      `/events/${id}/complete`,
    );
    return res.data.data.event;
  },

  async deleteEvent(id: string): Promise<void> {
    await apiClient.delete(`/events/${id}`);
  },

  // Reminders
  async listReminders(): Promise<ReminderDto[]> {
    const res = await apiClient.get<ApiSuccessResponse<{ reminders: ReminderDto[] }>>('/reminders');
    return res.data.data.reminders;
  },

  async createReminder(input: CreateReminderInput): Promise<ReminderDto> {
    const res = await apiClient.post<ApiSuccessResponse<{ reminder: ReminderDto }>>(
      '/reminders',
      input,
    );
    return res.data.data.reminder;
  },

  // Assets
  async listAssets(search?: string): Promise<AssetDto[]> {
    const res = await apiClient.get<ApiSuccessResponse<{ assets: AssetDto[] }>>('/assets', {
      params: search ? { search } : undefined,
    });
    return res.data.data.assets;
  },

  async getAssetDetail(id: string): Promise<AssetDetailDto> {
    const res = await apiClient.get<ApiSuccessResponse<{ asset: AssetDetailDto }>>(`/assets/${id}`);
    return res.data.data.asset;
  },

  async createAsset(input: CreateAssetInput): Promise<AssetDto> {
    const res = await apiClient.post<ApiSuccessResponse<{ asset: AssetDto }>>('/assets', input);
    return res.data.data.asset;
  },

  async linkAssetDocument(assetId: string, documentId: string): Promise<AssetDto> {
    const res = await apiClient.post<ApiSuccessResponse<{ asset: AssetDto }>>(
      `/assets/${assetId}/documents`,
      { documentId, relationType: 'invoice' },
    );
    return res.data.data.asset;
  },

  async addAssetRepair(assetId: string, input: CreateAssetRepairInput): Promise<AssetRepairDto> {
    const res = await apiClient.post<ApiSuccessResponse<{ repair: AssetRepairDto }>>(
      `/assets/${assetId}/repairs`,
      input,
    );
    return res.data.data.repair;
  },

  // Subscriptions
  async listSubscriptions(status?: SubscriptionStatus): Promise<{
    subscriptions: SubscriptionDto[];
    summary: SubscriptionSpendingSummary;
  }> {
    const res = await apiClient.get<
      ApiSuccessResponse<{
        subscriptions: SubscriptionDto[];
        summary: SubscriptionSpendingSummary;
      }>
    >('/subscriptions', { params: status ? { status } : undefined });
    return res.data.data;
  },

  async createSubscription(input: CreateSubscriptionInput): Promise<SubscriptionDto> {
    const res = await apiClient.post<ApiSuccessResponse<{ subscription: SubscriptionDto }>>(
      '/subscriptions',
      input,
    );
    return res.data.data.subscription;
  },

  async cancelSubscription(id: string): Promise<SubscriptionDto> {
    const res = await apiClient.post<ApiSuccessResponse<{ subscription: SubscriptionDto }>>(
      `/subscriptions/${id}/cancel`,
    );
    return res.data.data.subscription;
  },

  // Notifications
  async listNotifications(): Promise<NotificationDto[]> {
    const res =
      await apiClient.get<ApiSuccessResponse<{ notifications: NotificationDto[] }>>(
        '/notifications',
      );
    return res.data.data.notifications;
  },

  async markNotificationRead(id: string): Promise<NotificationDto> {
    const res = await apiClient.post<ApiSuccessResponse<{ notification: NotificationDto }>>(
      `/notifications/${id}/read`,
    );
    return res.data.data.notification;
  },

  async getNotificationPreferences(): Promise<NotificationPreferenceDto> {
    const res = await apiClient.get<ApiSuccessResponse<{ preferences: NotificationPreferenceDto }>>(
      '/notifications/preferences',
    );
    return res.data.data.preferences;
  },

  async updateNotificationPreferences(
    input: UpdateNotificationPreferenceInput,
  ): Promise<NotificationPreferenceDto> {
    const res = await apiClient.patch<
      ApiSuccessResponse<{ preferences: NotificationPreferenceDto }>
    >('/notifications/preferences', input);
    return res.data.data.preferences;
  },
};
