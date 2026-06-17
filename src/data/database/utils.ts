import { Database } from '@nozbe/watermelondb';

/**
 * Ensures that the WatermelonDB adapter (especially LokiJS on Web) is fully initialized
 * and ready to handle queries. This prevents "Cannot read properties of null (reading 'chain')"
 * errors that occur when querying LokiJS before it has loaded from IndexedDB.
 */
export async function waitForDatabaseReady(db: Database): Promise<void> {
  const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';
  if (!isWeb) return;

  let retries = 0;
  const maxRetries = 20;
  
  while (retries < maxRetries) {
    try {
      // Perform a simple count query on a table that is guaranteed to exist
      // We use 'settings' as it's a core table present in most clinical apps
      await db.get('settings').query().fetchCount();
      return;
    } catch (error: any) {
      // LokiJS internal error "chain of null" usually means it's still loading from IndexedDB
      if (error?.message?.includes('chain') || error?.message?.includes('null')) {
        console.log(`[Database] Waiting for LokiJS readiness... (attempt ${retries + 1})`);
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      } else if (error?.message?.includes('not found')) {
        // Table might not exist yet if schema is being initialized
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      } else {
        // For other errors, we still wait a bit as it might be an initialization race
        await new Promise((resolve) => setTimeout(resolve, 100));
        retries++;
      }
    }
  }
  console.warn('[Database] Max retries reached while waiting for readiness. Proceeding anyway...');
}
