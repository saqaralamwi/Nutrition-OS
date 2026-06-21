import NetInfo from '@react-native-community/netinfo';
import { SyncOperation, SyncConfig, SyncPriority, OfflineQueueStats } from '../types/offline';
import { getDatabase } from '../../data/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class BackgroundSyncManager {
  private operations: Map<string, SyncOperation> = new Map();
  private config: SyncConfig;
  private syncIntervalId: any = null;
  private isSyncing: boolean = false;
  private lastSyncTime: string = 'Never';
  private readonly QUEUE_KEY = 'offline_queue';
  private readonly SYNC_STATUS_KEY = 'sync_status';

  constructor(config?: SyncConfig) {
    this.config = {
      enabled: config?.enabled || true,
      interval: config?.interval || 5 * 60 * 1000, // 5 minutes
      batchSize: config?.batchSize || 10,
      maxRetries: config?.maxRetries || 3,
      retryDelay: config?.retryDelay || 5 * 60 * 1000, // 5 minutes
      conflictResolution: config?.conflictResolution || 'local-wins',
      priorityOrder: config?.priorityOrder || ['critical', 'high', 'normal', 'low'],
    };
  }

  /**
   * Initialize sync manager
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      console.log('[BackgroundSyncManager] Sync is disabled');
      return;
    }

    try {
      console.log('[BackgroundSyncManager] Initializing sync manager...');
      
      // Load queue from storage
      await this.loadFromStorage();

      // Load last sync time
      const statusData = await AsyncStorage.getItem(this.SYNC_STATUS_KEY);
      if (statusData) {
        try {
          const parsed = JSON.parse(statusData);
          this.lastSyncTime = parsed.lastSyncTime || 'Never';
        } catch {
          this.lastSyncTime = 'Never';
        }
      }
      
      // Start sync interval
      this.startSyncInterval();
      
      // Listen for network changes
      this.listenForNetworkChanges();
      
      console.log('[BackgroundSyncManager] Sync manager initialized');
      console.log(`  Interval: ${this.config.interval}ms`);
      console.log(`  Batch size: ${this.config.batchSize}`);
      console.log(`  Max retries: ${this.config.maxRetries}`);
    } catch (err: any) {
      console.error('[BackgroundSyncManager] Initialization failed:', err);
      throw new Error('Failed to initialize sync manager: ' + err.message);
    }
  }

  /**
   * Check if sync is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Add operation to queue
   */
  async addOperation(operation: SyncOperation): Promise<void> {
    try {
      this.operations.set(operation.id, operation);
      
      await this.saveToStorage();
      
      console.log(`[BackgroundSyncManager] Operation added: ${operation.id}`);
      console.log(`  Type: ${operation.type}`);
      console.log(`  Priority: ${operation.priority}`);
    } catch (err: any) {
      console.error('[BackgroundSyncManager] Add operation failed:', err);
      throw new Error('Failed to add operation: ' + err.message);
    }
  }

  /**
   * Queue create operation
   */
  async queueCreate(collection: string, recordId: string, data: any, priority: SyncPriority = 'normal'): Promise<void> {
    const operation: SyncOperation = {
      id: `sync-${collection}-${recordId}-${Date.now()}`,
      type: 'create',
      collection,
      recordId,
      data,
      priority,
      status: 'pending',
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: this.config.maxRetries,
    };

    await this.addOperation(operation);
  }

  /**
   * Queue update operation
   */
  async queueUpdate(collection: string, recordId: string, data: any, priority: SyncPriority = 'normal'): Promise<void> {
    const operation: SyncOperation = {
      id: `sync-${collection}-${recordId}-${Date.now()}`,
      type: 'update',
      collection,
      recordId,
      data,
      priority,
      status: 'pending',
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: this.config.maxRetries,
    };

    await this.addOperation(operation);
  }

  /**
   * Queue delete operation
   */
  async queueDelete(collection: string, recordId: string, priority: SyncPriority = 'normal'): Promise<void> {
    const operation: SyncOperation = {
      id: `sync-${collection}-${recordId}-${Date.now()}`,
      type: 'delete',
      collection,
      recordId,
      data: null,
      priority,
      status: 'pending',
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: this.config.maxRetries,
    };

    await this.addOperation(operation);
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<OfflineQueueStats> {
    const operations = Array.from(this.operations.values());
    
    const pending = operations.filter(op => op.status === 'pending');
    const syncing = operations.filter(op => op.status === 'syncing');
    const failed = operations.filter(op => op.status === 'failed');
    
    const critical = operations.filter(op => op.priority === 'critical');
    const high = operations.filter(op => op.priority === 'high');
    const normal = operations.filter(op => op.priority === 'normal');
    const low = operations.filter(op => op.priority === 'low');
    
    const totalSize = operations.reduce((sum, op) => sum + JSON.stringify(op.data || {}).length, 0);

    return {
      totalOperations: operations.length,
      pendingOperations: pending.length,
      syncingOperations: syncing.length,
      failedOperations: failed.length,
      criticalOperations: critical.length,
      highPriorityOperations: high.length,
      normalPriorityOperations: normal.length,
      lowPriorityOperations: low.length,
      totalSize: totalSize,
      lastSyncTime: this.getLastSyncTime(),
      nextSyncTime: this.getNextSyncTime(),
    };
  }

  /**
   * Process queue (sync operations)
   */
  async processQueue(): Promise<void> {
    if (this.isSyncing) {
      console.log('[BackgroundSyncManager] Sync already in progress');
      return;
    }

    try {
      // Check if online
      const isOnline = await this.isNetworkOnline();
      
      if (!isOnline) {
        console.log('[BackgroundSyncManager] Network offline. Skipping sync.');
        return;
      }

      this.isSyncing = true;
      console.log('[BackgroundSyncManager] Starting queue processing...');

      // Get pending operations by priority
      const pendingOps = this.getPendingOperationsByPriority();
      
      if (pendingOps.length === 0) {
        console.log('[BackgroundSyncManager] No pending operations');
        this.isSyncing = false;
        return;
      }

      // Process in batches
      for (let i = 0; i < pendingOps.length; i += this.config.batchSize) {
        const batch = pendingOps.slice(i, i + this.config.batchSize);
        
        await this.processBatch(batch);
      }

      // Save updated queue
      await this.saveToStorage();
      
      // Update last sync time
      await this.updateLastSyncTime();
      
      console.log('[BackgroundSyncManager] Queue processing completed');
      this.isSyncing = false;
    } catch (err: any) {
      console.error('[BackgroundSyncManager] Queue processing failed:', err);
      this.isSyncing = false;
      throw new Error('Failed to process queue: ' + err.message);
    }
  }

  /**
   * Get pending operations by priority
   */
  private getPendingOperationsByPriority(): SyncOperation[] {
    const pending = Array.from(this.operations.values())
      .filter(op => op.status === 'pending');
    
    // Sort by priority
    return pending.sort((a, b) => {
      const aIndex = this.config.priorityOrder.indexOf(a.priority);
      const bIndex = this.config.priorityOrder.indexOf(b.priority);
      return aIndex - bIndex;
    });
  }

  /**
   * Process batch of operations
   */
  private async processBatch(operations: SyncOperation[]): Promise<void> {
    console.log(`[BackgroundSyncManager] Processing batch of ${operations.length} operations`);

    for (const operation of operations) {
      try {
        operation.status = 'syncing';
        
        // Execute operation
        await this.executeOperation(operation);
        
        operation.status = 'synced';
        console.log(`[BackgroundSyncManager] Operation synced: ${operation.id}`);
      } catch (err: any) {
        operation.retryCount++;
        
        if (operation.retryCount >= operation.maxRetries) {
          operation.status = 'failed';
          operation.error = err.message;
          console.error(`[BackgroundSyncManager] Operation failed: ${operation.id}`, err);
        } else {
          operation.status = 'pending';
          console.log(`[BackgroundSyncManager] Operation retry ${operation.retryCount}: ${operation.id}`);
        }
      }
    }
  }

  /**
   * Execute operation
   */
  private async executeOperation(operation: SyncOperation): Promise<void> {
    try {
      const db = await getDatabase();
      const collection = db.get(operation.collection);

      if (operation.type === 'create') {
        await db.write(async () => {
          await collection.create((record: any) => {
            record._raw.id = operation.recordId;
            Object.assign(record, operation.data);
          });
        });
      } else if (operation.type === 'update') {
        const record = await collection.find(operation.recordId);
        await db.write(async () => {
          await record.update((r: any) => {
            Object.assign(r, operation.data);
          });
        });
      } else if (operation.type === 'delete') {
        const record = await collection.find(operation.recordId);
        await db.write(async () => {
          await record.destroyPermanently();
        });
      }
    } catch (err) {
      console.error(`[BackgroundSyncManager] Execute operation failed: ${operation.id}:`, err);
      throw err;
    }
  }

  /**
   * Check if network is online
   */
  private async isNetworkOnline(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.type !== 'none' && state.type !== 'unknown';
    } catch (err) {
      console.error('[BackgroundSyncManager] Get network info failed:', err);
      return false;
    }
  }

  /**
   * Listen for network changes
   */
  private listenForNetworkChanges(): void {
    NetInfo.addEventListener(state => {
      console.log('[BackgroundSyncManager] Network changed:', state);
      
      if (state.type !== 'none' && state.type !== 'unknown') {
        // Network is online. Process queue
        this.processQueue();
      }
    });

    console.log('[BackgroundSyncManager] Network listener registered');
  }

  /**
   * Start sync interval
   */
  private startSyncInterval(): void {
    if (this.syncIntervalId) {
      return;
    }

    this.syncIntervalId = setInterval(() => {
      this.processQueue();
    }, this.config.interval);

    console.log(`[BackgroundSyncManager] Sync interval started (${this.config.interval}ms)`);
  }

  /**
   * Stop sync interval
   */
  stopSyncInterval(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
      console.log('[BackgroundSyncManager] Sync interval stopped');
    }
  }

  /**
   * Load queue from storage
   */
  private async loadFromStorage(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(this.QUEUE_KEY);
      
      if (queueData) {
        const queue = JSON.parse(queueData);
        
        for (const op of queue) {
          this.operations.set(op.id, op);
        }
      }
      
      console.log(`[BackgroundSyncManager] Loaded ${this.operations.size} operations from storage`);
    } catch (err) {
      console.error('[BackgroundSyncManager] Load from storage failed:', err);
    }
  }

  /**
   * Save queue to storage
   */
  private async saveToStorage(): Promise<void> {
    try {
      const queue = Array.from(this.operations.values());
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    } catch (err) {
      console.error('[BackgroundSyncManager] Save to storage failed:', err);
    }
  }

  /**
   * Update last sync time
   */
  private async updateLastSyncTime(): Promise<void> {
    try {
      const timeStr = new Date().toISOString();
      this.lastSyncTime = timeStr;
      await AsyncStorage.setItem(this.SYNC_STATUS_KEY, JSON.stringify({
        lastSyncTime: timeStr,
      }));
    } catch (err) {
      console.error('[BackgroundSyncManager] Update last sync time failed:', err);
    }
  }

  /**
   * Get last sync time
   */
  private getLastSyncTime(): string {
    return this.lastSyncTime;
  }

  /**
   * Get next sync time
   */
  private getNextSyncTime(): string {
    const nextTime = new Date(Date.now() + this.config.interval);
    return nextTime.toISOString();
  }

  /**
   * Clear queue
   */
  async clearQueue(): Promise<void> {
    try {
      this.operations.clear();
      await AsyncStorage.removeItem(this.QUEUE_KEY);
      
      console.log('[BackgroundSyncManager] Queue cleared');
    } catch (err) {
      console.error('[BackgroundSyncManager] Clear queue failed:', err);
    }
  }

  /**
   * Dispose sync manager
   */
  async dispose(): Promise<void> {
    this.stopSyncInterval();
    await this.clearQueue();
    console.log('[BackgroundSyncManager] Sync manager disposed');
  }
}

// Singleton instance
export const backgroundSyncManager = new BackgroundSyncManager();
