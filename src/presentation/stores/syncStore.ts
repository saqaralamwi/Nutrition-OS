import { create } from 'zustand';
import { SyncStats } from '../../data/sync/types';

interface SyncState {
  isSyncing: boolean;
  lastSyncAt: string | null;
  syncError: string | null;
  stats: SyncStats;

  setSyncing: (syncing: boolean) => void;
  setLastSyncAt: (timestamp: string) => void;
  setSyncError: (error: string | null) => void;
  updateStats: (stats: SyncStats) => void;
}

export const syncStore = create<SyncState>((set) => ({
  isSyncing: false,
  lastSyncAt: null,
  syncError: null,
  stats: { pending: 0, synced: 0, failed: 0, total: 0 },

  setSyncing: (syncing) => set({ isSyncing: syncing }),
  setLastSyncAt: (timestamp) => set({ lastSyncAt: timestamp }),
  setSyncError: (error) => set({ syncError: error }),
  updateStats: (stats) => set({ stats }),
}));

export function useSyncStore() {
  return syncStore((state) => state);
}
