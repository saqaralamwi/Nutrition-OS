// Sync status
export type SyncStatus = 
  | 'pending' 
  | 'syncing' 
  | 'synced' 
  | 'failed'
  | 'conflicted';

// Sync priority
export type SyncPriority = 
  | 'low' 
  | 'normal' 
  | 'high' 
  | 'critical';

// Sync operation type
export type SyncOperationType = 
  | 'create' 
  | 'update' 
  | 'delete'
  | 'merge';

// Cache strategy
export type CacheStrategy = 
  | 'always' 
  | 'when-online' 
  | 'when-offline'
  | 'custom';

// Sync operation
export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  collection: string;
  recordId: string;
  data: any;
  priority: SyncPriority;
  status: SyncStatus;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
  error?: string;
}

// Cache entry
export interface CacheEntry {
  id: string;
  key: string;
  data: any;
  timestamp: string;
  expiry: number; // milliseconds
  size: number; // bytes
  accessCount: number;
  lastAccessed: string;
  collection?: string;
  recordId?: string;
}

// Cache configuration
export interface CacheConfig {
  maxSize: number; // bytes
  maxEntries: number;
  defaultExpiry: number; // milliseconds
  strategy: CacheStrategy;
  cleanupInterval: number; // milliseconds
  enabled: boolean;
}

// Sync configuration
export interface SyncConfig {
  enabled: boolean;
  interval: number; // milliseconds
  batchSize: number;
  maxRetries: number;
  retryDelay: number; // milliseconds
  conflictResolution: 'local-wins' | 'remote-wins' | 'manual';
  priorityOrder: SyncPriority[];
}

// Network status
export interface NetworkStatus {
  isOnline: boolean;
  connectivity: 'none' | 'maybe' | 'yes';
  lastKnownOnline: string;
  lastKnownOffline: string;
  connectionType: 'unknown' | 'wifi' | 'mobile' | 'none';
}

// Offline queue statistics
export interface OfflineQueueStats {
  totalOperations: number;
  pendingOperations: number;
  syncingOperations: number;
  failedOperations: number;
  criticalOperations: number;
  highPriorityOperations: number;
  normalPriorityOperations: number;
  lowPriorityOperations: number;
  totalSize: number; // bytes
  lastSyncTime: string;
  nextSyncTime: string;
}

// Cache statistics
export interface CacheStats {
  totalEntries: number;
  totalSize: number; // bytes
  usedSize: number; // bytes
  availableSize: number; // bytes
  hitRate: number; // 0-1
  missRate: number; // 0-1
  evictionCount: number;
  cleanupCount: number;
}

// Preload task
export interface PreloadTask {
  id: string;
  name: string;
  collection: string;
  criteria: any;
  priority: SyncPriority;
  isCompleted: boolean;
  progress: number; // 0-1
  estimatedSize: number; // bytes
  startedAt: string;
  completedAt?: string;
}

// Sync conflict
export interface SyncConflict {
  id: string;
  operationId: string;
  localData: any;
  remoteData: any;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: 'local' | 'remote' | 'manual';
  resolution?: any;
}
