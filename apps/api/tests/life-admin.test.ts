import { randomUUID } from 'node:crypto';
import type { SubscriptionStatus } from '@lifeos/shared-types';
import type {
  CreateAssetInput,
  CreateAssetRepairInput,
  CreateEventInput,
  CreateReminderInput,
  CreateSubscriptionInput,
  CreateTaskInput,
  EventListQuery,
  TaskListQuery,
  UpdateAssetInput,
  UpdateEventInput,
  UpdateNotificationPreferenceInput,
  UpdateSubscriptionInput,
  UpdateTaskInput,
} from '@lifeos/validation';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import type {
  AssetDetailRecord,
  AssetRecord,
  AssetRepairRecord,
  IAssetsRepository,
} from '../src/modules/assets/assets.types';
import { TokenService } from '../src/modules/auth/token.service';
import type { EventRecord, IEventsRepository } from '../src/modules/events/events.types';
import type {
  INotificationsRepository,
  NotificationPreferenceRecord,
  NotificationRecord,
} from '../src/modules/notifications/notifications.types';
import type { IReminderQueue } from '../src/modules/reminders/reminder-queue';
import type {
  IRemindersRepository,
  ReminderRecord,
} from '../src/modules/reminders/reminders.types';
import type {
  ISubscriptionsRepository,
  SubscriptionRecord,
} from '../src/modules/subscriptions/subscriptions.types';
import type { ITasksRepository, TaskRecord } from '../src/modules/tasks/tasks.types';

