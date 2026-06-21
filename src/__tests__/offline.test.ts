import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { smartCacheManager } from '../domain/offline/SmartCacheManager';
import { backgroundSyncManager } from '../domain/offline/BackgroundSyncManager';
import { dataPreloader } from '../domain/offline/DataPreloader';
import { getDatabase } from '../data/database';

// Mock AsyncStorage locally with a map
const mockStorage = new Map<string, string>();
vi.mock('@react-native-async-storage/async-storage', () => {
  return {
    default: {
      getItem: vi.fn(async (key: string) => mockStorage.get(key) || null),
      setItem: vi.fn(async (key: string, value: string) => {
        mockStorage.set(key, value);
      }),
      removeItem: vi.fn(async (key: string) => {
        mockStorage.delete(key);
      }),
      getAllKeys: vi.fn(async () => Array.from(mockStorage.keys())),
      clear: vi.fn(async () => {
        mockStorage.clear();
      }),
    },
  };
});

// Mock NetInfo
let mockNetInfoListener: ((state: any) => void) | null = null;
let mockIsOnline = true;
vi.mock('@react-native-community/netinfo', () => {
  return {
    default: {
      fetch: vi.fn(async () => ({
        type: mockIsOnline ? 'wifi' : 'none',
        isConnected: mockIsOnline,
      })),
      addEventListener: vi.fn((callback) => {
        mockNetInfoListener = callback;
        return () => {
          mockNetInfoListener = null;
        };
      }),
    },
  };
});

// Mock getDatabase
vi.mock('../data/database', () => {
  const mockFetch = vi.fn(async () => []);
  const mockQuery = vi.fn(() => ({
    fetch: mockFetch,
  }));
  const mockCreate = vi.fn(async (callback) => {
    const rec = { _raw: { id: '' } };
    callback(rec);
    return rec;
  });
  const mockFind = vi.fn(async (id) => ({
    id,
    update: vi.fn(async (callback) => {
      const r = {};
      callback(r);
    }),
    destroyPermanently: vi.fn(async () => {}),
  }));
  const mockGet = vi.fn(() => ({
    query: mockQuery,
    create: mockCreate,
    find: mockFind,
  }));
  const mockDb = {
    get: mockGet,
    write: vi.fn(async (callback) => await callback()),
  };
  return {
    getDatabase: vi.fn(async () => mockDb),
    getDatabaseInstance: vi.fn(() => mockDb),
  };
});

