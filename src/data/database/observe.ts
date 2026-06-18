import { Observable } from 'rxjs';
import { Model, Query, Q } from '@nozbe/watermelondb';
import { getDatabase } from './index';
import PatientModel from '../models/Patient';

/**
 * Watch all patients reactively, sorted by creation date (newest first).
 * Automatically emits new results on any insert/update/delete in the patients table.
 */
export function observePatients(whereClause?: Record<string, any>): Observable<PatientModel[]> {
  return watchQuery<PatientModel>((db) => {
    let q = db.get('patients').query(Q.sortBy('created_at', Q.desc));
    if (whereClause) {
      const conditions: any[] = [Q.sortBy('created_at', Q.desc)];
      Object.keys(whereClause).forEach((key) => {
        conditions.push(Q.where(key, whereClause[key]));
      });
      if (conditions.length > 1) {
        q = db.get('patients').query(...conditions);
      }
    }
    return q;
  });
}

/**
 * Watch a WatermelonDB query reactively.
 * Handles the asynchronous retrieval of the database instance.
 *
 * @param queryFactory Function that creates a WatermelonDB Query object using the database instance.
 */
export function watchQuery<T extends Model>(
  queryFactory: (db: any) => Query<T>
): Observable<T[]> {
  return new Observable<T[]>((subscriber) => {
    let active = true;
    let subscription: any = null;

    async function init() {
      try {
        const db = await getDatabase();
        if (!active) return;
        const query = queryFactory(db);
        const queryObs = query.observe();
        subscription = queryObs.subscribe({
          next: (results) => {
            if (active) subscriber.next(results);
          },
          error: (err) => {
            if (active) subscriber.error(err);
          },
          complete: () => {
            if (active) subscriber.complete();
          },
        });
      } catch (err) {
        if (active) subscriber.error(err);
      }
    }

    init();

    return () => {
      active = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  });
}

/**
 * Watch a single WatermelonDB record reactively by its ID.
 * Returns null if the record does not exist or gets deleted.
 *
 * @param tableName Name of the collection / table
 * @param id The unique identifier of the record
 */
export function watchRecord<T extends Model>(
  tableName: string,
  id: string
): Observable<T | null> {
  return new Observable<T | null>((subscriber) => {
    let active = true;
    let subscription: any = null;

    async function init() {
      try {
        const db = await getDatabase();
        if (!active) return;
        const query = db.get<T>(tableName).query(Q.where('id', id));
        const queryObs = query.observe();
        subscription = queryObs.subscribe({
          next: (results) => {
            if (active) {
              subscriber.next(results.length > 0 ? results[0] : null);
            }
          },
          error: (err) => {
            if (active) subscriber.error(err);
          },
          complete: () => {
            if (active) subscriber.complete();
          },
        });
      } catch (err) {
        if (active) subscriber.error(err);
      }
    }

    init();

    return () => {
      active = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  });
}