class InMemoryLifeAdminStore
  implements
    ITasksRepository,
    IEventsRepository,
    IRemindersRepository,
    IAssetsRepository,
    ISubscriptionsRepository,
    INotificationsRepository,
    IReminderQueue
{
  public tasks = new Map<string, TaskRecord>();
  public events = new Map<string, EventRecord>();
  public reminders = new Map<string, ReminderRecord>();
  public assets = new Map<string, AssetDetailRecord>();
  public subscriptions = new Map<string, SubscriptionRecord>();
  public notifications = new Map<string, NotificationRecord>();
  public preferences = new Map<string, NotificationPreferenceRecord>();
  public queuedJobs = new Set<string>();

  async scheduleReminder(payload: { reminderId: string }) {
    const jobId = `job-${payload.reminderId}-${Date.now()}`;
    this.queuedJobs.add(jobId);
    return jobId;
  }

  async cancelReminder(jobId: string) {
    this.queuedJobs.delete(jobId);
  }

  async listForUser(
    userId: string,
    query: TaskListQuery,
  ): Promise<{ items: TaskRecord[]; total: number }>;
  async listForUser(
    userId: string,
    query: EventListQuery,
  ): Promise<{ items: EventRecord[]; total: number }>;
  async listForUser(userId: string): Promise<ReminderRecord[]>;
  async listForUser(userId: string, search?: string): Promise<AssetRecord[]>;
  async listForUser(userId: string, status?: SubscriptionStatus): Promise<SubscriptionRecord[]>;
  async listForUser(userId: string, arg?: unknown): Promise<unknown> {
    if (arg && typeof arg === 'object' && 'sortBy' in arg) {
      const q = arg as TaskListQuery;
      const items = Array.from(this.tasks.values()).filter(
        (t) =>
          t.userId === userId &&
          (!q.status || t.status === q.status) &&
          (!q.overdueOnly ||
            (t.dueAt !== null && t.dueAt.getTime() < Date.now() && t.status !== 'completed')),
      );
      return { items, total: items.length };
    }
    if (
      arg &&
      typeof arg === 'object' &&
      ('from' in arg || 'includeCompleted' in arg || 'page' in arg)
    ) {
      const items = Array.from(this.events.values()).filter((e) => e.userId === userId);
      return { items, total: items.length };
    }
    throw new Error('Unexpected overloaded listForUser call');
  }

  // Dedicated methods via thin wrappers on test instance
  async listTasks(userId: string, q: TaskListQuery) {
    const items = Array.from(this.tasks.values()).filter(
      (t) => t.userId === userId && (!q.status || t.status === q.status),
    );
    return { items, total: items.length };
  }

  async findOwnedById(_id: string, _userId: string): Promise<never> {
    throw new Error('Use specialized repo wrappers');
  }

  async createForUser(_userId: string, _input: unknown): Promise<never> {
    throw new Error('Use specialized repo wrappers');
  }

  async updateForUser(_id: string, _userId: string, _input: unknown): Promise<never> {
    throw new Error('Use specialized repo wrappers');
  }

  async completeForUser(_id: string, _userId: string): Promise<never> {
    throw new Error('Use specialized repo wrappers');
  }

  async snoozeForUser(_id: string, _userId: string, _d: Date): Promise<never> {
    throw new Error('Use specialized repo wrappers');
  }

  async deleteForUser(_id: string, _userId: string): Promise<never> {
    throw new Error('Use specialized repo wrappers');
  }

  async findOwnedDetailById(assetId: string, userId: string): Promise<AssetDetailRecord | null> {
    const asset = this.assets.get(assetId);
    return asset && asset.userId === userId ? asset : null;
  }

  async linkDocument(assetId: string, userId: string, documentId: string, relationType: string) {
    const asset = this.assets.get(assetId);
    if (!asset || asset.userId !== userId) return null;
    asset.linkedDocuments.push({
      documentId,
      title: 'Linked Invoice',
      originalFilename: 'invoice.pdf',
      mimeType: 'application/pdf',
      relationType,
    });
    return asset;
  }

  async addRepair(
    assetId: string,
    userId: string,
    input: CreateAssetRepairInput,
  ): Promise<AssetRepairRecord | null> {
    const asset = this.assets.get(assetId);
    if (!asset || asset.userId !== userId) return null;
    const repair: AssetRepairRecord = {
      id: randomUUID(),
      assetId,
      userId,
      repairDate: new Date(input.repairDate),
      providerName: input.providerName ?? null,
      issueSummary: input.issueSummary,
      cost: input.cost !== undefined && input.cost !== null ? String(input.cost) : null,
      currency: input.currency,
      notes: input.notes ?? null,
      createdAt: new Date(),
    };
    asset.repairs.push(repair);
    asset.repairsCount = asset.repairs.length;
    return repair;
  }

  async cancelForUser(subscriptionId: string, userId: string) {
    const sub = this.subscriptions.get(subscriptionId);
    if (!sub || sub.userId !== userId) return null;
    sub.status = 'cancelled';
    sub.cancelledAt = new Date();
    return sub;
  }

  async attachJobId(reminderId: string, jobId: string): Promise<ReminderRecord> {
    const r = this.reminders.get(reminderId)!;
    r.jobId = jobId;
    return r;
  }

  async markAsRead(notificationId: string, userId: string): Promise<NotificationRecord | null> {
    const n = this.notifications.get(notificationId);
    if (!n || n.userId !== userId) return null;
    n.readAt = new Date();
    return n;
  }

  async snoozeNotification(notificationId: string, userId: string, snoozedUntil: Date) {
    const n = this.notifications.get(notificationId);
    if (!n || n.userId !== userId) return null;
    n.snoozedUntil = snoozedUntil;
    return n;
  }

  async getPreferences(userId: string): Promise<NotificationPreferenceRecord> {
    if (!this.preferences.has(userId)) {
      this.preferences.set(userId, {
        userId,
        pushEnabled: true,
        emailEnabled: true,
        documentExpiryDaysBefore: 30,
        warrantyExpiryDaysBefore: 14,
        subscriptionRenewalDaysBefore: 3,
        quietHoursStart: null,
        quietHoursEnd: null,
        privacyHideSensitiveContent: true,
      });
    }
    return this.preferences.get(userId)!;
  }

  async updatePreferences(userId: string, input: UpdateNotificationPreferenceInput) {
    const current = await this.getPreferences(userId);
    const updated = { ...current, ...input };
    this.preferences.set(userId, updated);
    return updated;
  }
}