describe('Offline-First Enhancements Tests', () => {
  beforeEach(async () => {
    mockStorage.clear();
    mockIsOnline = true;
    mockNetInfoListener = null;
    
    // Initialize singleton managers
    await smartCacheManager.initialize();
    await backgroundSyncManager.initialize();
    await dataPreloader.initialize();
  });

  afterEach(async () => {
    await smartCacheManager.dispose();
    await backgroundSyncManager.dispose();
    await dataPreloader.dispose();
  });

  describe('SmartCacheManager', () => {
    it('should set and get cache entries correctly', async () => {
      const cacheData = { patientName: 'John Doe', score: 85 };
      await smartCacheManager.set('patient-1', cacheData);

      const cached = await smartCacheManager.get('patient-1');
      expect(cached).toEqual(cacheData);
    });

    it('should respect cache expiry', async () => {
      const cacheData = { temp: true };
      // Expire immediately (1ms expiry)
      await smartCacheManager.set('patient-expired', cacheData, 1);

      // Wait 5ms
      await new Promise(resolve => setTimeout(resolve, 5));

      const cached = await smartCacheManager.get('patient-expired');
      expect(cached).toBeNull();
    });

    it('should delete and clear cache items', async () => {
      await smartCacheManager.set('patient-2', { age: 30 });
      expect(await smartCacheManager.has('patient-2')).toBe(true);

      await smartCacheManager.delete('patient-2');
      expect(await smartCacheManager.has('patient-2')).toBe(false);
    });

    it('should evict cache entries using LRU when exceeding maxEntries limit', async () => {
      // Create a cache manager with limit of 3 entries
      const smallCache = new (smartCacheManager.constructor as any)({
        maxEntries: 3,
        enabled: true,
      });
      await smallCache.initialize();

      await smallCache.set('k1', 'v1');
      await new Promise(resolve => setTimeout(resolve, 2));
      await smallCache.set('k2', 'v2');
      await new Promise(resolve => setTimeout(resolve, 2));
      await smallCache.set('k3', 'v3');
      await new Promise(resolve => setTimeout(resolve, 2));
      
      // Access k1 to make k2 the least recently accessed (k1 accessed at t_latest)
      await smallCache.get('k1');
      await new Promise(resolve => setTimeout(resolve, 2));
      
      // Setting k4 should evict k2 (oldest accessed among k2 and k3)
      await smallCache.set('k4', 'v4');

      expect(await smallCache.get('k1')).toBe('v1');
      expect(await smallCache.get('k2')).toBeNull(); // Evicted!
      expect(await smallCache.get('k3')).toBe('v3');
      expect(await smallCache.get('k4')).toBe('v4');
      
      await smallCache.dispose();
    });
  });

  describe('BackgroundSyncManager', () => {
    it('should queue operations and calculate correct statistics', async () => {
      await backgroundSyncManager.clearQueue();
      
      await backgroundSyncManager.queueCreate('vitals_records', 'v123', { temp: 37 });
      await backgroundSyncManager.queueUpdate('nutritional_plans', 'n456', { kcal: 2000 }, 'high');
      await backgroundSyncManager.queueDelete('vitals_records', 'v789', 'critical');

      const stats = await backgroundSyncManager.getStats();
      expect(stats.totalOperations).toBe(3);
      expect(stats.pendingOperations).toBe(3);
      expect(stats.criticalOperations).toBe(1);
      expect(stats.highPriorityOperations).toBe(1);
      expect(stats.normalPriorityOperations).toBe(1);
    });

    it('should execute queued sync operations when processing queue online', async () => {
      await backgroundSyncManager.clearQueue();
      await backgroundSyncManager.queueCreate('vitals_records', 'v123', { bpSystolic: 120 });
      
      mockIsOnline = true;
      await backgroundSyncManager.processQueue();

      const stats = await backgroundSyncManager.getStats();
      // Should successfully synchronize operation
      expect(stats.pendingOperations).toBe(0);
      expect(stats.syncingOperations).toBe(0);
      expect(stats.failedOperations).toBe(0);
    });

    it('should skip synchronization when network is offline', async () => {
      await backgroundSyncManager.clearQueue();
      await backgroundSyncManager.queueCreate('vitals_records', 'v123', { bpSystolic: 120 });
      
      mockIsOnline = false;
      await backgroundSyncManager.processQueue();

      const stats = await backgroundSyncManager.getStats();
      // Queue should remain pending
      expect(stats.pendingOperations).toBe(1);
    });

    it('should process queue when network changes from offline to online', async () => {
      await backgroundSyncManager.clearQueue();
      await backgroundSyncManager.queueCreate('vitals_records', 'v123', { bpSystolic: 120 });

      mockIsOnline = true;
      if (mockNetInfoListener) {
        mockNetInfoListener({
          type: 'wifi',
          isConnected: true,
        });
      }

      // Wait a moment for async promise chain to run
      await new Promise(resolve => setTimeout(resolve, 10));

      const stats = await backgroundSyncManager.getStats();
      expect(stats.pendingOperations).toBe(0);
    });
  });

  describe('DataPreloader', () => {
    it('should run preload tasks successfully', async () => {
      // Mock db fetch return values
      const db = await getDatabase();
      const mockFetch = db.get('vitals_records').query().fetch as any;
      mockFetch.mockImplementation(async () => [{ id: 'v1', patientId: '123' }]);

      await dataPreloader.preloadPatientData('123');

      // Verify cached records
      const cachedVitals = await smartCacheManager.get('patient-123-vitals');
      expect(cachedVitals).toHaveLength(1);
    });

    it('should handle preloading all tables safely', async () => {
      await expect(dataPreloader.preloadAllData()).resolves.toBeUndefined();
    });
  });
});
