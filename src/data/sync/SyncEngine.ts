import { networkMonitor } from './NetworkMonitor';
import { SyncResult } from './types';

const DB_NOT_READY = 'قاعدة البيانات قيد إعادة البناء (Phase 2). المزامنة غير متاحة.';

class SyncEngine {
  private _isSyncing = false;

  get isSyncing(): boolean {
    return this._isSyncing;
  }

  async fullSync(): Promise<SyncResult> {
    return { pushed: 0, pushedErrors: 0, pulled: 0, pulledErrors: 0 };
  }
}

export const syncEngine = new SyncEngine();