function createRepositories(store: InMemoryLifeAdminStore) {
  const tasksRepo: ITasksRepository = {
    listForUser: (u, q) => store.listTasks(u, q),
    findOwnedById: async (id, u) => {
      const t = store.tasks.get(id);
      return t && t.userId === u ? t : null;
    },
    createForUser: async (u, input: CreateTaskInput) => {
      const now = new Date();
      const t: TaskRecord = {
        id: randomUUID(),
        userId: u,
        title: input.title,
        notes: input.notes ?? null,
        priority: input.priority,
        status: 'pending',
        category: input.category ?? null,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
        snoozedUntil: null,
        completedAt: null,
        isRecurring: input.isRecurring,
        recurrenceRule: input.recurrenceRule ?? null,
        sourceDocumentId: input.sourceDocumentId ?? null,
        sourceDocumentTitle: null,
        linkedEventId: input.linkedEventId ?? null,
        linkedEventTitle: null,
        version: 1,
        createdAt: now,
        updatedAt: now,
      };
      store.tasks.set(t.id, t);
      return t;
    },
    updateForUser: async (id, u, input: UpdateTaskInput) => {
      const t = store.tasks.get(id);
      if (!t || t.userId !== u) return null;
      if (input.title !== undefined) t.title = input.title;
      if (input.priority !== undefined) t.priority = input.priority;
      t.version += 1;
      return t;
    },
    completeForUser: async (id, u) => {
      const t = store.tasks.get(id);
      if (!t || t.userId !== u) return null;
      t.status = 'completed';
      t.completedAt = new Date();
      return t;
    },
    snoozeForUser: async (id, u, until) => {
      const t = store.tasks.get(id);
      if (!t || t.userId !== u) return null;
      t.status = 'snoozed';
      t.snoozedUntil = until;
      t.dueAt = until;
      return t;
    },
    deleteForUser: async (id, u) => {
      const t = store.tasks.get(id);
      if (!t || t.userId !== u) return false;
      return store.tasks.delete(id);
    },
  };

  const eventsRepo: IEventsRepository = {
    listForUser: async (u) => {
      const items = Array.from(store.events.values()).filter((e) => e.userId === u);
      return { items, total: items.length };
    },
    createForUser: async (u, input: CreateEventInput) => {
      const now = new Date();
      const e: EventRecord = {
        id: randomUUID(),
        userId: u,
        title: input.title,
        description: input.description ?? null,
        category: input.category,
        startAt: new Date(input.startAt),
        endAt: input.endAt ? new Date(input.endAt) : null,
        allDay: input.allDay,
        timezone: input.timezone,
        isRecurring: input.isRecurring,
        recurrenceRule: input.recurrenceRule ?? null,
        sourceDocumentId: input.sourceDocumentId ?? null,
        sourceAssetId: input.sourceAssetId ?? null,
        sourceSubscriptionId: input.sourceSubscriptionId ?? null,
        completedAt: null,
        version: 1,
        createdAt: now,
        updatedAt: now,
      };
      store.events.set(e.id, e);
      return e;
    },
    updateForUser: async (id, u, input: UpdateEventInput) => {
      const e = store.events.get(id);
      if (!e || e.userId !== u) return null;
      if (input.title !== undefined) e.title = input.title;
      return e;
    },
    completeForUser: async (id, u) => {
      const e = store.events.get(id);
      if (!e || e.userId !== u) return null;
      e.completedAt = new Date();
      return e;
    },
    deleteForUser: async (id, u) => {
      const e = store.events.get(id);
      if (!e || e.userId !== u) return false;
      return store.events.delete(id);
    },
  };

  const remindersRepo: IRemindersRepository = {
    listForUser: async (u) => Array.from(store.reminders.values()).filter((r) => r.userId === u),
    findOwnedById: async (id, u) => {
      const r = store.reminders.get(id);
      return r && r.userId === u ? r : null;
    },
    createForUser: async (u, input: CreateReminderInput) => {
      const r: ReminderRecord = {
        id: randomUUID(),
        userId: u,
        eventId: input.eventId ?? null,
        taskId: input.taskId ?? null,
        documentId: input.documentId ?? null,
        title: input.title,
        remindAt: new Date(input.remindAt),
        channel: input.channel,
        status: 'scheduled',
        sentAt: null,
        snoozedUntil: null,
        jobId: null,
        createdAt: new Date(),
      };
      store.reminders.set(r.id, r);
      return r;
    },
    attachJobId: (id, jobId) => store.attachJobId(id, jobId),
    snoozeForUser: async (id, u, until, jobId) => {
      const r = store.reminders.get(id);
      if (!r || r.userId !== u) return null;
      r.status = 'snoozed';
      r.snoozedUntil = until;
      r.remindAt = until;
      r.jobId = jobId;
      return r;
    },
    deleteForUser: async (id, u) => {
      const r = store.reminders.get(id);
      if (!r || r.userId !== u) return null;
      store.reminders.delete(id);
      return r;
    },
  };

  const assetsRepo: IAssetsRepository = {
    listForUser: async (u) => Array.from(store.assets.values()).filter((a) => a.userId === u),
    findOwnedDetailById: (id, u) => store.findOwnedDetailById(id, u),
    createForUser: async (u, input: CreateAssetInput) => {
      const now = new Date();
      const a: AssetDetailRecord = {
        id: randomUUID(),
        userId: u,
        name: input.name,
        category: input.category,
        brand: input.brand ?? null,
        model: input.model ?? null,
        serialNumber: input.serialNumber ?? null,
        purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
        purchasePrice:
          input.purchasePrice !== undefined && input.purchasePrice !== null
            ? String(input.purchasePrice)
            : null,
        currency: input.currency,
        warrantyStartDate: input.warrantyStartDate ? new Date(input.warrantyStartDate) : null,
        warrantyExpirationDate: input.warrantyExpirationDate
          ? new Date(input.warrantyExpirationDate)
          : null,
        serviceInfo: input.serviceInfo ?? null,
        notes: input.notes ?? null,
        linkedDocuments: [],
        repairsCount: 0,
        repairs: [],
        version: 1,
        createdAt: now,
        updatedAt: now,
      };
      store.assets.set(a.id, a);
      return a;
    },
    updateForUser: async (id, u, input: UpdateAssetInput) => {
      const a = store.assets.get(id);
      if (!a || a.userId !== u) return null;
      if (input.name !== undefined) a.name = input.name;
      return a;
    },
    linkDocument: (id, u, docId, rel) => store.linkDocument(id, u, docId, rel),
    addRepair: (id, u, input) => store.addRepair(id, u, input),
    deleteForUser: async (id, u) => {
      const a = store.assets.get(id);
      if (!a || a.userId !== u) return false;
      return store.assets.delete(id);
    },
  };

  const subscriptionsRepo: ISubscriptionsRepository = {
    listForUser: async (u) =>
      Array.from(store.subscriptions.values()).filter((s) => s.userId === u),
    createForUser: async (u, input: CreateSubscriptionInput) => {
      const now = new Date();
      const s: SubscriptionRecord = {
        id: randomUUID(),
        userId: u,
        name: input.name,
        provider: input.provider,
        amount: String(input.amount),
        currency: input.currency,
        frequency: input.frequency,
        startDate: new Date(input.startDate),
        nextRenewalDate: new Date(input.nextRenewalDate),
        paymentMethodLabel: input.paymentMethodLabel ?? null,
        cancellationInfo: input.cancellationInfo ?? null,
        status: 'active',
        cancelledAt: null,
        version: 1,
        createdAt: now,
        updatedAt: now,
      };
      store.subscriptions.set(s.id, s);
      return s;
    },
    updateForUser: async (id, u, input: UpdateSubscriptionInput) => {
      const s = store.subscriptions.get(id);
      if (!s || s.userId !== u) return null;
      if (input.name !== undefined) s.name = input.name;
      return s;
    },
    cancelForUser: (id, u) => store.cancelForUser(id, u),
    deleteForUser: async (id, u) => {
      const s = store.subscriptions.get(id);
      if (!s || s.userId !== u) return false;
      return store.subscriptions.delete(id);
    },
  };

  const notificationsRepo: INotificationsRepository = {
    listForUser: async (u) =>
      Array.from(store.notifications.values()).filter((n) => n.userId === u),
    markAsRead: (id, u) => store.markAsRead(id, u),
    snoozeNotification: (id, u, until) => store.snoozeNotification(id, u, until),
    getPreferences: (u) => store.getPreferences(u),
    updatePreferences: (u, input) => store.updatePreferences(u, input),
  };

  return {
    tasksRepo,
    eventsRepo,
    remindersRepo,
    assetsRepo,
    subscriptionsRepo,
    notificationsRepo,
  };
}

