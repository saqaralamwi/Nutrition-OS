import {
  EntityType,
  SyncAction,
  SyncOperation,
  SyncStats,
  SyncMetadata,
  MAX_RETRY_COUNT,
  SYNC_METADATA_IDS,
} from './types';

const DB_NOT_READY = 'قاعدة البيانات قيد إعادة البناء (Phase 2). المزامنة غير متاحة.';

class SyncQueue {
  async enqueue(
    _entityType: EntityType,
    _entityId: string,
    _action: SyncAction,
    _payload: Record<string, any>
  ): Promise<void> {
    throw new Error(DB_NOT_READY);
  }

  async getPending(_limit = 50): Promise<SyncOperation[]> {
    throw new Error(DB_NOT_READY);
  }

  async getFailed(_limit = 50): Promise<SyncOperation[]> {
    throw new Error(DB_NOT_READY);
  }

  async markSyncing(_id: number): Promise<void> {
    throw new Error(DB_NOT_READY);
  }

  async markSynced(_id: number): Promise<void> {
    throw new Error(DB_NOT_READY);
  }

  async markFailed(_id: number, _error: string): Promise<void> {
    throw new Error(DB_NOT_READY);
  }

  async getStats(): Promise<SyncStats> {
    return { pending: 0, synced: 0, failed: 0, total: 0 };
  }

  async resetFailed(): Promise<number> {
    return 0;
  }

  async cleanup(_daysOld = 7): Promise<number> {
    return 0;
  }

  async getLastSyncedAt(_entityType: EntityType): Promise<string | null> {
    return null;
  }

  async setLastSyncedAt(_entityType: EntityType, _timestamp: string): Promise<void> {
  }
}

export const syncQueue = new SyncQueue();
