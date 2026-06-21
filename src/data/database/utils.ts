import { Database } from '@nozbe/watermelondb';

export async function waitForDatabaseReady(
  db: Database,
  isSetupFailed?: () => boolean,
): Promise<void> {
  const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';
  if (!isWeb) return;

  let retries = 0;
  const maxRetries = 50;

  while (retries < maxRetries) {
    if (isSetupFailed?.()) {
      throw new Error('[Database] Setup failure detected (e.g. migration failed). Aborting wait.');
    }

    try {
      await db.get('settings').query().fetchCount();
      return;
    } catch (error: any) {
      const msg = error?.message?.toLowerCase() || '';
      const isRetryable =
        msg.includes('chain') ||
        msg.includes('null') ||
        msg.includes('driver is not set up') ||
        msg.includes('not found');

      if (isRetryable) {
        console.log(`[Database] Waiting for LokiJS readiness... (attempt ${retries + 1}/${maxRetries})`);
      } else {
        console.log(`[Database] Retrying after unexpected error (attempt ${retries + 1}/${maxRetries}):`, error);
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
      retries++;
    }
  }

  throw new Error(`[Database] Max retries (${maxRetries}) reached. Database failed to become ready.`);
}
