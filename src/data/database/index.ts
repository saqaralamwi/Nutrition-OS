import type { Database } from '@nozbe/watermelondb';

const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

export async function getDatabase(): Promise<Database> {
  if (isWeb) {
    const mod = await import('./index.web');
    return mod.getDatabase();
  }
  const mod = await import('./index.native');
  return mod.getDatabase();
}

export function getDatabaseInstance(): Database | null {
  if (isWeb) {
    const key = '__WATERMELONDB_WEB__';
    return (globalThis as any)[key] ?? null;
  }
  const key = '__WATERMELONDB_NATIVE__';
  return (globalThis as any)[key] ?? null;
}

export async function resetDatabase(): Promise<void> {
  if (isWeb) {
    const mod = await import('./index.web');
    return mod.resetDatabase();
  }
  const mod = await import('./index.native');
  return mod.resetDatabase();
}