describe('Day 4 Life Administration Modules', () => {
  const tokenService = new TokenService();
  const userId = randomUUID();
  const otherUserId = randomUUID();
  const token = tokenService.signAccessToken({
    userId,
    email: 'life@lifeos.app',
    deviceId: null,
  }).accessToken;
  const otherToken = tokenService.signAccessToken({
    userId: otherUserId,
    email: 'other@lifeos.app',
    deviceId: null,
  }).accessToken;

  it('manages tasks, events, and BullMQ-queued reminders with ownership checks', async () => {
    const store = new InMemoryLifeAdminStore();
    const repos = createRepositories(store);
    const app = createApp({
      tasksRepository: repos.tasksRepo,
      eventsRepository: repos.eventsRepo,
      remindersRepository: repos.remindersRepo,
      reminderQueue: store,
      tokenService,
    });

    const eventRes = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'MacBook Warranty Check',
        category: 'warranty_expiry',
        startAt: '2026-12-10T10:00:00.000Z',
        timezone: 'Asia/Kolkata',
      });
    expect(eventRes.status).toBe(201);
    const eventId = eventRes.body.data.event.id;

    const taskRes = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Submit AppleCare invoice',
        priority: 'high',
        dueAt: '2026-12-01T10:00:00.000Z',
        linkedEventId: eventId,
      });
    expect(taskRes.status).toBe(201);
    const taskId = taskRes.body.data.task.id;

    const otherComplete = await request(app)
      .post(`/api/v1/tasks/${taskId}/complete`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(otherComplete.status).toBe(404);

    const completeRes = await request(app)
      .post(`/api/v1/tasks/${taskId}/complete`)
      .set('Authorization', `Bearer ${token}`);
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.task.status).toBe('completed');

    const reminderRes = await request(app)
      .post('/api/v1/reminders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Renew laptop coverage',
        remindAt: '2026-12-08T09:00:00.000Z',
        eventId,
      });
    expect(reminderRes.status).toBe(201);
    expect(store.queuedJobs.size).toBe(1);

    const snoozeRes = await request(app)
      .post(`/api/v1/reminders/${reminderRes.body.data.reminder.id}/snooze`)
      .set('Authorization', `Bearer ${token}`)
      .send({ snoozedUntil: '2026-12-09T09:00:00.000Z' });
    expect(snoozeRes.status).toBe(200);
    expect(snoozeRes.body.data.reminder.status).toBe('snoozed');
  });

  it('manages assets, repairs, subscriptions spend summaries, and notification preferences', async () => {
    const store = new InMemoryLifeAdminStore();
    const repos = createRepositories(store);
    const app = createApp({
      assetsRepository: repos.assetsRepo,
      subscriptionsRepository: repos.subscriptionsRepo,
      notificationsRepository: repos.notificationsRepo,
      tokenService,
    });

    const assetRes = await request(app)
      .post('/api/v1/assets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'MacBook Air M3',
        category: 'laptop',
        brand: 'Apple',
        purchasePrice: 114900,
        warrantyExpirationDate: '2027-10-15',
      });
    expect(assetRes.status).toBe(201);
    const assetId = assetRes.body.data.asset.id;

    const repairRes = await request(app)
      .post(`/api/v1/assets/${assetId}/repairs`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        repairDate: '2026-11-20',
        providerName: 'Apple Authorized Service',
        issueSummary: 'Keyboard keycap replacement',
        cost: 0,
      });
    expect(repairRes.status).toBe(201);

    const detailRes = await request(app)
      .get(`/api/v1/assets/${assetId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.asset.repairs).toHaveLength(1);

    await request(app).post('/api/v1/subscriptions').set('Authorization', `Bearer ${token}`).send({
      name: 'iCloud+',
      provider: 'Apple',
      amount: 219,
      frequency: 'monthly',
      startDate: '2026-01-01',
      nextRenewalDate: '2026-12-01',
    });

    const annualSub = await request(app)
      .post('/api/v1/subscriptions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'GitHub Pro',
        provider: 'GitHub',
        amount: 3600,
        frequency: 'annual',
        startDate: '2026-01-01',
        nextRenewalDate: '2027-01-01',
      });

    const subsList = await request(app)
      .get('/api/v1/subscriptions')
      .set('Authorization', `Bearer ${token}`);
    expect(subsList.status).toBe(200);
    // 219 * 12 + 3600 = 6228.00 annual -> 519.00 monthly
    expect(subsList.body.data.summary.annualEquivalentTotal).toBe('6228.00');
    expect(subsList.body.data.summary.monthlyEquivalentTotal).toBe('519.00');

    const cancelRes = await request(app)
      .post(`/api/v1/subscriptions/${annualSub.body.data.subscription.id}/cancel`)
      .set('Authorization', `Bearer ${token}`);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.subscription.status).toBe('cancelled');

    const prefRes = await request(app)
      .patch('/api/v1/notifications/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ documentExpiryDaysBefore: 45, privacyHideSensitiveContent: true });
    expect(prefRes.status).toBe(200);
    expect(prefRes.body.data.preferences.documentExpiryDaysBefore).toBe(45);
  });
});
