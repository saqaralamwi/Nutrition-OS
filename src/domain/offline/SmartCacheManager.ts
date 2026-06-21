import AsyncStorage from '@react-native-async-storage/async-storage';
import { CacheEntry, CacheConfig, CacheStats } from '../types/offline';

export class SmartCacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private cleanupIntervalId: any = null;
  private readonly CACHE_KEY_PREFIX = 'cache_';
  private readonly CACHE_METADATA_KEY = 'cache_metadata';

  constructor(config?: CacheConfig) {
    this.config = {
      maxSize: config?.maxSize || 100 * 1024 * 1024, // 100 MB
      maxEntries: config?.maxEntries || 1000,
      defaultExpiry: config?.defaultExpiry || 24 * 60 * 60 * 1000, // 24 hours
      strategy: config?.strategy || 'always',
      cleanupInterval: config?.cleanupInterval || 60 * 60 * 1000, // 1 hour
      enabled: config?.enabled || true,
    };
  }

  /**
   * Initialize cache manager
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      console.log('[SmartCacheManager] Cache is disabled');
      return;
    }

    try {
      console.log('[SmartCacheManager] Initializing cache manager...');
      
      // Load cache from AsyncStorage
      await this.loadFromStorage();
      
      // Start cleanup interval
      this.startCleanupInterval();
      
      console.log('[SmartCacheManager] Cache manager initialized');
      console.log(`  Max size: ${this.config.maxSize} bytes`);
      console.log(`  Max entries: ${this.config.maxEntries}`);
      console.log(`  Default expiry: ${this.config.defaultExpiry}ms`);
    } catch (err: any) {
      console.error('[SmartCacheManager] Initialization failed:', err);
      throw new Error('Failed to initialize cache manager: ' + err.message);
    }
  }

  /**
   * Check if cache is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get cache entry
   */
  async get(key: string): Promise<any | null> {
    if (!this.config.enabled) {
      return null;
    }

    try {
      const entry = this.cache.get(key);
      
      if (!entry) {
        console.log(`[SmartCacheManager] Cache miss for key: ${key}`);
        return null;
      }

      // Check if entry is expired
      if (this.isExpired(entry)) {
        console.log(`[SmartCacheManager] Cache entry expired for key: ${key}`);
        await this.delete(key);
        return null;
      }

      // Update access count
      entry.accessCount++;
      entry.lastAccessed = new Date().toISOString();
      
      console.log(`[SmartCacheManager] Cache hit for key: ${key}`);
      return entry.data;
    } catch (err: any) {
      console.error(`[SmartCacheManager] Get failed for key: ${key}:`, err);
      return null;
    }
  }

  /**
   * Set cache entry
   */
  async set(key: string, data: any, expiry?: number): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const entry: CacheEntry = {
        id: `cache-${key}-${Date.now()}`,
        key,
        data,
        timestamp: new Date().toISOString(),
        expiry: expiry || this.config.defaultExpiry,
        size: this.calculateSize(data),
        accessCount: 1,
        lastAccessed: new Date().toISOString(),
      };

      // Check if we need to evict entries
      await this.evictIfNeeded(entry);

      // Add to cache
      this.cache.set(key, entry);
      
      // Save to storage
      await this.saveToStorage(key, entry);
      
      console.log(`[SmartCacheManager] Cache set for key: ${key}`);
      console.log(`  Size: ${entry.size} bytes`);
    } catch (err: any) {
      console.error(`[SmartCacheManager] Set failed for key: ${key}:`, err);
      throw new Error(`Failed to set cache: ${key} - ${err.message}`);
    }
  }

  /**
   * Delete cache entry
   */
  async delete(key: string): Promise<void> {
    try {
      const entry = this.cache.get(key);
      
      if (!entry) {
        return;
      }

      this.cache.delete(key);
      
      // Remove from storage
      await AsyncStorage.removeItem(this.CACHE_KEY_PREFIX + key);
      
      console.log(`[SmartCacheManager] Cache deleted for key: ${key}`);
    } catch (err) {
      console.error(`[SmartCacheManager] Delete failed for key: ${key}:`, err);
    }
  }

  /**
   * Check if cache entry exists
   */
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      await this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      console.log('[SmartCacheManager] Clearing all cache...');
      
      this.cache.clear();
      
      // Clear all storage keys
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_KEY_PREFIX));
      
      for (const cacheKey of cacheKeys) {
        await AsyncStorage.removeItem(cacheKey);
      }
      
      console.log('[SmartCacheManager] All cache cleared');
    } catch (err: any) {
      console.error('[SmartCacheManager] Clear failed:', err);
      throw new Error('Failed to clear cache: ' + err.message);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    
    const hitCount = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    const totalRequests = hitCount + entries.length; // rough estimate
    
    return {
      totalEntries: entries.length,
      totalSize: this.config.maxSize,
      usedSize: totalSize,
      availableSize: this.config.maxSize - totalSize,
      hitRate: totalRequests > 0 ? hitCount / totalRequests : 0,
      missRate: totalRequests > 0 ? (totalRequests - hitCount) / totalRequests : 0,
      evictionCount: 0,
      cleanupCount: 0,
    };
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    const now = new Date().toISOString();
    const expiryTime = new Date(entry.timestamp).getTime() + entry.expiry;
    const currentTime = new Date(now).getTime();
    
    return currentTime > expiryTime;
  }

  /**
   * Calculate size of data
   */
  private calculateSize(data: any): number {
    try {
      const serialized = JSON.stringify(data);
      return serialized.length * 2; // UTF-16 bytes
    } catch {
      return 0;
    }
  }

  /**
   * Evict entries if needed
   */
  private async evictIfNeeded(newEntry: CacheEntry): Promise<void> {
    const currentSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0);
    
    const newSize = currentSize + newEntry.size;

    // Evict if exceeding max size
    if (newSize > this.config.maxSize) {
      await this.evictBySize(newSize - this.config.maxSize);
    }

    // Evict if exceeding max entries
    if (this.cache.size >= this.config.maxEntries) {
      await this.evictByCount(1);
    }
  }

  /**
   * Evict by size (LRU - Least Recently Used)
   */
  private async evictBySize(targetSize: number): Promise<void> {
    let toEvict = targetSize;
    
    // Sort by last accessed (oldest first)
    const sorted = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastAccessed.localeCompare(b[1].lastAccessed));
    
    for (const [key, entry] of sorted) {
      if (toEvict <= 0) break;
      
      this.cache.delete(key);
      await AsyncStorage.removeItem(this.CACHE_KEY_PREFIX + key);
      
      toEvict -= entry.size;
      console.log(`[SmartCacheManager] Evicted entry: ${key} (${entry.size} bytes)`);
    }
  }

  /**
   * Evict by count (LRU)
   */
  private async evictByCount(count: number): Promise<void> {
    // Sort by last accessed (oldest first)
    const sorted = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastAccessed.localeCompare(b[1].lastAccessed));
    
    for (let i = 0; i < count && i < sorted.length; i++) {
      const [key, entry] = sorted[i];
      
      this.cache.delete(key);
      await AsyncStorage.removeItem(this.CACHE_KEY_PREFIX + key);
      
      console.log(`[SmartCacheManager] Evicted entry: ${key}`);
    }
  }

  /**
   * Load cache from storage
   */
  private async loadFromStorage(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_KEY_PREFIX));
      
      for (const cacheKey of cacheKeys) {
        const data = await AsyncStorage.getItem(cacheKey);
        
        if (data) {
          const entry = JSON.parse(data) as CacheEntry;
          this.cache.set(entry.key, entry);
        }
      }
      
      console.log(`[SmartCacheManager] Loaded ${this.cache.size} entries from storage`);
    } catch (err) {
      console.error('[SmartCacheManager] Load from storage failed:', err);
    }
  }

  /**
   * Save cache to storage
   */
  private async saveToStorage(key: string, entry: CacheEntry): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CACHE_KEY_PREFIX + key, JSON.stringify(entry));
    } catch (err) {
      console.error(`[SmartCacheManager] Save to storage failed for key: ${key}:`, err);
    }
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    if (this.cleanupIntervalId) {
      return;
    }

    this.cleanupIntervalId = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);

    console.log(`[SmartCacheManager] Cleanup interval started (${this.config.cleanupInterval}ms)`);
  }

  /**
   * Stop cleanup interval
   */
  stopCleanupInterval(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
      console.log('[SmartCacheManager] Cleanup interval stopped');
    }
  }

  /**
   * Cleanup expired entries
   */
  async cleanup(): Promise<void> {
    try {
      console.log('[SmartCacheManager] Running cleanup...');
      
      const expiredKeys = Array.from(this.cache.entries())
        .filter(([_, entry]) => this.isExpired(entry))
        .map(([key]) => key);
      
      for (const key of expiredKeys) {
        await this.delete(key);
      }
      
      console.log(`[SmartCacheManager] Cleanup completed. Expired ${expiredKeys.length} entries`);
    } catch (err) {
      console.error('[SmartCacheManager] Cleanup failed:', err);
    }
  }

  /**
   * Dispose cache manager
   */
  async dispose(): Promise<void> {
    this.stopCleanupInterval();
    await this.clear();
    console.log('[SmartCacheManager] Cache manager disposed');
  }
}

// Singleton instance
export const smartCacheManager = new SmartCacheManager();
