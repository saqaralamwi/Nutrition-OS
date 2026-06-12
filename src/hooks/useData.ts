import { useState, useCallback } from 'react';

const DB_NOT_READY = 'قاعدة البيانات قيد إعادة البناء (Phase 2). الرجاء المحاولة لاحقاً.';

interface UseDataResult {
  items: Record<string, any>[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createItem: (data: Record<string, any>) => Promise<Record<string, any> | null>;
  updateItem: (id: string, data: Record<string, any>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  isSyncing: boolean;
  isOnline: boolean;
  syncNow: () => Promise<void>;
}

export function useData(
  _table: string,
  _query?: any,
  _deps: any[] = []
): UseDataResult {
  const [items] = useState<Record<string, any>[]>([]);
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(DB_NOT_READY);
  const [isSyncing] = useState(false);
  const [isOnline] = useState(true);

  const noop = useCallback(async () => {}, []);

  const throwNotReady = useCallback(async (): Promise<any> => {
    throw new Error(DB_NOT_READY);
  }, []);

  return {
    items,
    isLoading,
    error,
    refresh: noop,
    createItem: throwNotReady,
    updateItem: throwNotReady,
    deleteItem: throwNotReady,
    isSyncing,
    isOnline,
    syncNow: noop,
  };
}
