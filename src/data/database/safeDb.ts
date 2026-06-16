export function safeCollection(collection: any, fallback: any = null) {
  if (!collection) return fallback;
  return collection;
}

export function safeQuery<T = any>(collection: any, ...queryArgs: any[]): Promise<T[]> {
  if (!collection) return Promise.resolve([]);
  try {
    const q = queryArgs.length ? collection.query(...queryArgs) : collection.query();
    if (!q || !q.fetch) return Promise.resolve([]);
    return q.fetch();
  } catch {
    return Promise.resolve([]);
  }
}

export function safeFetchCount(collection: any): Promise<number> {
  if (!collection) return Promise.resolve(0);
  try {
    const q = collection.query();
    if (!q || !q.fetchCount) return Promise.resolve(0);
    return q.fetchCount();
  } catch {
    return Promise.resolve(0);
  }
}

export function safeGet(db: any, table: string) {
  if (!db || !db.get) return null;
  try {
    return db.get(table);
  } catch {
    return null;
  }
}
