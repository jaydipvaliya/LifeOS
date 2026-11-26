import type { SyncOperationType, SyncStatus } from '@lifeos/shared-types';

export interface QueuedSyncOperation {
  id: string;
  entityType: 'task' | 'document' | 'asset';
  entityId: string;
  operationType: SyncOperationType;
  clientVersion: number;
  payload: Record<string, unknown>;
  status: SyncStatus;
  createdAt: string;
}

interface SqliteDbLike {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: unknown[]): Promise<unknown>;
  getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...params: unknown[]): Promise<T[]>;
}

const memoryCache = new Map<string, string>();
const memoryOutbox = new Map<string, QueuedSyncOperation>();

let dbPromise: Promise<SqliteDbLike | null> | null = null;

async function getDb(): Promise<SqliteDbLike | null> {
  if (!dbPromise) {
    dbPromise = (async () => {
      try {
        const sqlite = await import('expo-sqlite');
        const db = await sqlite.openDatabaseAsync('lifeos_offline.db');
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS cached_records (
            cache_key TEXT PRIMARY KEY NOT NULL,
            payload_json TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
          CREATE TABLE IF NOT EXISTS sync_operations (
            id TEXT PRIMARY KEY NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            operation_type TEXT NOT NULL,
            client_version INTEGER NOT NULL,
            payload_json TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL
          );
        `);
        return db as unknown as SqliteDbLike;
      } catch {
        // Fallback cleanly to in-memory storage in non-native environments (web/Vitest).
        return null;
      }
    })();
  }
  return dbPromise;
}

export const offlineStore = {
  async putCache<T>(key: string, data: T): Promise<void> {
    const json = JSON.stringify(data);
    memoryCache.set(key, json);
    const db = await getDb();
    if (!db) return;
    await db.runAsync(
      `INSERT OR REPLACE INTO cached_records (cache_key, payload_json, updated_at) VALUES (?, ?, ?)`,
      key,
      json,
      new Date().toISOString(),
    );
  },

  async getCache<T>(key: string): Promise<T | null> {
    const db = await getDb();
    if (db) {
      const row = await db.getFirstAsync<{ payload_json: string }>(
        `SELECT payload_json FROM cached_records WHERE cache_key = ?`,
        key,
      );
      if (row?.payload_json) {
        return JSON.parse(row.payload_json) as T;
      }
    }
    const mem = memoryCache.get(key);
    return mem ? (JSON.parse(mem) as T) : null;
  },

  async enqueueSyncOperation(op: Omit<QueuedSyncOperation, 'status' | 'createdAt'>): Promise<void> {
    const entry: QueuedSyncOperation = {
      ...op,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    memoryOutbox.set(entry.id, entry);
    const db = await getDb();
    if (!db) return;
    await db.runAsync(
      `INSERT OR REPLACE INTO sync_operations
       (id, entity_type, entity_id, operation_type, client_version, payload_json, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      entry.id,
      entry.entityType,
      entry.entityId,
      entry.operationType,
      entry.clientVersion,
      JSON.stringify(entry.payload),
      entry.status,
      entry.createdAt,
    );
  },

  async listPendingSyncOperations(): Promise<QueuedSyncOperation[]> {
    const db = await getDb();
    if (db) {
      const rows = await db.getAllAsync<{
        id: string;
        entity_type: 'task' | 'document' | 'asset';
        entity_id: string;
        operation_type: SyncOperationType;
        client_version: number;
        payload_json: string;
        status: SyncStatus;
        created_at: string;
      }>(
        `SELECT * FROM sync_operations WHERE status IN ('pending', 'failed') ORDER BY created_at ASC`,
      );
      return rows.map((r) => ({
        id: r.id,
        entityType: r.entity_type,
        entityId: r.entity_id,
        operationType: r.operation_type,
        clientVersion: r.client_version,
        payload: JSON.parse(r.payload_json) as Record<string, unknown>,
        status: r.status,
        createdAt: r.created_at,
      }));
    }
    return Array.from(memoryOutbox.values()).filter(
      (o) => o.status === 'pending' || o.status === 'failed',
    );
  },

  async updateSyncStatus(id: string, status: SyncStatus): Promise<void> {
    const existing = memoryOutbox.get(id);
    if (existing) {
      memoryOutbox.set(id, { ...existing, status });
    }
    const db = await getDb();
    if (!db) return;
    await db.runAsync(`UPDATE sync_operations SET status = ? WHERE id = ?`, status, id);
  },

  async countPendingSyncOperations(): Promise<number> {
    const pending = await this.listPendingSyncOperations();
    return pending.length;
  },
};
